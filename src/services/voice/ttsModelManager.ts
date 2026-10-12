import * as FileSystem from 'expo-file-system/legacy';
import { TTS_MODEL_FILES } from '../../constants/tts';

export function getTtsModelDir(): string {
  const docDir = FileSystem.documentDirectory || '';
  return `${docDir}models/kokoro/`;
}

export const getTtsModelDirectory = getTtsModelDir;

/**
 * Checks whether all required Kokoro TTS model files are downloaded and valid.
 */
export async function isTtsModelDownloaded(): Promise<boolean> {
  try {
    const dir = getTtsModelDir();
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      return false;
    }

    // Check main ONNX model
    const modelInfo = await FileSystem.getInfoAsync(`${dir}${TTS_MODEL_FILES.model.filename}`);
    if (!modelInfo.exists || ((modelInfo as any).size || 0) < TTS_MODEL_FILES.model.minBytes) {
      return false;
    }

    // Check voices.bin
    const voicesInfo = await FileSystem.getInfoAsync(`${dir}${TTS_MODEL_FILES.voices.filename}`);
    if (!voicesInfo.exists || ((voicesInfo as any).size || 0) < TTS_MODEL_FILES.voices.minBytes) {
      return false;
    }

    // Check tokens.txt
    const tokensInfo = await FileSystem.getInfoAsync(`${dir}${TTS_MODEL_FILES.tokens.filename}`);
    if (!tokensInfo.exists || ((tokensInfo as any).size || 0) < TTS_MODEL_FILES.tokens.minBytes) {
      return false;
    }

    // Check lexicon
    const lexiconInfo = await FileSystem.getInfoAsync(`${dir}${TTS_MODEL_FILES.lexicon.filename}`);
    if (!lexiconInfo.exists || ((lexiconInfo as any).size || 0) < TTS_MODEL_FILES.lexicon.minBytes) {
      return false;
    }

    // Check espeak-ng-data files
    for (const ef of TTS_MODEL_FILES.espeakFiles) {
      const eInfo = await FileSystem.getInfoAsync(`${dir}espeak-ng-data/${ef.name}`);
      if (!eInfo.exists || ((eInfo as any).size || 0) < ef.minBytes) {
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('[ttsModelManager] Error checking TTS model status:', err);
    return false;
  }
}

/**
 * Download a file with resumable download helper.
 */
async function downloadFile(
  url: string,
  destPath: string,
  minBytes: number,
  onFileProgress?: (bytesWritten: number, totalExpected: number) => void
): Promise<void> {
  const stagingPath = `${destPath}.part`;

  // Clean staging file
  const stagingInfo = await FileSystem.getInfoAsync(stagingPath);
  if (stagingInfo.exists) {
    await FileSystem.deleteAsync(stagingPath, { idempotent: true });
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    stagingPath,
    {},
    (p) => {
      onFileProgress?.(p.totalBytesWritten, p.totalBytesExpectedToWrite);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result?.uri) {
    throw new Error(`Download failed for ${url}`);
  }

  const downloadedInfo = await FileSystem.getInfoAsync(stagingPath);
  const downloadedBytes = (downloadedInfo as any).size || 0;
  if (downloadedBytes < minBytes) {
    throw new Error(`File too small: ${downloadedBytes} bytes (min: ${minBytes}) for ${url}`);
  }

  // Move staging to destination
  const destInfo = await FileSystem.getInfoAsync(destPath);
  if (destInfo.exists) {
    await FileSystem.deleteAsync(destPath, { idempotent: true });
  }
  await FileSystem.moveAsync({ from: stagingPath, to: destPath });
}

/**
 * Download the complete Kokoro-82M TTS model suite with overall progress tracking.
 */
export async function downloadTtsModel(
  onProgress?: (percent: number, writtenMB: number, totalMB: number) => void
): Promise<string> {
  const dir = getTtsModelDir();
  const espeakDir = `${dir}espeak-ng-data/`;

  // Ensure directories exist
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  await FileSystem.makeDirectoryAsync(espeakDir, { intermediates: true });

  const totalExpectedMB = TTS_MODEL_FILES.totalSizeMB;
  let accumulatedBytes = 0;

  const updateProgress = (currentFileWritten: number) => {
    const totalWritten = accumulatedBytes + currentFileWritten;
    const writtenMB = Number((totalWritten / (1024 * 1024)).toFixed(1));
    const pct = Math.min(100, Math.max(0, Math.round((writtenMB / totalExpectedMB) * 100)));
    onProgress?.(pct, writtenMB, totalExpectedMB);
  };

  // 1. model.onnx (~310 MB)
  const modelPath = `${dir}${TTS_MODEL_FILES.model.filename}`;
  const modelInfo = await FileSystem.getInfoAsync(modelPath);
  if (!modelInfo.exists || ((modelInfo as any).size || 0) < TTS_MODEL_FILES.model.minBytes) {
    console.log('[ttsModelManager] Downloading model.onnx...');
    await downloadFile(
      TTS_MODEL_FILES.model.url,
      modelPath,
      TTS_MODEL_FILES.model.minBytes,
      (written) => updateProgress(written)
    );
  }
  accumulatedBytes += TTS_MODEL_FILES.model.sizeMB * 1024 * 1024;
  updateProgress(0);

  // 2. voices.bin (~27 MB)
  const voicesPath = `${dir}${TTS_MODEL_FILES.voices.filename}`;
  const voicesInfo = await FileSystem.getInfoAsync(voicesPath);
  if (!voicesInfo.exists || ((voicesInfo as any).size || 0) < TTS_MODEL_FILES.voices.minBytes) {
    console.log('[ttsModelManager] Downloading voices.bin...');
    await downloadFile(
      TTS_MODEL_FILES.voices.url,
      voicesPath,
      TTS_MODEL_FILES.voices.minBytes,
      (written) => updateProgress(written)
    );
  }
  accumulatedBytes += TTS_MODEL_FILES.voices.sizeMB * 1024 * 1024;
  updateProgress(0);

  // 3. tokens.txt
  const tokensPath = `${dir}${TTS_MODEL_FILES.tokens.filename}`;
  const tokensInfo = await FileSystem.getInfoAsync(tokensPath);
  if (!tokensInfo.exists || ((tokensInfo as any).size || 0) < TTS_MODEL_FILES.tokens.minBytes) {
    console.log('[ttsModelManager] Downloading tokens.txt...');
    await downloadFile(
      TTS_MODEL_FILES.tokens.url,
      tokensPath,
      TTS_MODEL_FILES.tokens.minBytes
    );
  }

  // 4. lexicon-us-en.txt (~5.7 MB)
  const lexiconPath = `${dir}${TTS_MODEL_FILES.lexicon.filename}`;
  const lexiconInfo = await FileSystem.getInfoAsync(lexiconPath);
  if (!lexiconInfo.exists || ((lexiconInfo as any).size || 0) < TTS_MODEL_FILES.lexicon.minBytes) {
    console.log('[ttsModelManager] Downloading lexicon-us-en.txt...');
    await downloadFile(
      TTS_MODEL_FILES.lexicon.url,
      lexiconPath,
      TTS_MODEL_FILES.lexicon.minBytes,
      (written) => updateProgress(written)
    );
  }
  accumulatedBytes += TTS_MODEL_FILES.lexicon.sizeMB * 1024 * 1024;
  updateProgress(0);

  // 5. espeak-ng-data files
  for (const ef of TTS_MODEL_FILES.espeakFiles) {
    const ePath = `${espeakDir}${ef.name}`;
    const lastSlash = ePath.lastIndexOf('/');
    if (lastSlash !== -1) {
      const parentDir = ePath.substring(0, lastSlash);
      await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
    }
    const eInfo = await FileSystem.getInfoAsync(ePath);
    if (!eInfo.exists || ((eInfo as any).size || 0) < ef.minBytes) {
      console.log(`[ttsModelManager] Downloading espeak ${ef.name}...`);
      await downloadFile(ef.url, ePath, ef.minBytes);
    }
  }

  onProgress?.(100, totalExpectedMB, totalExpectedMB);
  console.log('[ttsModelManager] Kokoro model assets successfully installed at:', dir);
  return dir;
}

/**
 * Deletes Kokoro TTS model files from local storage to reclaim disk space.
 */
export async function deleteTtsModel(): Promise<void> {
  const dir = getTtsModelDir();
  await FileSystem.deleteAsync(dir, { idempotent: true });
}
