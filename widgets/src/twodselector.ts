import { addDot } from './svg';
import type { Pair } from './types/pair';
import { map01ToRange } from './util';

export function setUpUnitArea2dSelector(
  svg: SVGSVGElement,
  initialX: number,
  initialY: number,
  callback: (x: number, y: number) => void
): void {
  const size = svg.viewBox.baseVal.width;
  const dot = addDot(svg, initialX * size, initialY * size, 9);
  let dragging = false;

  function setDot(x: number, y: number): void{
    const cx = Math.max(0, Math.min(size, x));
    const cy = Math.max(0, Math.min(size, y));
    dot.setAttribute('cx', cx.toString());
    dot.setAttribute('cy', cy.toString());
    callback(cx / size, 1 - cy / size);
  }

  function getMousePos(e: MouseEvent): { x: number, y: number } {
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  svg.addEventListener('mousedown', (e) => {
    dragging = true;
    const pos = getMousePos(e);
    setDot(pos.x, pos.y);
  });

  svg.addEventListener('mousemove', (e) => {
    if (!dragging) {return;}
    const pos = getMousePos(e);
    setDot(pos.x, pos.y);
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
  });
  callback(initialX, initialY); // Initial callback
}

export function setUp2dSelector(
  svg: SVGSVGElement,
  xRange: Pair<number>,
  yRange: Pair<number>,
  callback: (x: number, y: number) => void
): void {
  function internalCallback(x: number, y: number): void {
    const mappedX = map01ToRange(xRange, x);
    const mappedY = map01ToRange(yRange, y);
    callback(mappedX, mappedY);
  }
  setUpUnitArea2dSelector(svg, 0.5, 0.5, internalCallback);
}

export function setUp2dSelectorWithLabels(
  svg: SVGSVGElement,
  xLabel: HTMLElement,
  yLabel: HTMLElement,
  xRange: Pair<number>,
  yRange: Pair<number>,
  callback: (x: number, y: number) => void
): void {
  function internalCallback(x: number, y: number): void {
    xLabel.textContent = x.toFixed(2);
    yLabel.textContent = y.toFixed(2);
    callback(x, y);
  }
  setUp2dSelector(svg, xRange, yRange, internalCallback);
}
