import { addDot } from './svg';
import type { Pair } from './types/pair';
import { mapRangeTo01, mapPair } from './util';

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

function stdDevToRadius(stdDev: number, size: number): number {
  // Convert standard deviation to radius in SVG coordinates
  return stdDev * size;
}

function updatePos(elem: SVGCircleElement | SVGEllipseElement, pos: Pair<number>): void {
  elem.setAttribute('cx', pos[0].toString());
  elem.setAttribute('cy', pos[1].toString());
}

function updateRadii(ellipse: SVGEllipseElement, radii: Pair<number>): void {
  ellipse.setAttribute('rx', radii[0].toString());
  ellipse.setAttribute('ry', radii[1].toString());
}

export function unitAreaRcDot(
  svg: SVGSVGElement, initialMu: Pair<number>, initialStdDev: Pair<number>
): (mu: Pair<number>, stdDev: Pair<number>) => void {
  const [initialX, initialY] = initialMu;
  const size = svg.viewBox.baseVal.width;
  const initialCX = initialX * size; // Map initialX from [0,1] to [0,size]
  const initialCY = (1 - initialY) * size; // Map initialY from [0,1] to [size,0] (inverted)

  const radii = mapPair(v => stdDevToRadius(v, size), initialStdDev);
  const varianceEllipse = addEllipse(svg, initialMu, radii);
  const dot = addDot(svg, initialCX, initialCY, 2);

  function update(mu: Pair<number>, stdDev: Pair<number>): void {
    const [x, y] = mu;

    // x and y are in [0,1] range
    // Clamp values to [0,1] range
    const normalizedX = Math.max(0, Math.min(1, x));
    const normalizedY = Math.max(0, Math.min(1, y));

    // Map to SVG coordinates
    // For y, invert the value since SVG coordinates have 0 at the top
    const cx = normalizedX * size;
    const cy = (1 - normalizedY) * size; // Invert y so 0 is bottom, 1 is top
    updatePos(dot, [cx, cy]);
    updatePos(varianceEllipse, [cx, cy]);

    // Update variance circle
    const newRadii = mapPair(v => stdDevToRadius(v, size), stdDev);
    updateRadii(varianceEllipse, newRadii);
  }
  return update;
}

const map2dTo01 = (ranges: Pair<Pair<number>>, vals: Pair<number>): Pair<number> => {
  return [
    mapRangeTo01(ranges[0], vals[0]),
    mapRangeTo01(ranges[1], vals[1])
  ];
};

function scaleStdDevTo01(ranges: Pair<number>, stdDev: number): number {
  const rangeSize = ranges[1] - ranges[0];
  return stdDev / rangeSize; // Scale standard deviation to [0, 1]
}

const scaleStdDevsTo01 = (ranges: Pair<Pair<number>>, stdDevs: Pair<number>): Pair<number> => {
  return [
    scaleStdDevTo01(ranges[0], stdDevs[0]),
    scaleStdDevTo01(ranges[1], stdDevs[1])
  ];
};

export function setUpRemoteControlledDot(
  svg: SVGSVGElement,
  ranges: Pair<Pair<number>>,
  initialMu: Pair<number>,
  initialStdDev: Pair<number>
): (mu: Pair<number>, variance: Pair<number>) => void {
  const mappedInitialMu = map2dTo01(ranges, initialMu);
  const scaledInitialStdDev = scaleStdDevsTo01(ranges, initialStdDev);
  const updateInternal = unitAreaRcDot(svg, mappedInitialMu, scaledInitialStdDev);
  function update(mu: Pair<number>, variance: Pair<number>): void {
    const mappedMu = map2dTo01(ranges, mu);
    const scaledStdDev = scaleStdDevsTo01(ranges, mapPair(Math.sqrt, variance));
    updateInternal(mappedMu, scaledStdDev);
  }
  return update;
}

export function setUpRemoteControlledDotWithLabels(
  svg: SVGSVGElement,
  muLabels: Pair<HTMLElement>,
  stdDevLabels: Pair<HTMLElement>,
  ranges: Pair<Pair<number>>,
  initialMu: Pair<number>,
  initialStdDev: Pair<number>
): (mu: Pair<number>, variance: Pair<number>) => void {
  const updateInternal = setUpRemoteControlledDot(svg, ranges, initialMu, initialStdDev);
  function update(mu: Pair<number>, stdDev: Pair<number>): void {
    updateInternal(mu, stdDev);
    muLabels[0].textContent = mu[0].toFixed(2);
    muLabels[1].textContent = mu[1].toFixed(2);
    stdDevLabels[0].textContent = stdDev[0].toFixed(2);
    stdDevLabels[1].textContent = stdDev[1].toFixed(2);
  }
  return update;
}
