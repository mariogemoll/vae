import type { Margins } from './types/margins.js';
import type { Pair } from './types/pair.js';
import { getAttribute, mapRange } from './util.js';

export function addDot(
  svg: SVGSVGElement, pos: Pair<number>, radius: number
): SVGCircleElement {
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', radius.toString());
  dot.setAttribute('fill', 'red'); // Dot color
  dot.setAttribute('cx', pos[0].toString());
  dot.setAttribute('cy', pos[1].toString());
  svg.appendChild(dot);
  return dot;
}

function addEllipse(svg: SVGSVGElement, pos: Pair<number>, radii: Pair<number>): SVGEllipseElement {
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('fill', 'rgba(0, 0, 255, 0.3)');
  ellipse.setAttribute('cx', pos[0].toString());
  ellipse.setAttribute('cy', pos[1].toString());
  ellipse.setAttribute('rx', radii[0].toString());
  ellipse.setAttribute('ry', radii[1].toString());
  svg.appendChild(ellipse);
  return ellipse;
}

export function setUpBasicRemoteControlledDot(
  svg: SVGSVGElement,
  pos: Pair<number>,
  radii: Pair<number>
): (newPos: Pair<number>, newRadii: Pair<number>) => void {
  const ellipse = addEllipse(svg, pos, radii);
  const dot = addDot(svg, pos, 2);

  return (newPos: Pair<number>, newRadii: Pair<number>): void => {
    dot.setAttribute('cx', newPos[0].toString());
    dot.setAttribute('cy', newPos[1].toString());
    ellipse.setAttribute('cx', newPos[0].toString());
    ellipse.setAttribute('cy', newPos[1].toString());
    ellipse.setAttribute('rx', newRadii[0].toString());
    ellipse.setAttribute('ry', newRadii[1].toString());
  };
}

export function setUpRemoteControlledDot(
  svg: SVGSVGElement,
  margins: Margins,
  domains: Pair<Pair<number>>,
  initialMu: Pair<number>,
  initialStdDev: Pair<number>
): (newPos: Pair<number>, newRadii: Pair<number>) => void {
  const width = parseFloat(getAttribute(svg, 'width'));
  const height = parseFloat(getAttribute(svg, 'height'));
  const [xDomain, yDomain] = domains;
  const domainWidth = xDomain[1] - xDomain[0];
  const domainHeight = yDomain[1] - yDomain[0];

  const xRange: Pair<number> = [margins.left, width - margins.right];
  const yRange: Pair<number> = [margins.top, height - margins.bottom];

  const invertedYRange: Pair<number> = [height - margins.bottom, margins.top];
  const rangeWidth = xRange[1] - xRange[0];
  const rangeHeight = yRange[1] - yRange[0];
  const [initialX, initialY] = initialMu;
  const mappedInitialX = mapRange(xDomain, xRange, initialX);
  const mappedInitialY = mapRange(yDomain, invertedYRange, initialY);

  const mappedInitialStdDevX = mapRange([0, domainWidth], [0, rangeWidth], initialStdDev[0]);
  const mappedInitialStdDevY = mapRange([0, domainHeight], [0, rangeHeight], initialStdDev[1]);


  const internalUpdate = setUpBasicRemoteControlledDot(
    svg,
    [mappedInitialX, mappedInitialY],
    [mappedInitialStdDevX, mappedInitialStdDevY]
  );

  function update(newPos: Pair<number>, newStdDev: Pair<number>): void {
    const mappedNewX = mapRange(xDomain, xRange, newPos[0]);
    const mappedNewY = mapRange(yDomain, invertedYRange, newPos[1]);
    const mappedNewStdDevX = mapRange([0, domainWidth], [0, rangeWidth], newStdDev[0]);
    const mappedNewStdDevY = mapRange([0, domainHeight], [0, rangeHeight], newStdDev[1]);
    internalUpdate([mappedNewX, mappedNewY], [mappedNewStdDevX, mappedNewStdDevY]);
  }

  return update;
}
