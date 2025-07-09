import { zRange } from './constants.js';
import { drawImage } from './drawimage.js';
import { drawGrid } from './grid.js';
import { getStandardGaussianHeatmap } from './standardgaussianheatmap.js';
import { addFrame } from './svg.js';
import { setUp2dSelectorWithLabels } from './twodselector.js';
import type { OrtFunction } from './types/ortfunction.js';
import type { Pair } from './types/pair.js';
import { el, midRangeValue } from './util.js';

function addStandardGaussianHeatmap(svg: SVGSVGElement, x: number, y: number): void {
  const width = 200; // Width of the heatmap
  const height = 200; // Height of the heatmap
  const zrange = 3; // Range for the Gaussian heatmap
  const pngUrl = getStandardGaussianHeatmap(width, height, zrange);
  // Inject into SVG
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttributeNS(null, 'x', x.toString());
  img.setAttributeNS(null, 'y', y.toString());
  img.setAttributeNS(null, 'width', width.toString());
  img.setAttributeNS(null, 'height', height.toString());
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pngUrl);
  svg.appendChild(img);
}

export function setUpDecoding(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'),
  decode: OrtFunction,
  zGrid: Pair<number>[][],
  box: HTMLDivElement
): void {
  const zSvg = el(box, 'svg.z-space') as SVGSVGElement;
  const reconCanvas = el(box, 'canvas.reconstruction') as HTMLCanvasElement;
  const z0Span: HTMLSpanElement = el(box, '.z0') as HTMLSpanElement;
  const z1Span: HTMLSpanElement = el(box, '.z1') as HTMLSpanElement;
  const margins = { top: 10, right: 40, bottom: 40, left: 40 };

  // Add standard Gaussian heatmap to the SVG
  addStandardGaussianHeatmap(zSvg, margins.left, margins.top);
  const reconCtx = reconCanvas.getContext('2d');
  if (!reconCtx) {
    throw new Error('Failed to get 2D context for reconstruction canvas');
  }

  drawGrid(zSvg, margins, [zRange, zRange], 'grey', zGrid);

  addFrame(zSvg, margins, zRange, zRange, 5);

  let working = false;
  setUp2dSelectorWithLabels(
    zSvg,
    margins,
    zRange,
    zRange,
    z0Span,
    z1Span,
    midRangeValue(zRange),
    midRangeValue(zRange),
    (z0: number, z1: number) => {
      if (working) { return; } // Prevent multiple simultaneous renders
      working = true;
      (async(): Promise<void> => {
        const zArray = [z0, z1];
        const tensor = new ort.Tensor('float32', new Float32Array(zArray), [
          1, zArray.length
        ]);
        const results = await decode(tensor);
        drawImage(reconCtx, results.reconstruction.data as Float32Array);
        working = false;
      })().catch((error: unknown) => {
        console.error('Error decoding:', error);
      });
    }
  );

}
