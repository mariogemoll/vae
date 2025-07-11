import type { Margins } from './types/margins.js';
import type { Pair } from './types/pair.js';
import { generateTicks, getAttribute, mapRange } from './util.js';

export function addSvg(
  parent: HTMLElement, attrs: Record<string, string>, style: Partial<CSSStyleDeclaration>
): SVGSVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  Object.assign(el.style, style);
  parent.appendChild(el);
  return el;
}

export function addSvgEl(
  parent: SVGElement,
  tagName: string,
  attrs: Record<string, string>,
  style: Partial<CSSStyleDeclaration> = {}
): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'tagName');
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  Object.assign(el.style, style);
  parent.appendChild(el);
  return el;
}

export function addLine(
  svg: SVGSVGElement, stroke: string, [x1, y1]: Pair<number>, [x2, y2]: Pair<number>
): void {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', (Math.round(x1) + 0.5).toString());
  line.setAttribute('y1', (Math.round(y1) + 0.5).toString());
  line.setAttribute('x2', (Math.round(x2) + 0.5).toString());
  line.setAttribute('y2', (Math.round(y2) + 0.5).toString());
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '0.5');
  line.setAttribute('stroke-rendering', 'crispEdges');
  svg.appendChild(line);
}

export function addHorizontalLine(
  svg: SVGSVGElement, stroke: string, [x1, x2]: Pair<number>, y: number
): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  y = y + 0.5; // Adjust y position for crisp edges
  line.setAttribute('x1', x1.toString());
  line.setAttribute('y1', y.toString());
  line.setAttribute('x2', x2.toString());
  line.setAttribute('y2', y.toString());
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '0.5');
  line.setAttribute('stroke-rendering', 'crispEdges');
  svg.appendChild(line);
  return line;
}

export function addVerticalLine(
  svg: SVGSVGElement, stroke: string, x: number, [y1, y2]: Pair<number>
): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  x = x + 0.5; // Adjust x position for crisp edges
  line.setAttribute('x1', x.toString());
  line.setAttribute('y1', y1.toString());
  line.setAttribute('x2', x.toString());
  line.setAttribute('y2', y2.toString());
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '0.5');
  line.setAttribute('stroke-rendering', 'crispEdges');
  svg.appendChild(line);
  return line;
}

export function addDot(
  svg: SVGSVGElement, cx: number, cy: number, radius: number
): SVGCircleElement {
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', radius.toString());
  dot.setAttribute('fill', 'red'); // Dot color
  dot.setAttribute('cx', cx.toString());
  dot.setAttribute('cy', cy.toString());
  svg.appendChild(dot);
  return dot;
}

export function addRect(
  svg: SVGSVGElement, x: number, y: number, width: number, height: number
): SVGRectElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', width.toString());
  rect.setAttribute('height', height.toString());
  svg.appendChild(rect);
  return rect;
}

export function addText(
  svg: SVGSVGElement, anchor: string, x: number, y: number, textContent: string
): SVGTextElement {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x.toString());
  text.setAttribute('y', y.toString());
  text.setAttribute('text-anchor', anchor);
  text.setAttribute('font-size', '10');
  text.setAttribute('font-family', 'sans-serif');
  text.setAttribute('fill', 'black');
  text.textContent = textContent;
  svg.appendChild(text);
  return text;
}

export function addFrame(
  svg: SVGSVGElement, margins: Margins, xRange: Pair<number>, yRange: Pair<number>, numTicks: number
): void {
  const width = parseFloat(getAttribute(svg, 'width'));
  const height = parseFloat(getAttribute(svg, 'height'));

  const xScale = mapRange.bind(null, xRange, [margins.left, width - margins.right]);
  const yScale = mapRange.bind(null, yRange, [height - margins.bottom, margins.top]);

  // x axis
  addHorizontalLine(svg, 'black', [margins.left, width - margins.right], height - margins.bottom);
  const xTicks = generateTicks(xRange, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(svg, 'black', x, [height - margins.bottom, height - margins.bottom + 6]);
    addText(svg, 'middle', x, height - margins.bottom + 18, tickValue.toFixed(1));
  });

  // y axis
  addVerticalLine(svg, 'black', margins.left, [margins.top, height - margins.bottom]);
  const yTicks = generateTicks(yRange, numTicks);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(svg, 'black', [margins.left - 6, margins.left], y);
    addText(svg, 'end', margins.left - 9, y + 3, tickValue.toFixed(1));
  });

  // Add top border line
  addHorizontalLine(svg, 'black', [margins.left, width - margins.right], margins.top);

  // Add right border line
  addVerticalLine(svg, 'black', width - margins.right, [margins.top, height - margins.bottom]);
}

export function rectPath([x0, y0]: Pair<number>, [x1, y1]: Pair<number>): string {
  const x0Str = x0.toFixed(2);
  const y0Str = y0.toFixed(2);
  const x1Str = x1.toFixed(2);
  const y1Str = y1.toFixed(2);
  return `M${x0Str},${y0Str} H${x1Str} V${y1Str} H${x0Str} Z`;
}
