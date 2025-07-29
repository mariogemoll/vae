import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import { Semaphore } from 'widgets/semaphore';
import type { OrtFunction } from 'widgets/types/ortfunction';

import { ort } from './ort';

declare global {
  interface Window {
    encode?: OrtFunction;
  }
}

// Global variable injected by Python
// eslint-disable-next-line no-var
declare var encoderBase64: string;

export async function makeGuardedEncode(): Promise<OrtFunction> {
  if (window.encode !== undefined) {
    console.log('Using existing encode function');
    // If encode is already defined, return it directly
    return window.encode;
  }
  const encoderBytes = fromBase64(encoderBase64);
  const encoderSession = await ort.InferenceSession.create(encoderBytes);
  const lock = new Semaphore(1);
  async function encode(imageTensor: ort.Tensor): Promise<ort.InferenceSession.ReturnType> {
    const feeds = { image: imageTensor };
    return lock.withLock(() => encoderSession.run(feeds));
  }
  window.encode = encode;
  return encode;
}
