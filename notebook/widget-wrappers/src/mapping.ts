import * as ort from 'onnxruntime-web';
import pica from 'pica';
import { hueRange,sizeRange } from 'widgets/constants';
import { encodeGrid, makeStandardGrid } from 'widgets/grid';
import { setUpMapping as setUpMappingInternal } from 'widgets/mapping';
import type { Pair } from 'widgets/types/pair';
import { addErrorMessage, loadImage } from 'widgets/util';

import { makeGuardedDecode } from './decode';
import { makeGuardedEncode } from './encode';
import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var faceImgUrl: string;
declare var valsetBounds: Pair<Pair<number>>;
var mappingContainer = getPreviousElementSibling() as HTMLDivElement;
var settingUpMapping = false;
/* eslint-enable no-var */

async function setUpMapping(): Promise<void> {
  if (settingUpMapping) {
    console.warn('Mapping setup is already in progress.');
    return;
  }
  settingUpMapping = true;
  const encode = await makeGuardedEncode();
  const decode = await makeGuardedDecode();

  const alphaGrid = makeStandardGrid(sizeRange, hueRange);

  const picaInstance = pica();

  const img = await loadImage(faceImgUrl);
  const zGrid = await encodeGrid(ort, picaInstance, img, encode, alphaGrid);

  await setUpMappingInternal(
    ort, encode, decode, picaInstance, faceImgUrl, valsetBounds, alphaGrid, zGrid, mappingContainer
  );
  settingUpMapping = false;
}

setUpMapping().catch((error: unknown) => {
  console.error('Error setting up mapping widget:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(mappingContainer, `Error setting up mapping widget: ${msg}`);
});
