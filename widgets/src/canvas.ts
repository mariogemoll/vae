import type { Margins } from './types/margins.js';
import type { Pair } from './types/pair.js';
import { mapRange } from './util.js';

export function addLine(
  ctx: CanvasRenderingContext2D, stroke: string, [x1, y1]: Pair<number>, [x2, y2]: Pair<number>
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x1 + 0.5, y1 + 0.5); // Adjust for crisp edges
  ctx.lineTo(x2 + 0.5, y2 + 0.5);
  ctx.stroke();
}

export function addHorizontalLine(
  ctx: CanvasRenderingContext2D, stroke: string, [x1, x2]: Pair<number>, y: number
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const adjustedY = y + 0.5; // Adjust for crisp edges
  ctx.moveTo(x1, adjustedY);
  ctx.lineTo(x2, adjustedY);
  ctx.stroke();
}

export function addVerticalLine(
  ctx: CanvasRenderingContext2D, stroke: string, x: number, [y1, y2]: Pair<number>
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const adjustedX = x + 0.5; // Adjust for crisp edges
  ctx.moveTo(adjustedX, y1);
  ctx.lineTo(adjustedX, y2);
  ctx.stroke();
}

export function addDot(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, fill = 'red'
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fill();
}

export function addRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number,
  fill?: string, stroke?: string
): void {
  if (fill !== undefined) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
  }
  if (stroke !== undefined) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
  }
}

export function addText(
  ctx: CanvasRenderingContext2D,
  anchor: 'start' | 'middle' | 'end',
  x: number,
  y: number,
  textContent: string,
  fontSize = 10,
  fontFamily = 'sans-serif',
  fill = 'black'
): void {
  ctx.fillStyle = fill;
  ctx.font = `${fontSize.toString()}px ${fontFamily}`;
  ctx.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(textContent, x, y);
}

function generateTicks(range: [number, number], count = 6): number[] {
  const [min, max] = range;
  const step = (max - min) / (count - 1);
  const tickValues: number[] = [];

  for (let i = 0; i < count; i++) {
    tickValues.push(min + i * step);
  }

  return tickValues;
}

export function addFrame(
  canvas: HTMLCanvasElement,
  margins: Margins,
  xRange: Pair<number>,
  yRange: Pair<number>,
  numTicks: number
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for canvas');
  }

  const width = canvas.width;
  const height = canvas.height;

  const xScale = mapRange.bind(null, xRange, [margins.left, width - margins.right]);
  const yScale = mapRange.bind(null, yRange, [height - margins.bottom, margins.top]);

  // x axis
  addHorizontalLine(ctx, 'black', [margins.left, width - margins.right], height - margins.bottom);
  const xTicks = generateTicks(xRange, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(ctx, 'black', x, [height - margins.bottom, height - margins.bottom + 6]);
    addText(ctx, 'middle', x, height - margins.bottom + 18, tickValue.toFixed(1));
  });

  // y axis
  addVerticalLine(ctx, 'black', margins.left, [margins.top, height - margins.bottom]);
  const yTicks = generateTicks(yRange);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(ctx, 'black', [margins.left - 6, margins.left], y);
    addText(ctx, 'end', margins.left - 9, y + 3, tickValue.toFixed(1));
  });

  // Add top border line
  addHorizontalLine(ctx, 'black', [margins.left, width - margins.right], margins.top);

  // Add right border line
  addVerticalLine(ctx, 'black', width - margins.right, [margins.top, height - margins.bottom]);
}
