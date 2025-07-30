import {
  convertRawImageToImageData,
  createDatasetVisualizationWidget,
  handleDatasetVisualizationError,
  type ImageDisplayHandler,
  processDatasetCoordinates,
  setUpDatasetVisualizationUi
} from './basedatasetvisualization.js';

function createImageDisplayHandler(allImages: Uint8Array[]): ImageDisplayHandler {
  return (imageCtx: CanvasRenderingContext2D, index: number): void => {
    if (index < 0 || index >= allImages.length) {
      console.warn('Index out of bounds for images:', index);
      return;
    }
    imageCtx.clearRect(0, 0, 32, 32);
    const flatImage = allImages[index];
    const imageData = convertRawImageToImageData(flatImage, 32, 32);
    imageCtx.putImageData(imageData, 0, 0);
  };
}

function processDatasetImages(
  trainsetImages: Uint8Array,
  valsetImages: Uint8Array
): Uint8Array[] {
  const allImages: Uint8Array[] = [];

  // Process training images
  for (let i = 0; i < trainsetImages.length; i += 3072) {
    const rgbBytes = trainsetImages.slice(i, i + 3072);
    const flatImage = new Uint8Array(rgbBytes);
    allImages.push(flatImage);
  }

  // Process validation images
  for (let i = 0; i < valsetImages.length; i += 3072) {
    const rgbBytes = valsetImages.slice(i, i + 3072);
    const flatImage = new Uint8Array(rgbBytes);
    allImages.push(flatImage);
  }

  return allImages;
}

export function setUpDatasetVisualization(
  box: HTMLDivElement,
  trainsetX: number[],
  trainsetY: number[],
  valsetX: number[],
  valsetY: number[],
  trainsetImages: Uint8Array,
  valsetImages: Uint8Array
): void {
  try {
    const { allCoords, allLabels } = processDatasetCoordinates(
      trainsetX, trainsetY, valsetX, valsetY
    );

    const allImages = processDatasetImages(trainsetImages, valsetImages);

    const { alphaCanvas, imgCanvas, sizeSpan, hueSpan, valOrTrainSpan } =
      createDatasetVisualizationWidget(box);

    const imageDisplayHandler = createImageDisplayHandler(allImages);

    setUpDatasetVisualizationUi(
      alphaCanvas, imgCanvas, sizeSpan, hueSpan, valOrTrainSpan,
      allCoords, allLabels, { imageDisplayHandler }
    );
  } catch (error: unknown) {
    handleDatasetVisualizationError(box, error);
  }
}
