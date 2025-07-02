import pica from 'pica';
import { sizeRange, hueRange } from 'widgets/constants';
import { encodeGrid, makeStandardGrid } from 'widgets/grid';
import { setUpMapping as setUpMappingInternal } from 'widgets/mapping';
import { loadImage } from 'widgets/util';

import { makeGuardedDecode } from './decode';
import { makeGuardedEncode } from './encode';
import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var faceImgUrl: string;
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
  const zGrid = await encodeGrid(picaInstance, img, encode, alphaGrid);

  await setUpMappingInternal(
    encode, decode, picaInstance, faceImgUrl, alphaGrid, zGrid, mappingContainer
  );
  settingUpMapping = false;
}

setUpMapping().catch((error: unknown) => {
  console.error('Error setting up mapping widget:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  mappingContainer.innerHTML = `<p>Error setting up mapping widget: ${msg}</p>`;
});
