import * as FileSystem from 'expo-file-system/legacy';
import { SPEECH_MODEL } from '../../constants/speechModels';

/**
 * Get the local path where the speech model is stored.
 */
export function getSpeechModelPath(): string {
  const docDir = FileSystem.documentDirectory || '';
  return `${docDir}models/${SPEECH_MODEL.filename}`;
}

/**
 * Check if the speech recognition model is already downloaded and valid.
 */
export async function isSpeechModelDownloaded(): Promise<boolean> {
  try {
    const path = getSpeechModelPath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      return false;
    }
    const size = (info as any).size || 0;
    return size >= SPEECH_MODEL.minBytes;
  } catch (err) {
    console.warn('[speechModelManager] Error checking speech model:', err);
    return false;
  }
}

/**
 * Download the offline Whisper speech model with progress updates and fallback mirror.
 */
export async function downloadSpeechModel(
  onProgress?: (percent: number, writtenMB: number, totalMB: number) => void
): Promise<string> {
  const docDir = FileSystem.documentDirectory || '';
  const modelsDir = `${docDir}models/`;
  const finalPath = `${modelsDir}${SPEECH_MODEL.filename}`;
  const stagingPath = `${modelsDir}${SPEECH_MODEL.filename}.part`;

  // Ensure models directory exists
  const dirInfo = await FileSystem.getInfoAsync(modelsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
  }

  // Already downloaded and valid?
  const isReady = await isSpeechModelDownloaded();
  if (isReady) {
    onProgress?.(100, SPEECH_MODEL.sizeMB, SPEECH_MODEL.sizeMB);
    return finalPath;
  }

  const urls = [SPEECH_MODEL.primaryUrl, SPEECH_MODEL.mirrorUrl];
  let lastError: any = null;

  for (const url of urls) {
    try {
      console.log(`[speechModelManager] Downloading speech model from: ${url}`);

      // Clean staging file if present
      const stagingInfo = await FileSystem.getInfoAsync(stagingPath);
      if (stagingInfo.exists) {
        await FileSystem.deleteAsync(stagingPath, { idempotent: true });
      }

      const progressCallback = (p: FileSystem.DownloadProgressData) => {
        const expected =
          p.totalBytesExpectedToWrite > 0
            ? p.totalBytesExpectedToWrite
            : SPEECH_MODEL.sizeMB * 1024 * 1024;
        const pct = Math.min(
          100,
          Math.max(0, Math.round((p.totalBytesWritten / expected) * 100))
        );
        const writtenMB = Number((p.totalBytesWritten / (1024 * 1024)).toFixed(1));
        const totalMB = Number((expected / (1024 * 1024)).toFixed(1));
        onProgress?.(pct, writtenMB, totalMB);
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        stagingPath,
        {},
        progressCallback
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        throw new Error('Download did not return a valid file URI');
      }

      // Verify file size
      const downloadedInfo = await FileSystem.getInfoAsync(stagingPath);
      const downloadedBytes = (downloadedInfo as any).size || 0;
      if (downloadedBytes < SPEECH_MODEL.minBytes) {
        throw new Error(
          `Downloaded model file too small (${downloadedBytes} bytes vs expected ${SPEECH_MODEL.minBytes})`
        );
      }

      // Move from staging to final path
      const finalInfo = await FileSystem.getInfoAsync(finalPath);
      if (finalInfo.exists) {
        await FileSystem.deleteAsync(finalPath, { idempotent: true });
      }
      await FileSystem.moveAsync({ from: stagingPath, to: finalPath });

      console.log(`[speechModelManager] Speech model ready at: ${finalPath}`);
      onProgress?.(100, SPEECH_MODEL.sizeMB, SPEECH_MODEL.sizeMB);
      return finalPath;
    } catch (err: any) {
      console.warn(`[speechModelManager] Download attempt failed for ${url}:`, err);
      lastError = err;
      // Clean up staging file before trying next URL
      try {
        await FileSystem.deleteAsync(stagingPath, { idempotent: true });
      } catch (_) {}
    }
  }

  throw lastError || new Error('Failed to download speech model from all candidate sources.');
}

/**
 * Delete speech model if needed to free storage.
 */
export async function deleteSpeechModel(): Promise<void> {
  const path = getSpeechModelPath();
  await FileSystem.deleteAsync(path, { idempotent: true });
}
