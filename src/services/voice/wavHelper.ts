import * as FileSystem from 'expo-file-system/legacy';

/**
 * Creates a standard 44-byte RIFF/WAV header for 16-bit PCM audio.
 */
export function createWavBuffer(
  pcmData: Uint8Array,
  sampleRate = 16000,
  numChannels = 1
): ArrayBuffer {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const totalDataLen = pcmData.byteLength;
  const totalFileLen = totalDataLen + 36;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  // "RIFF" chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF" in big-endian ASCII
  view.setUint32(4, totalFileLen, true);  // File size - 8 bytes
  view.setUint32(8, 0x57415645, false); // "WAVE" in big-endian ASCII

  // "fmt " subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt " in big-endian ASCII
  view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);           // AudioFormat = 1 (Linear PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true);  // SampleRate (16000 Hz)
  view.setUint32(28, byteRate, true);    // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, blockAlign, true);  // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true);          // BitsPerSample (16 bit)

  // "data" subchunk
  view.setUint32(36, 0x64617461, false); // "data" in big-endian ASCII
  view.setUint32(40, totalDataLen, true); // Subchunk2Size (NumSamples * NumChannels * BitsPerSample/8)

  const wavArray = new Uint8Array(44 + totalDataLen);
  wavArray.set(new Uint8Array(header), 0);
  wavArray.set(pcmData, 44);

  return wavArray.buffer;
}

/**
 * Converts a Uint8Array into a base64 string without exceeding call stack limits.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Saves PCM data as a WAV file on device storage and returns the file URI.
 */
export async function savePcmAsWavFile(
  pcmData: Uint8Array,
  sampleRate = 16000,
  numChannels = 1
): Promise<string> {
  const wavBuffer = createWavBuffer(pcmData, sampleRate, numChannels);
  const wavBytes = new Uint8Array(wavBuffer);
  const base64 = uint8ArrayToBase64(wavBytes);

  const cacheDir = FileSystem.cacheDirectory || '';
  const fileName = `voice_${Date.now()}.wav`;
  const filePath = `${cacheDir}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return filePath;
}
