import { getContext } from './canvas.js';
import { gridSize, numEpochs, zRange } from './constants.js';
import { addCanvas, addDiv, removePlaceholder } from './dom.js';
import { drawGridOnCanvas } from './grid.js';
import { setUpLossChart } from './losschart.js';
import { makeScale } from './util.js';

function setUpGrids(
  canvas: HTMLCanvasElement, gridData: Float32Array, selectedModelIndex?: number,
  onModelClick?: (modelIndex: number) => void
): (frameIndex: number) => void {
  const ctx = getContext(canvas);
  const displaySidelength = 100;
  const rows = 3;
  const cols = 3;
  let hoveredModelIndex: number | undefined;
  let currentFrameIndex = 0;

  function getModelIndexFromCoords(x: number, y: number): number | undefined {
    const col = Math.floor(x / displaySidelength);
    const row = Math.floor(y / displaySidelength);
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return row * cols + col;
    }
    return undefined;
  }

  function showFrame(frameIndex: number): void {
    currentFrameIndex = frameIndex;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xScale = makeScale(zRange, [c * displaySidelength, (c + 1) * displaySidelength]);
        const yScale = makeScale(zRange, [(r + 1) * displaySidelength, r * displaySidelength]);
        const modelIdx = r * cols + c;
        const byteOffset = (modelIdx * numEpochs + frameIndex) * gridSize ** 2 * 2 * 4;
        const gridDataView = new Float32Array(gridData.buffer, byteOffset, gridSize ** 2 * 2);
        drawGridOnCanvas(ctx, gridDataView, xScale, yScale);

        // Draw hover rectangle (grey)
        if (hoveredModelIndex !== undefined && modelIdx === hoveredModelIndex) {
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            Math.floor(c * displaySidelength) + 0.5,
            Math.floor(r * displaySidelength) + 0.5,
            displaySidelength,
            displaySidelength
          );
        }

        // Draw selection rectangle (black, on top of hover)
        if (selectedModelIndex !== undefined && modelIdx === selectedModelIndex) {
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(
            Math.floor(c * displaySidelength) + 0.5,
            Math.floor(r * displaySidelength) + 0.5,
            displaySidelength,
            displaySidelength
          );
        }
      }
    }
  }

  // Add mouse event listeners
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newHoveredIndex = getModelIndexFromCoords(x, y);

    if (newHoveredIndex !== hoveredModelIndex) {
      hoveredModelIndex = newHoveredIndex;
      // Update cursor style - only show pointer if hovering over a cell that's not already selected
      const isHoveringClickableCell = (
        hoveredModelIndex !== undefined && hoveredModelIndex !== selectedModelIndex
      );
      canvas.style.cursor = isHoveringClickableCell ? 'pointer' : 'default';
      // Redraw the current frame to update hover state
      showFrame(currentFrameIndex);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoveredModelIndex !== undefined) {
      hoveredModelIndex = undefined;
      canvas.style.cursor = 'default';
      // Redraw the current frame to remove hover state
      showFrame(currentFrameIndex);
    }
  });

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedModelIndex = getModelIndexFromCoords(x, y);

    // Only call the callback if clicking on a valid cell that's not already selected
    if (
      clickedModelIndex !== undefined && clickedModelIndex !== selectedModelIndex &&
      onModelClick !== undefined
    ) {
      onModelClick(clickedModelIndex);
    }
  });

  return showFrame;
}

export function setUpModelComparison(
  minLoss: number, maxLoss: number, trainLosses: number[][], valLosses: number[][],
  gridData: Float32Array, box: HTMLDivElement, selectedModelIndex?: number,
  onModelClick?: (modelIndex: number) => void
): void {
  removePlaceholder(box);
  const widget = addDiv(box, {}, { height: '340px', position: 'relative' });
  const lossChartContainer = addDiv(widget, {}, { width: '400px', height: '300px' });
  widget.appendChild(lossChartContainer);
  const gridsCanvas = addCanvas(
    widget,
    { width: '340', height: '340' },
    { position: 'absolute', top: '0', left: '420px' }
  );
  const showFrame = setUpGrids(gridsCanvas, gridData, selectedModelIndex, onModelClick);
  const losses = [...trainLosses, ...valLosses];
  setUpLossChart(lossChartContainer, minLoss, maxLoss, losses, showFrame);
}
