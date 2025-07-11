import { addCanvas, addSpan } from './dom.js';
import { addSvg } from './svg.js';
import type { Pair } from './types/pair.js';

export function addImgCanvas(parent: HTMLElement, left: number): HTMLCanvasElement {
  return addCanvas(parent, {
    width: '32',
    height: '32'
  }, {
    position: 'absolute',
    left: `${left.toString()}px`,
    top: '78px',
    width: '64px',
    height: '64px',
    border: '1px solid black',
    imageRendering: 'pixelated'
  });
}

function addLabeledTextField(
  parent: HTMLElement, top: number, left: number, label: string
): HTMLSpanElement {
  addSpan(parent, {}, {
    position: 'absolute',
    left: `${left.toString()}px`,
    top: `${top.toString()}px`
  }).textContent = label;

  return addSpan(parent, {}, {
    position: 'absolute',
    left: `${(left + 50).toString()}px`,
    top: `${top.toString()}px`,
    textAlign: 'right'
  });
}

export function addTwoLabeledTextFields(
  parent: HTMLElement, labelA: string, labelB: string
): Pair<HTMLSpanElement> {
  return [
    addLabeledTextField(parent, 240, 38, labelA),
    addLabeledTextField(parent, 240, 140, labelB)
  ];
}

export function addSpaceSvg(parent: HTMLElement, left: number): SVGSVGElement {
  return addSvg(parent, {
    width: '280',
    height: '250',
    viewBox: '0 0 280 250'
  }, {
    position: 'absolute',
    left: `${left.toString()}px`
  });
}
