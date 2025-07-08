import { addHorizontalLine, addText, addVerticalLine } from './svg.js';
import type { Pair } from './types/pair';
import { getAttribute, mapRange } from './util.js';


function generateTicks(range: [number, number], count = 6): number[] {
  const [min, max] = range;
  const step = (max - min) / (count - 1);
  const tickValues: number[] = [];

  for (let i = 0; i < count; i++) {
    tickValues.push(min + i * step);
  }

  return tickValues;
}

export function setUp2dSelector(
  svg: SVGSVGElement,
  margin: { left: number, right: number, top: number, bottom: number },
  xRange: Pair<number>,
  yRange: Pair<number>,
  initialX: number,
  initialY: number,
  callback?: (x: number, y: number) => void
): void {
  const width = svg.clientWidth;
  const height = svg.clientHeight;

  const xScale = mapRange.bind(null, xRange, [margin.left, width - margin.right]);
  const yScale = mapRange.bind(null, yRange, [height - margin.bottom, margin.top]);

  // x axis
  addHorizontalLine(svg, 'black', [margin.left, width - margin.right], height - margin.bottom);
  const xTicks = generateTicks(xRange);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(svg, 'black', x, [height - margin.bottom, height - margin.bottom + 6]);
    addText(svg, 'middle', x, height - margin.bottom + 18, tickValue.toFixed(1));
  });


  // y axis
  addVerticalLine(svg, 'black', margin.left, [margin.top, height - margin.bottom]);
  const yTicks = generateTicks(yRange);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(svg, 'black', [margin.left - 6, margin.left], y);
    addText(svg, 'end', margin.left - 9, y + 3, tickValue.toFixed(1));
  });

  // Add top border line
  addHorizontalLine(svg, 'black', [margin.left, width - margin.right], margin.top);

  // Add right border line
  addVerticalLine(svg, 'black', width - margin.right, [margin.top, height - margin.bottom]);

  // Add draggable dot if position is provided
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', xScale(initialX).toString());
  dot.setAttribute('cy', yScale(initialY).toString());
  dot.setAttribute('r', '6');
  dot.setAttribute('fill', '#ff6b6b');
  dot.setAttribute('stroke', '#d63031');
  dot.setAttribute('stroke-width', '2');
  dot.style.cursor = 'crosshair';
  svg.appendChild(dot);

  // Add drag functionality
  let isDragging = false;
  const dragOffset = { x: 0, y: 0 };

  const handleMouseDown = (e: MouseEvent): void => {
    isDragging = true;

    const rect = svg.getBoundingClientRect();
    const dotX = parseFloat(getAttribute(dot, 'cx'));
    const dotY = parseFloat(getAttribute(dot, 'cy'));

    dragOffset.x = e.clientX - rect.left - dotX;
    dragOffset.y = e.clientY - rect.top - dotY;

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging) {return;}

    const rect = svg.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Constrain to chart bounds
    const constrainedX = Math.max(margin.left, Math.min(width - margin.right, newX));
    const constrainedY = Math.max(margin.top, Math.min(height - margin.bottom, newY));

    dot.setAttribute('cx', constrainedX.toString());
    dot.setAttribute('cy', constrainedY.toString());

    // Convert back to data coordinates and call callback
    if (callback) {
      const dataX = mapRange([margin.left, width - margin.right], xRange, constrainedX);
      const dataY = mapRange([height - margin.bottom, margin.top], yRange, constrainedY);
      callback(dataX, dataY);
    }
  };

  const handleMouseUp = (): void => {
    if (!isDragging) {return;}
    isDragging = false;
  };

  // Add event listeners
  dot.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

export function setUp2dSelectorWithLabels(
  svg: SVGSVGElement,
  margin: { left: number, right: number, top: number, bottom: number },
  xRange: Pair<number>,
  yRange: Pair<number>,
  xLabel: HTMLElement,
  yLabel: HTMLElement,
  initialX: number,
  initialY: number,
  callback: (x: number, y: number) => void
): void {
  function internalCallback(x: number, y: number): void {
    xLabel.textContent = x.toFixed(2);
    yLabel.textContent = y.toFixed(2);
    callback(x, y);
  }
  setUp2dSelector(svg, margin, xRange, yRange, initialX, initialY, internalCallback);
}
