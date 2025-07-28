import { getContext } from './canvas.js';
import { standardGaussianPdf } from './gaussian.js';
import type { Margins } from './types/margins.js';

export function drawGaussian(
  canvas: HTMLCanvasElement,
  margins: Margins,
  zRange: number
): void {
  const ctx = getContext(canvas);
  const W = canvas.width;
  const H = canvas.height;
  const image = ctx.createImageData(W, H);
  const data = image.data;

  const centerValue = standardGaussianPdf(0, 0);

  // Calculate the drawable area excluding margins
  const drawableWidth = W - margins.left - margins.right;
  const drawableHeight = H - margins.top - margins.bottom;

  // Only iterate over the drawable area
  for (let j = margins.top; j < H - margins.bottom; j++) {
    for (let i = margins.left; i < W - margins.right; i++) {
      // Map coordinates within the drawable area to the z-range
      const x = ((i - margins.left) / (drawableWidth - 1)) * 2 * zRange - zRange;
      const y = ((j - margins.top) / (drawableHeight - 1)) * 2 * zRange - zRange;
      const g = standardGaussianPdf(x, y) / centerValue;
      const value = Math.floor(g * 255);

      const idx = (j * W + i) * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function getStandardGaussianHeatmap(
  width: number,
  height: number,
  zRange: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawGaussian(canvas, { top: 0, right: 0, bottom: 0, left: 0 }, zRange);
  return canvas.toDataURL('image/png');
}
