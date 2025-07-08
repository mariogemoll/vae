import pica from 'pica';
import { sizeRange, hueRange } from 'widgets/constants';
import { setUpDatasetExplanation } from 'widgets/datasetexplanation';
import { makeStandardGrid } from 'widgets/grid';
import { addErrorMessage } from 'widgets/util';

import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var faceImgUrl: string;
var datasetExplanationContainer = getPreviousElementSibling() as HTMLDivElement;
/* eslint-enable no-var */

setUpDatasetExplanation(
  pica(),
  faceImgUrl,
  makeStandardGrid(sizeRange, hueRange),
  datasetExplanationContainer
).catch((error: unknown) => {
  console.error('Error setting up dataset explanation widget:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(
    datasetExplanationContainer,
    `Error setting up dataset explanation widget: ${msg}`
  );
});
