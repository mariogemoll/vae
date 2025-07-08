import type { Margins } from './types/margins.js';
import type { Pair } from './types/pair.js';
import { getAttribute, mapRange } from './util.js';

export function addLine(
  svg: SVGSVGElement, stroke: string, [x1, y1]: Pair<number>, [x2, y2]: Pair<number>
): void {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1.toString());
  line.setAttribute('y1', y1.toString());
  line.setAttribute('x2', x2.toString());
  line.setAttribute('y2', y2.toString());
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '0.5');
  line.setAttribute('stroke-rendering', 'crispEdges');
  // Uncomment the following line if you want to set a specific stroke color
  // line.style.stroke = stroke;
  // line.style.strokeWidth = '0.5';
  // line.style.stroke
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
  svg: SVGSVGElement, margins: Margins, xRange: Pair<number>, yRange: Pair<number>
): void {
  // const width = svg.clientWidth;
  // const height = svg.clientHeight;
  const width = parseFloat(getAttribute(svg, 'width'));
  const height = parseFloat(getAttribute(svg, 'height'));

  const xScale = mapRange.bind(null, xRange, [margins.left, width - margins.right]);
  const yScale = mapRange.bind(null, yRange, [height - margins.bottom, margins.top]);

  // x axis
  addHorizontalLine(svg, 'black', [margins.left, width - margins.right], height - margins.bottom);
  const xTicks = generateTicks(xRange);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(svg, 'black', x, [height - margins.bottom, height - margins.bottom + 6]);
    addText(svg, 'middle', x, height - margins.bottom + 18, tickValue.toFixed(1));
  });


  // y axis
  addVerticalLine(svg, 'black', margins.left, [margins.top, height - margins.bottom]);
  const yTicks = generateTicks(yRange);
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
