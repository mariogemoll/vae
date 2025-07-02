import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import * as ort from 'onnxruntime-web';
import { setUpDecoding as setUpDecodingInternal } from 'widgets/decoding';
import { Semaphore } from 'widgets/semaphore';

import { getPreviousElementSibling } from './util';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

// Global variables injected by Python
declare let decoderBase64: string;

let settingUpDecoding = false;

const decodingContainer = getPreviousElementSibling() as HTMLDivElement;

async function setUpDecoding(): Promise<void> {
  if (settingUpDecoding) {
    console.warn('Decoding setup is already in progress.');
    return;
  }
  settingUpDecoding = true;
  const decoderBytes = fromBase64(decoderBase64);

  const decoderSession = await ort.InferenceSession.create(decoderBytes);
  const decoderLock = new Semaphore(1);
  async function decode(zTensor: ort.Tensor): Promise<ort.InferenceSession.ReturnType> {
    const feeds = { z: zTensor };
    return decoderLock.withLock(() => decoderSession.run(feeds));
  }

  setUpDecodingInternal(decodingContainer, decode);
  settingUpDecoding = false;
}

setUpDecoding().catch((error: unknown) => {
  console.error('Error setting up decoding:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  decodingContainer.innerHTML = `<p>Error setting up decoding: ${msg}</p>`;
}
);
