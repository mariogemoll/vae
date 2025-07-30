import { getContext } from './canvas.js';
import { addImgCanvas, addSpaceSvg, addTwoLabeledTextFields } from './commonelements.js';
import { zRange } from './constants.js';
import { addDiv, addErrorMessage, removePlaceholder } from './dom.js';
import { drawImage } from './drawimage.js';
import { drawGridOnSvg } from './grid.js';
import { getStandardGaussianHeatmap } from './standardgaussianheatmap.js';
import { addFrame, addImage } from './svg.js';
import { setUp2dSelectorWithLabels } from './twodselector.js';
import type OrtFunction from './types/ortfunction.js';
import type Pair from './types/pair.js';
import { midRangeValue } from './util.js';

export function setUpDecoding(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'),
  decode: OrtFunction,
  zGrid: Pair<number>[][],
  box: HTMLDivElement
): void {
  try {
    removePlaceholder(box);
    const widget = addDiv(box, {}, { position: 'relative' });

    const zSvg = addSpaceSvg(widget, 0);
    const reconCanvas = addImgCanvas(widget, 288);
    const [z0Span, z1Span] = addTwoLabeledTextFields(widget, 'z₀', 'z₁');
    const margins = { top: 10, right: 40, bottom: 40, left: 40 };

    // Add standard Gaussian heatmap to the SVG
    const heatmapPngUrl = getStandardGaussianHeatmap(200, 200, 3);
    addImage(zSvg, margins.left, margins.top, 200, 200, heatmapPngUrl);

    drawGridOnSvg(zSvg, margins, [zRange, zRange], 'white', zGrid);

    addFrame(zSvg, margins, zRange, zRange, 5);

    const reconCtx = getContext(reconCanvas);

    async function update(z0: number, z1: number): Promise<void> {
      const zArray = [z0, z1];
      const tensor = new ort.Tensor('float32', new Float32Array(zArray), [
        1, zArray.length
      ]);
      const results = await decode(tensor);
      drawImage(reconCtx, results.reconstruction.data as Float32Array);
    }

    const initialZ = midRangeValue(zRange);

    let working = false;
    setUp2dSelectorWithLabels(
      zSvg,
      margins,
      zRange,
      zRange,
      z0Span,
      z1Span,
      initialZ,
      initialZ,
      (z0: number, z1: number) => {
        if (working) { return; }
        working = true;
        (async(): Promise<void> => {
          await update(z0, z1);
          working = false;
        })().catch((error: unknown) => {
          console.error('Error decoding:', error);
        });
      }
    );
  } catch (error: unknown) {
    console.error('Error setting up decoding widget:', error);
    let msg = 'Unknown error';
    if (error instanceof Error) {
      msg = error.message;
    }
    addErrorMessage(box, `Error setting up decoding widget: ${msg}`);
  }
}
