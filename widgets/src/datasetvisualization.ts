import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';

import { addFrame,getContext } from './canvas.js';
import { hueRange, sizeRange } from './constants.js';
import type { Pair } from './types/pair.js';
import { addErrorMessage, el, mapRange } from './util.js';

function setUpUi(
  scatterCanvas: HTMLCanvasElement, imageCanvas: HTMLCanvasElement, sizeValueSpan: HTMLSpanElement,
  hueValueSpan: HTMLSpanElement, allCoords: Pair<number>[], allImages: Uint8Array[],
  allLabels: string[]): void {
  const scatterCtx = getContext(scatterCanvas);
  const imageCtx = getContext(imageCanvas);


  const margins = { top: 10, right: 40, bottom: 50, left: 40 };

  const thresholdPx = 10;

  // Draw scatter points
  function drawScatter(scatterCtx: CanvasRenderingContext2D, highlightIndex: number | null,
    xDomain: Pair<number>, yDomain: Pair<number>): void {
    scatterCtx.clearRect(0, 0, 280, 250);
    addFrame(scatterCanvas, margins, sizeRange, hueRange, 6);
    const xRange: Pair<number> = [margins.left, 280 - margins.right];
    const yRange: Pair<number> = [250 - margins.bottom, margins.top];

    for (let i = 0; i < allCoords.length; i++) {
      const [x, y] = allCoords[i];

      const px = mapRange(xDomain, xRange, x);
      const py = mapRange(yDomain, yRange, y);

      scatterCtx.beginPath();
      scatterCtx.arc(px, py, 3, 0, 2 * Math.PI);
      scatterCtx.fillStyle = allLabels[i] === 'train' ? '#ccc' : '#999';
      scatterCtx.fill();
    }

    if (highlightIndex !== null) {
      const [x, y] = allCoords[highlightIndex];
      const px = mapRange(xDomain, xRange, x);
      const py = mapRange(yDomain, yRange, y);
      scatterCtx.beginPath();
      scatterCtx.arc(px, py, 6, 0, 3 * Math.PI);
      scatterCtx.strokeStyle = 'red';
      scatterCtx.lineWidth = 2;
      scatterCtx.stroke();
    }

    if (highlightIndex !== null) {
      sizeValueSpan.textContent = allCoords[highlightIndex][0].toFixed(2);
      hueValueSpan.textContent = allCoords[highlightIndex][1].toFixed(2);
    }
  }
  // Initial render
  let selectedPointIndex: number | null = null;

  drawScatter(scatterCtx, null, sizeRange, hueRange);

  // Update the hover handler to use the same ranges
  scatterCanvas.addEventListener('mousemove', (event) => {
    const rect = scatterCanvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const scale = 200;
    const xScale = scale / (sizeRange[1] - sizeRange[0]);

    let minDist = Infinity;
    let minIndex = -1;

    for (let i = 0; i < allCoords.length; i++) {
      const [x, y] = allCoords[i];

      // Skip points outside the range
      if (x < sizeRange[0] || x > sizeRange[1] || y < hueRange[0] || y > hueRange[1]) { continue; }

      const px = margins.left + (x - sizeRange[0]) * xScale;
      const py = margins.top + (1 - (y - hueRange[0]) / (hueRange[1] - hueRange[0])) * scale;
      const dist = Math.hypot(px - mx, py - my);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }

    if (minDist <= thresholdPx) {
      selectedPointIndex = minIndex; // Update the selected point only when close enough
      updateImageDisplay(imageCtx, minIndex);
    }

    // Always redraw with the currently selected point
    drawScatter(scatterCtx, selectedPointIndex, sizeRange, hueRange);
  });

  // Add a separate function to update the image display
  function updateImageDisplay(imageCtx: CanvasRenderingContext2D, index: number): void {
    if (index < 0 || index >= allImages.length) {
      console.warn('Index out of bounds for images:', index);
      return;
    }
    imageCtx.clearRect(0, 0, 32, 32);
    const flatImage = allImages[index];
    const rawBytes = flatImage;
    const width = 32;
    const height = 32;

    const rgba = new Uint8ClampedArray(width * height * 4);
    const channelSize = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const chwIndex = y * width + x;

        rgba[i * 4 + 0] = rawBytes[0 * channelSize + chwIndex]; // R
        rgba[i * 4 + 1] = rawBytes[1 * channelSize + chwIndex]; // G
        rgba[i * 4 + 2] = rawBytes[2 * channelSize + chwIndex]; // B
        rgba[i * 4 + 3] = 255;
      }
    }

    const imageData = new ImageData(rgba, width, height);
    imageCtx.putImageData(imageData, 0, 0);
  }

  // Select a random point to display initially
  const initialIndex = Math.floor(Math.random() * allCoords.length);
  selectedPointIndex = initialIndex;
  updateImageDisplay(imageCtx, initialIndex);
  drawScatter(scatterCtx, initialIndex, sizeRange, hueRange);
}

export function setUpDatasetVisualization(
  box: HTMLDivElement, trainsetX: number[], trainsetY: number[], valsetX: number[],
  valsetY: number[], trainsetImagesBase64: string, valsetImagesBase64: string): void {
  try {
    const alphaCanvas: HTMLCanvasElement = el(box, 'canvas.alpha-space') as HTMLCanvasElement;
    const imgCanvas: HTMLCanvasElement = el(box, 'canvas.pic') as HTMLCanvasElement;
    const sizeSpan: HTMLSpanElement = el(box, 'p span.size') as HTMLSpanElement;
    const hueSpan: HTMLSpanElement = el(box, 'p span.hue') as HTMLSpanElement;

    const data: Record<string, { X: number[], Y: number[], images: string }> = {
      'train': {
        'X': trainsetX,
        'Y': trainsetY,
        'images': trainsetImagesBase64
      },
      'val': {
        'X': valsetX,
        'Y': valsetY,
        'images': valsetImagesBase64
      }
    };

    const labels = ['train', 'val'];

    const allCoords: Pair<number>[] = [];
    const allImages: Uint8Array[] = [];
    const allLabels: string[] = [];
    for (const label of labels) {
      const labelSizes = data[label].X;
      const labelHues = data[label].Y;
      for (let i = 0; i < labelSizes.length; i++) {
        const size = labelSizes[i];
        const hue = labelHues[i];
        allCoords.push([size, hue]);
        allLabels.push(label);
      }

      const imageBytes: Uint8Array = fromBase64(data[label].images);
      for (let i = 0; i < imageBytes.length; i += 3072) {
        const rgbBytes = imageBytes.slice(i, i + 3072);
        const flatImage = new Uint8Array(rgbBytes);
        allImages.push(flatImage);
      }
    }

    setUpUi(
      alphaCanvas, imgCanvas, sizeSpan, hueSpan, allCoords, allImages,
      allLabels
    );
  } catch (error: unknown) {
    console.error('Error setting up dataset visualization:', error);
    let msg = 'Unknown error';
    if (error instanceof Error) {
      msg = error.message;
    }
    addErrorMessage(box, `Error setting up dataset visualization: ${msg}`);
  }
}
