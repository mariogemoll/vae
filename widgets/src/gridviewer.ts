import type { Render, RenderProps } from '@anywidget/types';

import { addSpaceSvg } from './commonelements';
import { addDiv } from './dom.js';
import { drawGrid } from './grid';
import { addFrame } from './svg';
import type { Margins } from './types/margins';
import type { Pair } from './types/pair';

interface GridViewerModel {
  grid: Pair<number>[][];
  xRange: Pair<number>;
  yRange: Pair<number>;
}

const render: Render<GridViewerModel> = ({ model, el }: RenderProps<GridViewerModel>) => {
  const container = addDiv(el, {}, { position: 'relative', width: '280px', height: '280px' });
  const svg = addSpaceSvg(container, 0);

  const margins: Margins = { top: 10, right: 40, bottom: 40, left: 40 };
  const xRange: Pair<number> = model.get('xRange');
  const yRange: Pair<number> = model.get('yRange');
  drawGrid(svg, margins, [xRange, yRange], 'black', model.get('grid'));
  addFrame(svg, margins, xRange, yRange, 6);

};

export default { render };
