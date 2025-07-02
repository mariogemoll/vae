import * as ort from 'onnxruntime-web';

import { drawImage } from './drawimage';
import { getStandardGaussianHeatmap } from './standardgaussianheatmap';
import { setUp2dSelector } from './twodselector';
import { el, map01ToRange } from './util';

function addStandardGaussianHeatmap(svg: SVGSVGElement): void {
  const width = 200; // Width of the heatmap
  const height = 200; // Height of the heatmap
  const zrange = 3; // Range for the Gaussian heatmap
  const pngUrl = getStandardGaussianHeatmap(width, height, zrange);
  // Inject into SVG
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttributeNS(null, 'x', '0');
  img.setAttributeNS(null, 'y', '0');
  img.setAttributeNS(null, 'width', width.toString());
  img.setAttributeNS(null, 'height', height.toString());
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', pngUrl);
  svg.appendChild(img);
}

export function setUpDecoding(
  box: HTMLDivElement,
  decode: (zTensor: ort.Tensor) => Promise<ort.InferenceSession.ReturnType>
): void {
  const zSvg = el(box, 'svg.z-space') as SVGSVGElement;
  const reconCanvas = el(box, 'canvas.reconstruction') as HTMLCanvasElement;
  const z0Span: HTMLSpanElement = el(box, '.z0 span') as HTMLSpanElement;
  const z1Span: HTMLSpanElement = el(box, '.z1 span') as HTMLSpanElement;

  // Add standard Gaussian heatmap to the SVG
  addStandardGaussianHeatmap(zSvg);
  const reconCtx = reconCanvas.getContext('2d');
  if (!reconCtx) {
    throw new Error('Failed to get 2D context for reconstruction canvas');
  }


  let working = false;
  setUp2dSelector(zSvg, (x, y) => {
    if (working) { return; } // Prevent multiple simultaneous renders
    working = true;
    (async(): Promise<void> => {
      const z0 = map01ToRange([-3, 3], x);
      const z1 = map01ToRange([-3, 3], y);
      z0Span.textContent = z0.toFixed(2);
      z1Span.textContent = z1.toFixed(2);
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
  });
}
