import * as ort from 'onnxruntime-web';
import type pica from 'pica';

import { sizeRange, hueRange, zRange } from './constants';
import { renderSample } from './dataset';
import { drawImage } from './drawimage';
import { drawGrid } from './grid';
import { setUpRemoteControlledDotWithLabels } from './rcdot';
import { setUp2dSelectorWithLabels } from './twodselector';
import type { OrtFunction } from './types/ortfunction';
import { type Pair } from './types/pair';
import { addMarginToRange, loadImage, el, writePixelValues, mapPair } from './util';

const extendedSizeRange: Pair<number> = addMarginToRange(sizeRange, 0.2);
const extendedHueRange: Pair<number> = addMarginToRange(hueRange, 0.2);

async function encodeImg(
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

export async function setUpMapping(
  encode: OrtFunction,
  decode: OrtFunction,
  picaInstance: pica.Pica,
  faceImgUrl: string,
  alphaGrid: Pair<number>[][],
  zGrid: Pair<number>[][],
  box: HTMLDivElement
): Promise<void> {
  const alphaSvg = el(box, '.alpha-space') as SVGSVGElement;
  const sizeSpan = el(box, '.size span') as HTMLSpanElement;
  const hueSpan = el(box, '.hue span') as HTMLSpanElement;
  const xCanvas = el(box, '.pic-x') as HTMLCanvasElement;
  const zSvg = el(box, '.z-space') as SVGSVGElement;
  const z0MuCell = el(box, '.z0-mu span') as HTMLSpanElement;
  const z1MuCell = el(box, '.z1-mu span') as HTMLSpanElement;
  const z0StdDevCell = el(box, '.z0-std-dev') as HTMLSpanElement;
  const z1StdDevCell = el(box, '.z1-std-dev') as HTMLSpanElement;
  const reconCanvas = el(box, '.reconstruction') as HTMLCanvasElement;
  const reconCtx = reconCanvas.getContext('2d');

  const faceImg = await loadImage(faceImgUrl);

  if (!reconCtx) {
    throw new Error('Failed to get 2D context for reconstruction canvas');
  }

  drawGrid(alphaSvg, [extendedSizeRange, extendedHueRange], 'grey', alphaGrid);

  drawGrid(zSvg, [zRange, zRange], 'grey', zGrid);

  // TODO Calculate initial mu and stdDev values

  const updateZ = setUpRemoteControlledDotWithLabels(
    zSvg, [z0MuCell, z1MuCell], [z0StdDevCell, z1StdDevCell], [zRange, zRange], [.5, .5], [1.0, 1.0]
  );

  const hiresCanvas = document.createElement('canvas');
  hiresCanvas.width = 128;
  hiresCanvas.height = 128;

  const singleImgArr = new Float32Array(1 * 3 * 32 * 32); // 3 channels, 32x32 pixels
  let working = false;
  setUp2dSelectorWithLabels(
    alphaSvg,
    sizeSpan,
    hueSpan,
    extendedSizeRange,
    extendedHueRange,
    (size, hue) => {
      if (working) {
        return; // Prevent multiple simultaneous renders
      }
      working = true;
      (async(): Promise<void> => {
        await renderSample(picaInstance, hiresCanvas, xCanvas, faceImg, size, hue);
        const [mu, logvar] = await encodeImg(encode, xCanvas, singleImgArr);
        updateZ(mu, mapPair(logVarToStdDev, logvar));
        const zTensor = new ort.Tensor('float32', new Float32Array(mu), [
          1, mu.length
        ]);
        const reconResult = await decode(zTensor);
        drawImage(reconCtx, reconResult.reconstruction.data as Float32Array);
        working = false;
      })().catch((error: unknown) => {
        console.error('Error rendering sample:', error);
      });
    }
  );
}
