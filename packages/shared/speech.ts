import type { Env } from './types';

export type AudioFormat = 'wav' | 'mp3' | 'mulaw' | 'pcm';

export interface STTResult {
  text: string;
  language?: string;
}

export async function transcribeAudio(env: Env, audio: Uint8Array, opts?: { mimeType?: string }): Promise<STTResult> {
  if (!env.OPENAI_API_KEY) {
    return { text: '' };
  }
  // OpenAI Whisper-1 transcription via multipart/form-data
  const boundary = `----basma${crypto.randomUUID()}`;
  const formParts: Array<string | Uint8Array> = [];
  const pushField = (name: string, value: string) => {
    formParts.push(`--${boundary}\r\n`);
    formParts.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    formParts.push(`${value}\r\n`);
  };
  const pushFile = (name: string, filename: string, contentType: string, data: Uint8Array) => {
    formParts.push(`--${boundary}\r\n`);
    formParts.push(`Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`);
    formParts.push(`Content-Type: ${contentType}\r\n\r\n`);
    formParts.push(data);
    formParts.push(`\r\n`);
  };

  pushField('model', 'whisper-1');
  pushFile('file', 'audio.wav', opts?.mimeType || 'audio/wav', audio);

  formParts.push(`--${boundary}--`);

  const body = new Blob(formParts as any, { type: `multipart/form-data; boundary=${boundary}` });
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('STT error', res.status, err);
    return { text: '' };
  }
  const json = await res.json();
  return { text: json.text || '' };
}

export interface TTSOptions {
  voice?: string;
  format?: AudioFormat;
}

export async function synthesizeSpeech(env: Env, text: string, options?: TTSOptions): Promise<Uint8Array> {
  if (!env.OPENAI_API_KEY) {
    // Fallback to simple text bytes (placeholder)
    return new TextEncoder().encode(text);
  }
  const voice = options?.voice || env.OPENAI_TTS_VOICE || 'alloy';
  // OpenAI TTS
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      format: options?.format || 'mp3',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('TTS error', res.status, err);
    return new TextEncoder().encode('');
  }
  const arrayBuf = await res.arrayBuffer();
  return new Uint8Array(arrayBuf);
}

// Decode minimal PCM WAV (mono or stereo) and return { sampleRate, channels, samples(Int16Array mono) }
export function decodeWavToPCM16(bytes: Uint8Array): { sampleRate: number; samples: Int16Array; channels: number } {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // 'RIFF'
  if (dv.getUint32(0, false) !== 0x52494646) throw new Error('Not RIFF');
  // 'WAVE'
  if (dv.getUint32(8, false) !== 0x57415645) throw new Error('Not WAVE');
  let offset = 12;
  let fmtFound = false;
  let dataFound = false;
  let audioFormat = 1;
  let numChannels = 1;
  let sampleRate = 8000;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;
  while (offset + 8 <= dv.byteLength) {
    const chunkId = dv.getUint32(offset, false); offset += 4;
    const chunkSize = dv.getUint32(offset, true); offset += 4;
    if (chunkId === 0x666d7420) { // 'fmt '
      fmtFound = true;
      audioFormat = dv.getUint16(offset, true); offset += 2;
      numChannels = dv.getUint16(offset, true); offset += 2;
      sampleRate = dv.getUint32(offset, true); offset += 4;
      offset += 6; // byteRate(4) + blockAlign(2)
      bitsPerSample = dv.getUint16(offset, true); offset += 2;
      if (chunkSize > 16) offset += (chunkSize - 16);
    } else if (chunkId === 0x64617461) { // 'data'
      dataFound = true;
      dataOffset = offset;
      dataSize = chunkSize;
      offset += chunkSize;
    } else {
      offset += chunkSize;
    }
  }
  if (!fmtFound || !dataFound) throw new Error('Invalid WAV');
  if (audioFormat !== 1 || bitsPerSample !== 16) throw new Error('Only PCM16 supported');
  const sampleCount = dataSize / 2 / numChannels;
  const samples = new Int16Array(sampleCount);
  const dvData = new DataView(bytes.buffer, bytes.byteOffset + dataOffset, dataSize);
  for (let i = 0; i < sampleCount; i++) {
    let acc = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const s = dvData.getInt16((i * numChannels + ch) * 2, true);
      acc += s;
    }
    samples[i] = acc / numChannels | 0;
  }
  return { sampleRate, samples, channels: numChannels };
}

export function resampleLinearPCM16(input: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return input;
  const ratio = toRate / fromRate;
  const newLength = Math.floor(input.length * ratio);
  const out = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcPos = i / ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = srcPos - i0;
    out[i] = (input[i0] * (1 - frac) + input[i1] * frac) | 0;
  }
  return out;
}

// PCM16 -> mu-law (G.711)
export function pcm16ToMulaw(pcm16: Int16Array): Uint8Array {
  const MULAW_MAX = 0x1FFF;
  const BIAS = 0x84;
  const out = new Uint8Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    let sample = pcm16[i];
    let sign = (sample >> 8) & 0x80;
    if (sign !== 0) sample = -sample;
    if (sample > MULAW_MAX) sample = MULAW_MAX;

    sample = sample + BIAS;
    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; expMask >>= 1) {
      exponent--;
    }
    const mantissa = (sample >> ((exponent === 0) ? 4 : (exponent + 3))) & 0x0F;
    const muLawByte = ~(sign | (exponent << 4) | mantissa) & 0xFF;
    out[i] = muLawByte;
  }
  return out;
}

export function chunkMulawFrames(mulaw: Uint8Array, frameMs = 20, sampleRate = 8000): Uint8Array[] {
  const bytesPerFrame = Math.floor(sampleRate * (frameMs / 1000)); // 160 bytes at 8kHz
  const frames: Uint8Array[] = [];
  for (let i = 0; i < mulaw.length; i += bytesPerFrame) {
    frames.push(mulaw.subarray(i, Math.min(i + bytesPerFrame, mulaw.length)));
  }
  return frames;
}

export async function ttsToMulawFrames(env: Env, text: string): Promise<Uint8Array[]> {
  const audio = await synthesizeSpeech(env, text, { format: 'wav' });
  let pcm: Int16Array;
  let rate: number;
  try {
    const decoded = decodeWavToPCM16(audio);
    pcm = decoded.samples;
    rate = decoded.sampleRate;
  } catch (e) {
    // If decoding fails (e.g. mp3), fallback to empty
    return [];
  }
  if (rate !== 8000) {
    pcm = resampleLinearPCM16(pcm, rate, 8000);
    rate = 8000;
  }
  const mulaw = pcm16ToMulaw(pcm);
  return chunkMulawFrames(mulaw, 20, 8000);
}
