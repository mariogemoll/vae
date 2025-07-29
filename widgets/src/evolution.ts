import { addAxes, getContext } from './canvas.js';
import { gridSize, zRange } from './constants.js';
import { addCanvas, addDiv, removePlaceholder } from './dom.js';
import { drawGridOnCanvas } from './grid.js';
import { setUpLossChart } from './losschart.js';
import type Margins from './types/margins.js';
import { makeScale } from './util.js';

function setUpGrids(
  canvas: HTMLCanvasElement, margins: Margins, gridData: Float32Array
): (frameIndex: number) => void {
  const ctx = getContext(canvas);
  const xScale = makeScale(zRange, [margins.left, canvas.width - margins.right]);
  const yScale = makeScale(zRange, [canvas.height - margins.bottom, margins.top]);
  function showFrame(frameIndex: number): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const byteOffset = gridData.byteOffset + frameIndex * gridSize ** 2 * 2 * 4;
    const gridDataView = new Float32Array(gridData.buffer, byteOffset, gridSize ** 2 * 2);
    addAxes(ctx, xScale, yScale, 5);
    drawGridOnCanvas(ctx, gridDataView, xScale, yScale);
  }
  return showFrame;
}

export function setUpEvolution(
  box: HTMLDivElement,
  trainLosses: number[],
  valLosses: number[],
  gridData: Float32Array
): void {
  removePlaceholder(box);
  const widget = addDiv(box, {}, { position: 'relative' });
  const lossChartContainer = addDiv(widget, {}, { width: '400px', height: '300px' });
  widget.appendChild(lossChartContainer);
  const gridsCanvas = addCanvas(
    widget,
    { width: '320', height: '300' },
    { position: 'absolute', top: '0', left: '420px' }
  );
  const margins = { top: 20, right: 20, bottom: 20, left: 40 };
  const showFrame = setUpGrids(gridsCanvas, margins, gridData);
  const minLoss = Math.min(Math.min(...trainLosses), Math.min(...valLosses));
  const maxLoss = Math.max(Math.max(...trainLosses), Math.max(...valLosses));
  setUpLossChart(lossChartContainer, minLoss, maxLoss, [trainLosses, valLosses], showFrame);
}
