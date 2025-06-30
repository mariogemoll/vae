import pica from 'pica';
import { setUpDatasetExplanation } from 'widgets/datasetexplanation';

import faceImg from '../../../misc/face.png';

// Get the current script tag
const currentScript = document.currentScript as HTMLScriptElement;

// Get the element right above the current script tag
const elementAbove = currentScript.previousElementSibling;

setUpDatasetExplanation(
  pica(),
  faceImg as string,
  elementAbove as HTMLDivElement
).then(() => {
  console.log('Dataset explanation setup complete.');
}).catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('Error setting up dataset explanation:', msg);
});
