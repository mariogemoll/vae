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
