import { getContext } from './canvas.js';
import { gridSize, numEpochs, zRange } from './constants.js';
import { addCanvas, addDiv, removePlaceholder } from './dom.js';
import { drawGridOnCanvas } from './grid.js';
import { setUpLossChart } from './losschart.js';
import { makeScale } from './util.js';

function setUpGrids(
  canvas: HTMLCanvasElement, gridData: Float32Array
): (frameIndex: number) => void {
  const ctx = getContext(canvas);
  const displaySidelength = 100;
  const rows = 3;
  const cols = 3;
  function showFrame(frameIndex: number): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xScale = makeScale(zRange, [c * displaySidelength, (c + 1) * displaySidelength]);
        const yScale = makeScale(zRange, [(r + 1) * displaySidelength, r * displaySidelength]);
        const modelIdx = r * cols + c;
        const byteOffset = (modelIdx * numEpochs + frameIndex) * gridSize ** 2 * 2 * 4;
        const gridDataView = new Float32Array(gridData.buffer, byteOffset, gridSize ** 2 * 2);
        drawGridOnCanvas(ctx, gridDataView, xScale, yScale);
      }
    }
  }

  return showFrame;
}

export function setUpModelComparison(
  minLoss: number, maxLoss: number, trainLosses: number[][], valLosses: number[][],
  gridData: Float32Array, box: HTMLDivElement
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
  const showFrame = setUpGrids(gridsCanvas, gridData);
  const losses = [...trainLosses, ...valLosses];
  setUpLossChart(lossChartContainer, minLoss, maxLoss, losses, showFrame);
}
