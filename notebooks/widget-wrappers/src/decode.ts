import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import { Semaphore } from 'widgets/semaphore';
import type OrtFunction from 'widgets/types/ortfunction';

import { ort } from './ort';

declare global {
  interface Window {
    decode?: OrtFunction;
  }
}

// Global variable injected by Python
// eslint-disable-next-line no-var
declare var decoderBase64: string;

export async function makeGuardedDecode(): Promise<OrtFunction> {
  if (window.decode !== undefined) {
    console.log('Using existing decode function');
    // If decode is already defined, return it directly
    return window.decode;
  }
  const decoderBytes = fromBase64(decoderBase64);
  const decoderSession = await ort.InferenceSession.create(decoderBytes);
  const lock = new Semaphore(1);
  async function decode(zTensor: ort.Tensor): Promise<ort.InferenceSession.ReturnType> {
    const feeds = { z: zTensor };
    return lock.withLock(() => decoderSession.run(feeds));
  }
  window.decode = decode;
  return decode;
}
