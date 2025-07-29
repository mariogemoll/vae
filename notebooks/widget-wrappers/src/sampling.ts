import * as ort from 'onnxruntime-web';
import { addErrorMessage } from 'widgets/dom';
import { setUpSampling as setUpSamplingInternal } from 'widgets/sampling';

import { makeGuardedDecode } from './decode';
import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
var samplingContainer = getPreviousElementSibling() as HTMLDivElement;
var settingUpSampling = false;
/* eslint-enable no-var */

async function setUpSampling(): Promise<void> {
  if (settingUpSampling) {
    console.warn('Mapping setup is already in progress.');
    return;
  }
  settingUpSampling = true;
  const decode = await makeGuardedDecode();

  await setUpSamplingInternal(ort, decode, samplingContainer);
  settingUpSampling = false;
}

setUpSampling().catch((error: unknown) => {
  console.error('Error setting up sampling widget:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(samplingContainer, `Error setting up sampling widget: ${msg}`);
});
