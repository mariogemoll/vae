import type { Pair } from './types/pair.js';

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
