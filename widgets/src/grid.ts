import type * as ort from 'onnxruntime-web';

import { renderSample } from './dataset.js';
import { addLine } from './svg.js';
import type { OrtFunction } from './types/ortfunction';
import type { Pair } from './types/pair';
import { getAttribute, mapRange, writePixelValues } from './util.js';

export function drawGrid(
  svg: SVGSVGElement,
  margin: { top: number, right: number, bottom: number, left: number },
  fieldRange: Pair<Pair<number>>, stroke: string, tensor: Pair<number>[][]
): void {
  const outputRange: Pair<Pair<number>> = [
    [margin.left, parseFloat(getAttribute(svg, 'width')) - margin.right],
    [margin.top, parseFloat(getAttribute(svg, 'height')) - margin.bottom]
  ];
  const rows = tensor.length;
  const cols = tensor[0].length;

  // --- Draw grid connections ---
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p1 = mapPoint(fieldRange, outputRange, tensor[y][x]);

      // Horizontal line
      if (x < cols - 1) {
        const p2 = mapPoint(fieldRange, outputRange, tensor[y][x + 1]);
        addLine(svg, stroke, p1, p2);
      }

      // Vertical line
      if (y < rows - 1) {
        const p2 = mapPoint(fieldRange, outputRange, tensor[y + 1][x]);
        addLine(svg, stroke, p1, p2);
      }
    }
  }
}

function mapPoint(
  fieldRange: Pair<Pair<number>>, outputRange: Pair<Pair<number>>, [x, y]: Pair<number>
): Pair<number> {
  return [
    mapRange(fieldRange[0], outputRange[0], x),
    // Invert y-axis direction
    mapRange(fieldRange[1], [outputRange[1][1], outputRange[1][0]], y)
  ];
}

export function makeStandardGrid(xRange: Pair<number>, yRange: Pair<number>): Pair<number>[][] {
  const rows = 10;
  const cols = 10;
  const tensor: Pair<number>[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: Pair<number>[] = [];
    for (let x = 0; x < cols; x++) {
      const fx = x / (cols - 1); // normalized
      const fy = y / (rows - 1);
      const px = xRange[0] + fx * (xRange[1] - xRange[0]);
      const py = yRange[0] + fy * (yRange[1] - yRange[0]);

      row.push([px, py]);
    }
    tensor.push(row);
  }
  return tensor;
}

function tensor100x2_to_10x10x2(tensor: ort.Tensor): Pair<number>[][] {
  const [numSamples, dim] = tensor.dims; // [100, 2]
  if (numSamples !== 100 || dim !== 2) {
    throw new Error('Expected tensor shape [100, 2]');
  }
  const flat: Float32Array = tensor.data as Float32Array;
  const result: Pair<number>[][] = [];

  for (let i = 0; i < 10; i++) {
    const row: Pair<number>[] = [];
    for (let j = 0; j < 10; j++) {
      const idx = i * 10 + j;
      row.push([flat[idx * 2], flat[idx * 2 + 1]]); // [z1, z2]
    }
    result.push(row);
  }

  return result; // shape: [10][10][2]
}

export async function encodeGrid(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'),
  picaInstance: pica.Pica,
  img: HTMLImageElement,
  encode: OrtFunction,
  alphaGrid: Pair<number>[][]
): Promise<Pair<number>[][]> {
  const hiresCanvas = document.createElement('canvas');
  hiresCanvas.width = 128;
  hiresCanvas.height = 128;

  const downsampledCanvas = document.createElement('canvas');
  downsampledCanvas.width = 32;
  downsampledCanvas.height = 32;
  const gridSidelength = alphaGrid.length;
  const batchSize = gridSidelength * gridSidelength;

  // Generate images from the alpha grid coordinates (size and hue values)
  const arr = new Float32Array(batchSize * 3 * 32 * 32); // 3 channels, 32x32 pixels
  let i = 0;
  for (const row of alphaGrid) {
    for (const [size, hue] of row) {
      await renderSample(picaInstance, hiresCanvas, downsampledCanvas, img, size, hue);
      writePixelValues(arr, i, downsampledCanvas);
      i++;
    }
  }

  const tensor = new ort.Tensor('float32', arr, [batchSize, 3, 32, 32]);
  const results = await encode(tensor);

  // Convert the flat result array to a 2D grid
  const transformedGrid = tensor100x2_to_10x10x2(results.mu);

  return transformedGrid; // shape: [10][10][2]
}
