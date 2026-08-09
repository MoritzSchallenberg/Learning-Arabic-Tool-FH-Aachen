// Gemeinsamer Test-Helfer (Entwicklungsauftrag 12): baut einen minimalen, gültigen 16-Bit-PCM-
// WAV-Buffer ohne echtes Audio-Tool -- für Tests von wavValidation.js und der Audio-Pipeline.
function buildTestWav({ durationSeconds = 1, sampleRate = 22050, amplitude = 10000, silent = false } = {}) {
  const numSamples = Math.round(durationSeconds * sampleRate);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i += 1) {
    const sample = silent ? 0 : Math.round(Math.sin((i / sampleRate) * 440 * 2 * Math.PI) * amplitude);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  return buffer;
}

module.exports = { buildTestWav };
