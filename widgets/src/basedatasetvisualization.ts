import { addFrameUsingScales, drawScatter, getContext } from './canvas.js';
import { addImgCanvas, addTwoLabeledTextFields } from './commonelements.js';
import { hueRange, sizeRange } from './constants.js';
import { addCanvas, addDiv, addErrorMessage, addSpan, removePlaceholder } from './dom.js';
import type Pair from './types/pair.js';
import type Scale from './types/scale.js';
import { getEventCoordinates, makeScale } from './util.js';

export type ImageDisplayHandler = (
  imageCtx: CanvasRenderingContext2D,
  index: number,
  allCoords: Pair<number>[],
  allLabels: string[]
) => void | Promise<void>;

export interface DatasetVisualizationConfig {
  thresholdPx?: number;
  margins?: { top: number; right: number; bottom: number; left: number };
  imageDisplayHandler: ImageDisplayHandler;
}

function updateScatterUncurried(
  ctx: CanvasRenderingContext2D,
  sizeValueSpan: HTMLSpanElement,
  hueValueSpan: HTMLSpanElement,
  valOrTrainSpan: HTMLSpanElement,
  xScale: Scale,
  yScale: Scale,
  coords: Pair<number>[],
  labels: string[],
  highlightIndex?: number
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  addFrameUsingScales(ctx, xScale, yScale, 6);
  const colors = labels.map(label => label === 'train' ? '#ccc' : '#999');
  drawScatter(ctx, xScale, yScale, coords, colors, highlightIndex);
  if (highlightIndex !== undefined) {
    sizeValueSpan.textContent = coords[highlightIndex][0].toFixed(2);
    hueValueSpan.textContent = coords[highlightIndex][1].toFixed(2);
    valOrTrainSpan.textContent = `(${labels[highlightIndex]})`;
  }
}

