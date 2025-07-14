import { addFrame, getContext } from './canvas.js';
import { addImgCanvas, addTwoLabeledTextFields } from './commonelements.js';
import { hueRange, sizeRange } from './constants.js';
import { addCanvas, addDiv, addErrorMessage, addSpan, removePlaceholder } from './dom.js';
import type { Pair } from './types/pair.js';
import { mapRange } from './util.js';

function setUpUi(
  scatterCanvas: HTMLCanvasElement, imageCanvas: HTMLCanvasElement, sizeValueSpan: HTMLSpanElement,
  hueValueSpan: HTMLSpanElement, valOrTrainSpan: HTMLSpanElement, allCoords: Pair<number>[],
  allImages: Uint8Array[], allLabels: string[]
): void {
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
      valOrTrainSpan.textContent = `(${allLabels[highlightIndex]})`;
    }
  }
  // Initial render
  let selectedPointIndex: number | null = null;
  let isDragging = false;

  drawScatter(scatterCtx, null, sizeRange, hueRange);

  function findClosestPoint(mx: number, my: number): number | null {
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

    return minDist <= thresholdPx ? minIndex : null;
  }

  // Handle mouse down to start interaction
  scatterCanvas.addEventListener('mousedown', (event) => {
    const rect = scatterCanvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const closestIndex = findClosestPoint(mx, my);
    if (closestIndex !== null) {
      selectedPointIndex = closestIndex;
      updateImageDisplay(imageCtx, closestIndex);
      drawScatter(scatterCtx, selectedPointIndex, sizeRange, hueRange);
      isDragging = true;
    }

    event.preventDefault();
  });

  // Handle mouse move during drag
  scatterCanvas.addEventListener('mousemove', (event) => {
    if (!isDragging) {return;}

    const rect = scatterCanvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const closestIndex = findClosestPoint(mx, my);
    if (closestIndex !== null) {
      selectedPointIndex = closestIndex;
      updateImageDisplay(imageCtx, closestIndex);
      drawScatter(scatterCtx, selectedPointIndex, sizeRange, hueRange);
    }
  });

  // Handle mouse up to stop interaction
  window.addEventListener('mouseup', () => {
    isDragging = false;
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
  valsetY: number[], trainsetImages: Uint8Array, valsetImages: Uint8Array): void {
  try {
    removePlaceholder(box);
    const widget = addDiv(box, {}, { height: '300px', position: 'relative' });

    const alphaCanvas = addCanvas(
      widget, { width: '280', height: '250' }, { position: 'absolute', cursor: 'crosshair' }
    );

    const [sizeSpan, hueSpan] = addTwoLabeledTextFields(widget, 'Size', 'Hue');

    const valOrTrainSpan = addSpan(widget, {}, {
      position: 'absolute',
      left: '200px',
      top: '240px',
      textAlign: 'right'
    });

    const imgCanvas = addImgCanvas(widget, 288);


    const data: Record<string, { X: number[], Y: number[], images: Uint8Array }> = {
      'train': {
        'X': trainsetX,
        'Y': trainsetY,
        'images': trainsetImages
      },
      'val': {
        'X': valsetX,
        'Y': valsetY,
        'images': valsetImages
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

      const imageBytes = data[label].images;
      for (let i = 0; i < imageBytes.length; i += 3072) {
        const rgbBytes = imageBytes.slice(i, i + 3072);
        const flatImage = new Uint8Array(rgbBytes);
        allImages.push(flatImage);
      }
    }

    setUpUi(
      alphaCanvas, imgCanvas, sizeSpan, hueSpan, valOrTrainSpan, allCoords, allImages,
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
