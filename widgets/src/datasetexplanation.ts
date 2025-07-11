import { addImgCanvas, addSpaceSvg,addTwoLabeledTextFields } from './commonelements.js';
import { hueRange, sizeRange } from './constants.js';
import { renderSample } from './dataset.js';
import { addDiv, addErrorMessage, makeCanvas, removePlaceholder } from './dom.js';
import { drawGrid } from './grid.js';
import { addFrame } from './svg.js';
import { setUp2dSelectorWithLabels } from './twodselector.js';
import type { Pair } from './types/pair.js';
import { loadImage, midRangeValue } from './util.js';


export async function setUpDatasetExplanation(
  picaInstance: pica.Pica, faceImgUrl: string, alphaGrid: Pair<number>[][], box: HTMLDivElement
): Promise<void> {
  try {

    removePlaceholder(box);

    const widget = addDiv(box, {}, { height: '300px', position: 'relative' });

    const alphaSvg = addSpaceSvg(widget, 0);
    const [sizeSpan, hueSpan] = addTwoLabeledTextFields(widget, 'Size', 'Hue');
    const imgCanvas = addImgCanvas(widget, 288);

    const hiresCanvas = makeCanvas({ width: '128', height: '128' }, {});

    const img = await loadImage(faceImgUrl);

    const margins = { top: 10, right: 40, bottom: 40, left: 40 };
    drawGrid(alphaSvg, margins, [sizeRange, hueRange], 'grey', alphaGrid);

    let working = false;

    addFrame(alphaSvg, margins, sizeRange, hueRange, 6);

    setUp2dSelectorWithLabels(
      alphaSvg,
      margins,
      sizeRange,
      hueRange,
      sizeSpan,
      hueSpan,
      midRangeValue(sizeRange),
      midRangeValue(hueRange),
      (size: number, hue: number) => {
        if (working) { return; } // Prevent multiple simultaneous renders
        working = true;
        (async(): Promise<void> => {
          await renderSample(picaInstance, hiresCanvas, imgCanvas, img, size, hue);
          working = false;
        })().catch((error: unknown) => {
          console.error('Error rendering sample:', error);
        });
      }
    );
  } catch (error: unknown) {
    console.error('Error setting up dataset explanation:', error);
    let msg = 'Unknown error';
    if (error instanceof Error) {
      msg = error.message;
    }
    addErrorMessage(box, `Error setting up dataset explanation widget: ${msg}`);
  }

}
