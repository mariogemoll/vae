import { sizeRange, hueRange } from './constants.js';
import { renderSample } from './dataset.js';
import { drawGrid } from './grid.js';
import { setUp2dSelectorWithLabels } from './twodselector.js';
import type { Pair } from './types/pair.js';
import { el, loadImage, midRangeValue } from './util.js';

export async function setUpDatasetExplanation(
  picaInstance: pica.Pica, faceImgUrl: string, alphaGrid: Pair<number>[][], box: HTMLDivElement
): Promise<void> {
  try {
    const alphaSvg: SVGSVGElement = el(box, 'svg.alpha-space') as SVGSVGElement;
    const imgCanvas: HTMLCanvasElement = el(box, 'canvas.pic') as HTMLCanvasElement;
    const sizeSpan: HTMLSpanElement = el(box, '.dataset-explanation-size span') as HTMLSpanElement;
    const hueSpan: HTMLSpanElement = el(box, '.dataset-explanation-hue span') as HTMLSpanElement;
    const hiresCanvas = document.createElement('canvas');
    hiresCanvas.width = 128;
    hiresCanvas.height = 128;
    const img = await loadImage(faceImgUrl);

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    drawGrid(alphaSvg, margin, [sizeRange, hueRange], 'grey', alphaGrid);

    let working = false;

    setUp2dSelectorWithLabels(
      alphaSvg,
      margin,
      sizeRange,
      hueRange,
      sizeSpan,
      hueSpan,
      midRangeValue(sizeRange),
      midRangeValue(hueRange),
      (size, hue) => {
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
    box.innerHTML = `<p>Error setting up dataset explanation: ${msg}</p>`;
  }
}
