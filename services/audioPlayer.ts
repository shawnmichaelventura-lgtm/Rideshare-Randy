
import { generateSpeech } from './geminiService';

const SAMPLE_RATE = 24000;
const audioCache = new Map<string, AudioBuffer>();
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  }
  return audioCtx;
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Use data.buffer with byteOffset and length to avoid alignment errors
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playSpeech = async (text: string, voiceId: string) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const cacheKey = `${voiceId}:${text}`;
    let buffer = audioCache.get(cacheKey);

    if (!buffer) {
      const base64Data = await generateSpeech(text, voiceId);
      if (!base64Data) return;

      const bytes = decode(base64Data);
      buffer = await decodeAudioData(bytes, ctx, SAMPLE_RATE, 1);
      
      audioCache.set(cacheKey, buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    
  } catch (err) {
    console.warn("Audio playback failed:", err);
  }
};
