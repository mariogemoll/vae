import pica from 'pica';
import { setUpDatasetExplanation } from 'widgets/datasetexplanation';

import { getPreviousElementSibling } from './util';
import faceImg from '../../../misc/face.png';

setUpDatasetExplanation(
  pica(),
  faceImg as string,
  getPreviousElementSibling() as HTMLDivElement
).then(() => {
  console.log('Dataset explanation setup complete.');
}).catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('Error setting up dataset explanation:', msg);
});
