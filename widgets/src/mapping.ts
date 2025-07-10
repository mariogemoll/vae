import type pica from 'pica';

import { getContext } from './canvas.js';
import { hueRange, sizeRange, zRange } from './constants.js';
import { renderSample } from './dataset.js';
import { drawImage } from './drawimage.js';
import { drawGrid } from './grid.js';
import { setUpRemoteControlledDot } from './rcdot.js';
import { addFrame, rectPath } from './svg.js';
import { setUp2dSelectorWithLabels } from './twodselector.js';
import type { Margins } from './types/margins.js';
import type { OrtFunction } from './types/ortfunction';
import type { Pair } from './types/pair';
import {
  addErrorMessage, addMarginToRange, el, getAttribute, loadImage, mapPair, mapRange, midRangeValue,
  writePixelValues
} from './util.js';

const extendedSizeRange: Pair<number> = addMarginToRange(sizeRange, 0.2);
const extendedHueRange: Pair<number> = addMarginToRange(hueRange, 0.2);

const stdDevMultiplier = 3.0; // Multiplier for standard deviation, can be adjusted

async function encodeImg(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'),
  encode: OrtFunction,
  canvas: HTMLCanvasElement,
  singleImgArr: Float32Array
): Promise<Pair<Pair<number>>> {
  writePixelValues(singleImgArr, 0, canvas);
  const tensor = new ort.Tensor('float32', singleImgArr, [1, 3, 32, 32]);
  const zResult = await encode(tensor);
  const muArray = zResult.mu.data;
  const mu0 = muArray[0] as number;
  const mu1 = muArray[1] as number;
  const logvarArray = zResult.logvar.data;
  const logvar0 = logvarArray[0] as number;
  const logvar1 = logvarArray[1] as number;
  return [[mu0, mu1], [logvar0, logvar1]];
}

function logVarToStdDev(logvar: number): number {
  const variance = Math.exp(logvar);
  const stdDev = Math.sqrt(variance);
  return stdDev;
}

function addTrainingSetRect(
  svg: SVGSVGElement,
  margins: Margins,
  valsetBounds: Pair<Pair<number>>
): void {

  const svgWidth = parseFloat(getAttribute(svg, 'width'));
  const svgHeight = parseFloat(getAttribute(svg, 'height'));
  const sizeScale = mapRange.bind(
    null, extendedSizeRange, [margins.left, svgWidth - margins.right]
  );
  const hueScale = mapRange.bind(
    null, extendedHueRange, [svgHeight - margins.bottom, margins.top]
  );

  const sizeRangeMapped = mapPair(sizeScale, sizeRange);
  const hueRangeMapped = mapPair(hueScale, hueRange);

  const valsetSizeRangeMapped = mapPair(sizeScale, valsetBounds[0]);
  const valsetHueRangeMapped = mapPair(hueScale, valsetBounds[1]);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const trainsetRectPath = rectPath(
    [sizeRangeMapped[0], hueRangeMapped[0]],
    [sizeRangeMapped[1], hueRangeMapped[1]]
  );
  const valsetRectPath = rectPath(
    [valsetSizeRangeMapped[0], valsetHueRangeMapped[0]],
    [valsetSizeRangeMapped[1], valsetHueRangeMapped[1]]
  );
  // Combine the two rectangles into a path with fill rule evenodd, this way the valset rectangle
  // will be cut out of the trainset rectangle
  path.setAttribute('d', [trainsetRectPath, valsetRectPath].join(' '));
  path.setAttribute('fill', '#eee');
  path.setAttribute('fill-rule', 'evenodd');
  svg.appendChild(path);
}

export async function setUpMapping(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ort: typeof import('onnxruntime-web'),
  encode: OrtFunction,
  decode: OrtFunction,
  picaInstance: pica.Pica,
  faceImgUrl: string,
  valsetBounds: Pair<Pair<number>>,
  alphaGrid: Pair<number>[][],
  zGrid: Pair<number>[][],
  box: HTMLDivElement
): Promise<void> {
  try {
    const alphaSvg = el(box, '.alpha-space') as SVGSVGElement;
    const sizeSpan = el(box, 'span.size') as HTMLSpanElement;
    const hueSpan = el(box, 'span.hue') as HTMLSpanElement;
    const xCanvas = el(box, '.pic-x') as HTMLCanvasElement;
    const zSvg = el(box, '.z-space') as SVGSVGElement;
    const z0MuCell = el(box, '.z0-mu span') as HTMLSpanElement;
    const z1MuCell = el(box, '.z1-mu span') as HTMLSpanElement;
    const z0StdDevCell = el(box, '.z0-std-dev') as HTMLSpanElement;
    const z1StdDevCell = el(box, '.z1-std-dev') as HTMLSpanElement;
    const reconCanvas = el(box, '.reconstruction') as HTMLCanvasElement;
    const reconCtx = getContext(reconCanvas);

    const margins = { top: 10, right: 40, bottom: 40, left: 40 };

    addTrainingSetRect(alphaSvg, margins, valsetBounds);

    drawGrid(alphaSvg, margins, [extendedSizeRange, extendedHueRange], 'grey', alphaGrid);

    drawGrid(zSvg, margins, [zRange, zRange], 'grey', zGrid);

    // TODO Calculate initial mu and stdDev values
    const updateZ = setUpRemoteControlledDot(
      zSvg,
      margins,
      [zRange, zRange],
      [0.0, 0.0],
      [1.0, 1.0]
    );

    const faceImg = await loadImage(faceImgUrl);
    async function update(size: number, hue: number): Promise<void> {
      await renderSample(picaInstance, hiresCanvas, xCanvas, faceImg, size, hue);
      const [mu, logvar] = await encodeImg(ort, encode, xCanvas, singleImgArr);
      const stdDev = mapPair(logVarToStdDev, logvar);
      z0MuCell.textContent = mu[0].toFixed(2);
      z1MuCell.textContent = mu[1].toFixed(2);
      z0StdDevCell.textContent = stdDev[0].toFixed(2);
      z1StdDevCell.textContent = stdDev[1].toFixed(2);
      updateZ(mu, mapPair((x) => x * stdDevMultiplier, stdDev));
      const zTensor = new ort.Tensor('float32', new Float32Array(mu), [
        1, mu.length
      ]);
      const reconResult = await decode(zTensor);
      drawImage(reconCtx, reconResult.reconstruction.data as Float32Array);
      working = false;
    }


    const hiresCanvas = document.createElement('canvas');
    hiresCanvas.width = 128;
    hiresCanvas.height = 128;

    const singleImgArr = new Float32Array(1 * 3 * 32 * 32); // 3 channels, 32x32 pixels
    let working = false;

    addFrame(alphaSvg, margins, extendedSizeRange, extendedHueRange, 8);

    addFrame(zSvg, margins, zRange, zRange, 5);

    setUp2dSelectorWithLabels(
      alphaSvg,
      margins,
      extendedSizeRange,
      extendedHueRange,
      sizeSpan,
      hueSpan,
      midRangeValue(extendedSizeRange),
      midRangeValue(extendedHueRange),
      (size: number, hue: number) => {
        if (working) {
          return; // Prevent multiple simultaneous renders
        }
        working = true;
        (async function(): Promise<void> {
          await update(size, hue);
          working = false;
        })().catch((error: unknown) => {
          console.error('Error updating sample:', error);
        });
      }
    );
  } catch (error: unknown) {
    console.error('Error setting up mapping widget:', error);
    let msg = 'Unknown error';
    if (error instanceof Error) {
      msg = error.message;
    }
    addErrorMessage(box, `Error setting up mapping widget: ${msg}`);
  }
}
