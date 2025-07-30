import { addFrameUsingScales, drawScatter, getContext } from './canvas.js';
import { zRange } from './constants.js';
import { addCanvas, addDiv, removePlaceholder } from './dom.js';
import { drawImage } from './drawimage.js';
import { sampleFromStandardGaussian } from './gaussian.js';
import { drawGaussian } from './standardgaussianheatmap.js';
import type OrtFunction from './types/ortfunction.js';
import type Pair from './types/pair.js';
import { makeScale } from './util.js';

export function sampleTensor(numSamples: number): Float32Array {
  const values = new Float32Array(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const [x, y] = sampleFromStandardGaussian();
    values[i * 2] = x;     // x value at even indices
    values[i * 2 + 1] = y; // y value at odd indices
  }

  return values;
}
function displayImages(ctx: CanvasRenderingContext2D, data: Float32Array): void {
  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const numRows = 4;
  const numCols = 6;
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const imageIndex = row * numCols + col;
      const canvasX = col * 32;
      const canvasY = row * 32;
      const dataOffset = imageIndex * 32 * 32 * 3; // Each image is 32x32x3 (RGB)

      drawImage(ctx, data, canvasX, canvasY, dataOffset);
    }
  }
}

function drawImageHighlight(ctx: CanvasRenderingContext2D, highlightedIndex: number): void {
  if (highlightedIndex >= 0 && highlightedIndex < 24) {
    const numCols = 6;
    const col = highlightedIndex % numCols;
    const row = Math.floor(highlightedIndex / numCols);
    const canvasX = col * 32;
    const canvasY = row * 32;

    // Draw red border around highlighted image
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasX - 1, canvasY - 1, 34, 34); // 32 + 2 for border
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

  // Store current coordinates and highlighted index
  let currentCoords: Pair<number>[] = [];
  let highlightedIndex = -1;

  function drawCoordinates(): void {
    zCtx.clearRect(0, 0, zCanvas.width, zCanvas.height);
    drawGaussian(zCanvas, zMargins, 3);
    addFrameUsingScales(zCtx, z0Scale, z1Scale, 5);

    // Draw all coordinates
    const colors = currentCoords.map(() => 'white');
    drawScatter(zCtx, z0Scale, z1Scale, currentCoords, colors);

    // Draw highlight circle around selected coordinate
    if (highlightedIndex >= 0 && highlightedIndex < currentCoords.length) {
      const [x, y] = currentCoords[highlightedIndex];
      const screenX = z0Scale(x);
      const screenY = z1Scale(y);
      zCtx.strokeStyle = '#ff0000';
      zCtx.lineWidth = 2;
      zCtx.beginPath();
      zCtx.arc(screenX, screenY, 8, 0, 2 * Math.PI);
      zCtx.stroke();
    }
  }

  function drawImageWithHighlight(): void {
    // Redraw all images first
    displayImages(imageCtx, currentImageData);
    // Then draw highlight if needed
    drawImageHighlight(imageCtx, highlightedIndex);
  }

  // Store current image data for redrawing
  let currentImageData: Float32Array = new Float32Array(0);

  // Add mouse interaction for image canvas
  imgCanvas.addEventListener('mousemove', (event) => {
    const rect = imgCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / 2; // Account for 2x scaling
    const y = (event.clientY - rect.top) / 2;

    // Calculate which image cell we're hovering over
    const col = Math.floor(x / 32);
    const row = Math.floor(y / 32);

    if (col >= 0 && col < 6 && row >= 0 && row < 4) {
      const imageIndex = row * 6 + col;
      if (imageIndex < currentCoords.length) {
        highlightedIndex = imageIndex;
        drawCoordinates();
        drawImageWithHighlight();
      }
    }
  });

  imgCanvas.addEventListener('mouseleave', () => {
    highlightedIndex = -1;
    drawCoordinates();
    drawImageWithHighlight();
  });

  // Add mouse interaction for coordinate canvas
  zCanvas.addEventListener('mousemove', (event) => {
    const rect = zCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find closest coordinate point
    let closestIndex = -1;
    let minDistance = Infinity;

    currentCoords.forEach((coord, index) => {
      const screenX = z0Scale(coord[0]);
      const screenY = z1Scale(coord[1]);
      const distance = Math.sqrt((mouseX - screenX) ** 2 + (mouseY - screenY) ** 2);

      if (distance < 15 && distance < minDistance) { // 15px threshold
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== highlightedIndex) {
      highlightedIndex = closestIndex;
      drawCoordinates();
      drawImageWithHighlight();

      // Set cursor style
      if (highlightedIndex >= 0) {
        imgCanvas.style.cursor = 'pointer';
      } else {
        imgCanvas.style.cursor = 'default';
      }
    }
  });

  zCanvas.addEventListener('mouseleave', () => {
    highlightedIndex = -1;
    drawCoordinates();
    drawImageWithHighlight();
    imgCanvas.style.cursor = 'default';
  });


  const numSamples = 24;

  async function sampleAsync(): Promise<void> {
    const tensor = sampleTensor(numSamples);
    const ortTensor = new ort.Tensor('float32', tensor, [numSamples, 2]);
    const results = await decode(ortTensor);

    // Store image data and update coordinates
    currentImageData = results.reconstruction.data as Float32Array;
    currentCoords = [];
    for (let i = 0; i < tensor.length; i += 2) {
      currentCoords.push([tensor[i], tensor[i + 1]]);
    }

    drawCoordinates();
    drawImageWithHighlight();
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
