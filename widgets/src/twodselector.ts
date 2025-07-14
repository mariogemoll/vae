import type { Margins } from './types/margins.js';
import type { Pair } from './types/pair';
import { mapRange } from './util.js';

export function setUp2dSelector(
  svg: SVGSVGElement,
  margins: Margins,
  xRange: Pair<number>,
  yRange: Pair<number>,
  initialX: number,
  initialY: number,
  callback?: (x: number, y: number) => void
): void {

  const width = svg.clientWidth;
  const height = svg.clientHeight;

  const xScale = mapRange.bind(null, xRange, [margins.left, width - margins.right]);
  const yScale = mapRange.bind(null, yRange, [height - margins.bottom, margins.top]);

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
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Constrain to chart bounds
    const constrainedX = Math.max(margins.left, Math.min(width - margins.right, clickX));
    const constrainedY = Math.max(margins.top, Math.min(height - margins.bottom, clickY));

    // Move dot to clicked position
    dot.setAttribute('cx', constrainedX.toString());
    dot.setAttribute('cy', constrainedY.toString());

    // Convert back to data coordinates and call callback
    if (callback) {
      const dataX = mapRange([margins.left, width - margins.right], xRange, constrainedX);
      const dataY = mapRange([height - margins.bottom, margins.top], yRange, constrainedY);
      callback(dataX, dataY);
    }

    // Start dragging from the new position
    isDragging = true;
    dragOffset.x = 0; // No offset since dot is now at cursor position
    dragOffset.y = 0;

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging) {return;}

    const rect = svg.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    // Constrain to chart bounds
    const constrainedX = Math.max(margins.left, Math.min(width - margins.right, newX));
    const constrainedY = Math.max(margins.top, Math.min(height - margins.bottom, newY));

    dot.setAttribute('cx', constrainedX.toString());
    dot.setAttribute('cy', constrainedY.toString());

    // Convert back to data coordinates and call callback
    if (callback) {
      const dataX = mapRange([margins.left, width - margins.right], xRange, constrainedX);
      const dataY = mapRange([height - margins.bottom, margins.top], yRange, constrainedY);
      callback(dataX, dataY);
    }
  };

  const handleMouseUp = (): void => {
    if (!isDragging) {return;}
    isDragging = false;
  };

  // Add event listeners
  svg.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

export function setUp2dSelectorWithLabels(
  svg: SVGSVGElement,
  margins: Margins,
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
  setUp2dSelector(svg, margins, xRange, yRange, initialX, initialY, internalCallback);
  internalCallback(initialX, initialY);
}
