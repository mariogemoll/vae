import {
  calculateDatasetIndex,
  convertRawImageToImageData,
  createDatasetVisualizationWidget,
  handleDatasetVisualizationError,
  type ImageDisplayHandler,
  processDatasetCoordinates,
  setUpDatasetVisualizationUi } from './basedatasetvisualization.js';
import { sidelength } from './constants.js';
import { renderSample } from './dataset.js';
import type Pair from './types/pair.js';
import { floorString } from './util.js';

type ImageRenderer = (
  ctx: CanvasRenderingContext2D, dataset: string, imageId: number
) => Promise<void>;

function createAsyncImageDisplayHandler(
  renderPreview: ImageRenderer,
  renderActual: ImageRenderer
): ImageDisplayHandler {
  let currentImageLoadTimeout: number | null = null;
  let currentAbortController: AbortController | null = null;
  let currentImageDisplayId = 0;
  let selectedPointIndex: number | null = null;

  return async(
    imageCtx: CanvasRenderingContext2D,
    index: number,
    allCoords: Pair<number>[],
    allLabels: string[]
  ): Promise<void> => {
    selectedPointIndex = index;

    if (index < 0 || index >= allCoords.length) {
      console.warn('Index out of bounds for coordinates:', index);
      return;
    }

    // Abort any pending image load timeout
    if (currentImageLoadTimeout !== null) {
      clearTimeout(currentImageLoadTimeout);
      currentImageLoadTimeout = null;
    }

    // Abort any ongoing fetch request
    if (currentAbortController !== null) {
      currentAbortController.abort();
      currentAbortController = null;
    }

    // Increment the display ID to invalidate any ongoing operations
    currentImageDisplayId++;
    const displayId = currentImageDisplayId;

    // Calculate the local index within the dataset
    const { dataset, localIndex } = calculateDatasetIndex(index, allLabels);

    try {
      // First, render the preview image immediately
      await renderPreview(imageCtx, dataset, localIndex);

      // Check if this operation is still valid (not superseded by a newer one)
      if (displayId !== currentImageDisplayId) {
        return; // This operation was superseded, abort
      }

      // Store the current index to check if it's still valid when the timeout fires
      const targetIndex = index;

      // After a delay, render the actual image
      currentImageLoadTimeout = window.setTimeout(() => {
        // Check if this operation is still valid
        if (displayId !== currentImageDisplayId || selectedPointIndex !== targetIndex) {
          return; // Abort if a different image is now selected or operation was superseded
        }

        // Create a new abort controller for this operation
        currentAbortController = new AbortController();

        // Use an async IIFE to handle the promise properly
        (async(): Promise<void> => {
          try {
            await renderActual(imageCtx, dataset, localIndex);

            // Double-check that this operation is still valid before the final update
            if (displayId !== currentImageDisplayId || selectedPointIndex !== targetIndex) {
              return; // Operation was superseded
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('Image load aborted:', error);
              // Request was aborted, this is expected behavior
              return;
            }
            console.warn('Failed to render actual image:', error);
            // Keep showing the preview image if actual image fails to load
          } finally {
            currentImageLoadTimeout = null;
            currentAbortController = null;
          }
        })().catch(console.error);
      }, 1000);

    } catch (error) {
      // Check if this operation is still valid before showing fallback
      if (displayId !== currentImageDisplayId) {
        return; // This operation was superseded, abort
      }

      console.error('Failed to render preview:', error);
      // Clear the canvas and show fallback to a simple colored rectangle
      const [size, hue] = allCoords[index];
      imageCtx.clearRect(0, 0, imageCtx.canvas.width, imageCtx.canvas.height);
      const [r, g, b] = [floorString(size * 255), floorString(hue * 255), floorString(128)];
      imageCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      imageCtx.fillRect(0, 0, 32, 32);
    }
  };
}

export function setUpDatasetVisualizationWithPreviewGeneric(
  box: HTMLDivElement,
  trainsetX: number[],
  trainsetY: number[],
  valsetX: number[],
  valsetY: number[],
  renderPreview: ImageRenderer,
  renderActual: ImageRenderer
): void {
  try {
    const { allCoords, allLabels } = processDatasetCoordinates(
      trainsetX, trainsetY, valsetX, valsetY
    );

    const { alphaCanvas, imgCanvas, sizeSpan, hueSpan, valOrTrainSpan } =
      createDatasetVisualizationWidget(box);

    const imageDisplayHandler = createAsyncImageDisplayHandler(renderPreview, renderActual);

    setUpDatasetVisualizationUi(
      alphaCanvas, imgCanvas, sizeSpan, hueSpan, valOrTrainSpan,
      allCoords, allLabels, { imageDisplayHandler }
    );
  } catch (error: unknown) {
    handleDatasetVisualizationError(box, error);
  }
}

export function setUpDatasetVisualizationWithPreview(
  datasetVisualizationBox: HTMLDivElement,
  trainsetCoordsX: number[],
  trainsetCoordsY: number[],
  valsetCoordsX: number[],
  valsetCoordsY: number[],
  picaInstance: pica.Pica,
  faceImg: HTMLImageElement,
  imageBaseUrl: string
): void {
  // Create temporary canvases for renderSample
  const hiresCanvas = document.createElement('canvas');
  hiresCanvas.width = 128;
  hiresCanvas.height = 128;

  const downsampledCanvas = document.createElement('canvas');
  downsampledCanvas.width = 32;
  downsampledCanvas.height = 32;

  async function renderPreview(
    ctx: CanvasRenderingContext2D, label: string, id: number
  ): Promise<void> {
    let size, hue;
    if (label === 'train') {
      size = trainsetCoordsX[id];
      hue = trainsetCoordsY[id];
    } else {
      size = valsetCoordsX[id];
      hue = valsetCoordsY[id];
    }
    return renderSample(picaInstance, hiresCanvas, ctx.canvas, faceImg, size, hue);
  }

  async function renderActual(
    imgCtx: CanvasRenderingContext2D, dataset: string, index: number
  ): Promise<void> {
    const imageSize = 3072; // 32 * 32 * 3 channels

    const startByte = index * imageSize;
    const endByte = startByte + imageSize;

    // Fetch the specific byte range for this image
    const response = await fetch(`${imageBaseUrl}/${dataset}set_images.bin`, {
      headers: {
        'Range': `bytes=${startByte.toString()}-${(endByte - 1).toString()}`
      }
      // signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image data: ${response.status.toString()}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);
    const imageData = convertRawImageToImageData(rawBytes, sidelength, sidelength);
    imgCtx.putImageData(imageData, 0, 0);
  }

  setUpDatasetVisualizationWithPreviewGeneric(
    datasetVisualizationBox,
    trainsetCoordsX,
    trainsetCoordsY,
    valsetCoordsX,
    valsetCoordsY,
    renderPreview,
    renderActual
  );
}