function findClosestPoint(
  allCoords: Pair<number>[],
  mx: number,
  my: number,
  margins: { top: number; right: number; bottom: number; left: number },
  thresholdPx: number
): number | null {
  const scale = 200;
  const xScale = scale / (sizeRange[1] - sizeRange[0]);

  let minDist = Infinity;
  let minIndex = -1;

  for (let i = 0; i < allCoords.length; i++) {
    const [x, y] = allCoords[i];

    // Skip points outside the range
    if (x < sizeRange[0] || x > sizeRange[1] || y < hueRange[0] || y > hueRange[1]) {
      continue;
    }

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

export function setUpDatasetVisualizationUi(
  scatterCanvas: HTMLCanvasElement,
  imageCanvas: HTMLCanvasElement,
  sizeValueSpan: HTMLSpanElement,
  hueValueSpan: HTMLSpanElement,
  valOrTrainSpan: HTMLSpanElement,
  allCoords: Pair<number>[],
  allLabels: string[],
  config: DatasetVisualizationConfig
): void {
  const scatterCtx = getContext(scatterCanvas);
  const imageCtx = getContext(imageCanvas);

  const margins = config.margins ?? { top: 10, right: 40, bottom: 50, left: 40 };
  const thresholdPx = config.thresholdPx ?? 10;

  // Initial render state
  let selectedPointIndex: number | null = null;
  let isDragging = false;

  const scatterXScale = makeScale(sizeRange, [margins.left, scatterCanvas.width - margins.right]);
  const scatterYScale = makeScale(hueRange, [scatterCanvas.height - margins.bottom, margins.top]);

  const updateScatter = updateScatterUncurried.bind(
    null, scatterCtx, sizeValueSpan, hueValueSpan, valOrTrainSpan,
    scatterXScale, scatterYScale, allCoords, allLabels
  );
  updateScatter();

  const handleImageUpdate = (index: number): void => {
    const result = config.imageDisplayHandler(imageCtx, index, allCoords, allLabels);
    if (result instanceof Promise) {
      result.catch(console.error);
    }
  };

  // Handle mouse/touch down to start interaction
  const handleStart = (event: MouseEvent | TouchEvent): void => {
    const coords = getEventCoordinates(event);
    const rect = scatterCanvas.getBoundingClientRect();
    const mx = coords.clientX - rect.left;
    const my = coords.clientY - rect.top;

    const closestIndex = findClosestPoint(allCoords, mx, my, margins, thresholdPx);
    if (closestIndex !== null) {
      selectedPointIndex = closestIndex;
      handleImageUpdate(closestIndex);
      updateScatter(selectedPointIndex);
      isDragging = true;
    }

    event.preventDefault();
  };

  // Handle mouse/touch move during drag
  const handleMove = (event: MouseEvent | TouchEvent): void => {
    if (!isDragging) { return; }

    const coords = getEventCoordinates(event);
    const rect = scatterCanvas.getBoundingClientRect();
    const mx = coords.clientX - rect.left;
    const my = coords.clientY - rect.top;

    const closestIndex = findClosestPoint(allCoords, mx, my, margins, thresholdPx);
    if (closestIndex !== null) {
      selectedPointIndex = closestIndex;
      handleImageUpdate(closestIndex);
      updateScatter(selectedPointIndex);
    }
  };

  // Handle mouse/touch up to stop interaction
  const handleEnd = (): void => {
    isDragging = false;
  };

  // Add event listeners for both mouse and touch
  scatterCanvas.addEventListener('mousedown', handleStart);
  scatterCanvas.addEventListener('touchstart', handleStart, { passive: false });

  scatterCanvas.addEventListener('mousemove', handleMove);
  scatterCanvas.addEventListener('touchmove', handleMove, { passive: false });

  window.addEventListener('mouseup', handleEnd);
  window.addEventListener('touchend', handleEnd);
  window.addEventListener('touchcancel', handleEnd);

  // Select a random point to display initially
  const initialIndex = Math.floor(Math.random() * allCoords.length);
  selectedPointIndex = initialIndex;
  handleImageUpdate(initialIndex);
  updateScatter(initialIndex);
}

export function createDatasetVisualizationWidget(
  box: HTMLDivElement
): {
  widget: HTMLDivElement;
  alphaCanvas: HTMLCanvasElement;
  imgCanvas: HTMLCanvasElement;
  sizeSpan: HTMLSpanElement;
  hueSpan: HTMLSpanElement;
  valOrTrainSpan: HTMLSpanElement;
} {
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

  return {
    widget,
    alphaCanvas,
    imgCanvas,
    sizeSpan,
    hueSpan,
    valOrTrainSpan
  };
}

export function processDatasetCoordinates(
  trainsetX: number[],
  trainsetY: number[],
  valsetX: number[],
  valsetY: number[]
): { allCoords: Pair<number>[]; allLabels: string[] } {
  const data: Record<string, { X: number[], Y: number[] }> = {
    'train': { X: trainsetX, Y: trainsetY },
    'val': { X: valsetX, Y: valsetY }
  };

  const labels = ['train', 'val'];
  const allCoords: Pair<number>[] = [];
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
  }

  return { allCoords, allLabels };
}

export function calculateDatasetIndex(
  globalIndex: number,
  allLabels: string[]
): { dataset: string; localIndex: number } {
  let trainCount = 0;
  for (let i = 0; i < allLabels.length; i++) {
    if (allLabels[i] === 'train') { trainCount++; }
    if (i === globalIndex) {
      if (allLabels[i] === 'val') {
        return {
          dataset: 'val',
          localIndex: globalIndex - trainCount
        };
      } else {
        return {
          dataset: 'train',
          localIndex: trainCount - 1
        };
      }
    }
  }
  // Fallback - shouldn't reach here in normal operation
  return { dataset: 'train', localIndex: 0 };
}

export function convertRawImageToImageData(
  rawBytes: Uint8Array,
  width: number,
  height: number
): ImageData {
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

  return new ImageData(rgba, width, height);
}

export function handleDatasetVisualizationError(box: HTMLDivElement, error: unknown): void {
  console.error('Error setting up dataset visualization:', error);
  let msg = 'Unknown error';
  if (error instanceof Error) {
    msg = error.message;
  }
  addErrorMessage(box, `Error setting up dataset visualization: ${msg}`);
}
