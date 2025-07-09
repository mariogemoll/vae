import * as ort from 'onnxruntime-web';
import pica from 'pica';
import { hueRange,sizeRange } from 'widgets/constants';
import { setUpDecoding as setUpDecodingInternal } from 'widgets/decoding';
import { encodeGrid, makeStandardGrid } from 'widgets/grid';
import { addErrorMessage, loadImage } from 'widgets/util';

import { makeGuardedDecode } from './decode';
import { makeGuardedEncode } from './encode';
import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var faceImgUrl: string;
var settingUpDecoding = false;
var decodingContainer = getPreviousElementSibling() as HTMLDivElement;
/* eslint-enable no-var */

async function setUpDecoding(): Promise<void> {
  if (settingUpDecoding) {
    console.warn('Decoding setup is already in progress.');
    return;
  }
  settingUpDecoding = true;
  const encode = await makeGuardedEncode();
  const decode = await makeGuardedDecode();

  const alphaGrid = makeStandardGrid(sizeRange, hueRange);

  const picaInstance = pica();

  const img = await loadImage(faceImgUrl);
  const zGrid = await encodeGrid(ort, picaInstance, img, encode, alphaGrid);

  setUpDecodingInternal(ort, decode, zGrid, decodingContainer);
  settingUpDecoding = false;
}

setUpDecoding().catch((error: unknown) => {
  console.error('Error setting up decoding:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(decodingContainer, `Error setting up decoding widget: ${msg}`);
});
