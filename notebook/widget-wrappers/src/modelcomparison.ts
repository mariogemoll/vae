import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import { addErrorMessage } from 'widgets/dom';
import { setUpModelComparison } from 'widgets/modelcomparison';

import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var lossesBase64: string;
declare var gridsBase64: string;
var modelComparisonContainer = getPreviousElementSibling() as HTMLDivElement;
/* eslint-enable no-var */

try {
  const lossesUint8 = fromBase64(lossesBase64);
  const gridsUint8 = fromBase64(gridsBase64);
  setUpModelComparison(lossesUint8.buffer, gridsUint8.buffer, modelComparisonContainer);
} catch (error) {
  console.error('Error setting up model comparison widget:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(
    modelComparisonContainer,
    `Error setting up model comparison widget: ${msg}`
  );
}
