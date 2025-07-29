import { addFrameUsingScales, drawScatter, getContext } from './canvas.js';
import { zRange } from './constants.js';
import { addCanvas, addDiv, removePlaceholder } from './dom.js';
import { drawImage } from './drawimage.js';
import { sampleFromStandardGaussian } from './gaussian.js';
import { drawGaussian } from './standardgaussianheatmap.js';
import type OrtFunction from './types/ortfunction.js';
import type Pair from './types/pair.js';
import { makeScale } from './util.js';

export function sampleTensor(): Float32Array {
  const values = new Float32Array(128); // 64 pairs × 2 = 128 values

  for (let i = 0; i < 64; i++) {
    const [x, y] = sampleFromStandardGaussian();
    values[i * 2] = x;     // x value at even indices
    values[i * 2 + 1] = y; // y value at odd indices
  }

  return values;
}

function displayImages(ctx: CanvasRenderingContext2D, data: Float32Array): void {
  // Clear canvas
  ctx.clearRect(0, 0, 256, 256);

  // Draw 8x8 grid of images
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const imageIndex = row * 8 + col;
      const canvasX = col * 32;
      const canvasY = row * 32;
      const dataOffset = imageIndex * 32 * 32 * 3; // Each image is 32x32x3 (RGB)

      drawImage(ctx, data, canvasX, canvasY, dataOffset);
    }
  }
}

export async function setUpSampling(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'), decode: OrtFunction, box: HTMLDivElement
): Promise<void> {
  removePlaceholder(box);
  const widget = addDiv(box, {}, { position: 'relative' });

  const zCanvas = addCanvas(
    widget, { width: '280', height: '250' }, { position: 'absolute' }
  );
  const zMargins = { top: 10, right: 40, bottom: 40, left: 40 };
  const z0Scale = makeScale(zRange, [zMargins.left, zCanvas.width - zMargins.right]);
  const z1Scale = makeScale(zRange, [zCanvas.height - zMargins.bottom, zMargins.top]);
  const zCtx = getContext(zCanvas);


  // Create canvas for displaying images
  const imgCanvas = document.createElement('canvas');
  imgCanvas.width = 32 * 6;
  imgCanvas.height = 32 * 4;
  imgCanvas.style.width = `${(imgCanvas.width * 2).toString()}px`;
  imgCanvas.style.height = `${(imgCanvas.height * 2).toString()}px`;
  imgCanvas.style.imageRendering = 'pixelated';
  imgCanvas.style.border = '1px solid #ccc';
  imgCanvas.style.position = 'absolute';
  imgCanvas.style.top = '10px';
  imgCanvas.style.left = '300px';
  widget.appendChild(imgCanvas);
  const imageCtx = getContext(imgCanvas);

  const btn = document.createElement('button');
  btn.textContent = 'Sample';
  btn.style.position = 'absolute';
  btn.style.left = '110px';
  btn.style.top = '250px';
  let working = true;

  async function sampleAsync(): Promise<void> {
    const tensor = sampleTensor();
    const ortTensor = new ort.Tensor('float32', tensor, [64, 2]);
    const results = await decode(ortTensor);
    zCtx.clearRect(0, 0, zCanvas.width, zCanvas.height);
    drawGaussian(zCanvas, zMargins, 3);
    addFrameUsingScales(zCtx, z0Scale, z1Scale, 5);
    const coords: Pair<number>[] = [];
    for (let i = 0; i < tensor.length; i += 2) {
      coords.push([tensor[i], tensor[i + 1]]);
    }
    drawScatter(zCtx, z0Scale, z1Scale, coords, coords.map(() => '#ccc'));
    displayImages(imageCtx, results.reconstruction.data as Float32Array);
  }
  function sample(): void {
    if (working) {
      return;
    }
    working = true;
    sampleAsync()
      .catch((err: unknown) => {
        console.error('Sampling error:', err);
      })
      .finally(() => {
        working = false;
      });
  }
  btn.addEventListener('click', sample);
  widget.appendChild(btn);
  await sampleAsync();
  working = false;
}
