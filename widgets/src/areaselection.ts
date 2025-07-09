
import type { Render, RenderProps } from '@anywidget/types';

import { addFrame,addRect } from './svg.js';
import type { Pair } from './types/pair.js';
import { getAttribute, map01ToRange, mapRangeTo01 } from './util.js';

interface Margins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

type Cell = HTMLTableCellElement;
type UpdateHandler = (x: number, y: number, width: number, height: number) => void;

export function setUpPixelAreaSelection(
  svg: SVGSVGElement,
  margins: Margins,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {
  const svgWidth = parseFloat(getAttribute(svg, 'width'));
  const svgHeight = parseFloat(getAttribute(svg, 'height'));

  // Calculate available area bounds
  const minX = margins.left;
  const minY = margins.top;
  const maxX = svgWidth - margins.right;
  const maxY = svgHeight - margins.bottom;

  // State for the selection rectangle
  let currentX = Math.max(minX, Math.min(maxX - initialWidth, initialX));
  let currentY = Math.max(minY, Math.min(maxY - initialHeight, initialY));
  let currentWidth = Math.min(initialWidth, maxX - currentX);
  let currentHeight = Math.min(initialHeight, maxY - currentY);

  // Create selection rectangle
  const rect = addRect(svg, currentX, currentY, currentWidth, currentHeight);
  rect.setAttribute('fill', '#eee');
  rect.setAttribute('stroke', '#ccc');
  rect.setAttribute('stroke-width', '1');
  rect.style.cursor = 'move';

  // Create the resize handle (bottom-right corner)
  const handle = addRect(
    svg, currentX + currentWidth - 14, currentY + currentHeight - 14, 14, 14
  );
  handle.setAttribute('fill', '#ccc');
  handle.style.cursor = 'se-resize';

  // Dragging state
  let isDragging = false;
  let isResizing = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  // Update the visual elements
  function updateElements(): void {
    rect.setAttribute('x', currentX.toString());
    rect.setAttribute('y', currentY.toString());
    rect.setAttribute('width', currentWidth.toString());
    rect.setAttribute('height', currentHeight.toString());
    handle.setAttribute('x', (currentX + currentWidth - 14).toString());
    handle.setAttribute('y', (currentY + currentHeight - 14).toString());
  }

  // Constrain values to bounds
  function constrainToBounds(x: number, y: number, width: number, height: number): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const constrainedX = Math.max(minX, Math.min(maxX - width, x));
    const constrainedY = Math.max(minY, Math.min(maxY - height, y));
    const constrainedWidth = Math.min(width, maxX - constrainedX);
    const constrainedHeight = Math.min(height, maxY - constrainedY);
    return {
      x: constrainedX, y: constrainedY, width: constrainedWidth, height: constrainedHeight
    };
  }

  // Mouse down on rectangle (start dragging)
  rect.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = currentX;
    startY = currentY;
  });

  // Mouse down on resize handle (start resizing)
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startX = currentX;
    startY = currentY;
    startWidth = currentWidth;
    startHeight = currentHeight;
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      const newX = startX + deltaX;
      const newY = startY + deltaY;

      const constrained = constrainToBounds(newX, newY, currentWidth, currentHeight);
      currentX = constrained.x;
      currentY = constrained.y;
      currentWidth = constrained.width;
      currentHeight = constrained.height;

      updateElements();
      onChange(currentX, currentY, currentWidth, currentHeight);
    } else if (isResizing) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      // Calculate new dimensions with minimum constraints
      let newWidth = Math.max(10, startWidth + deltaX); // Minimum width of 10
      let newHeight = Math.max(10, startHeight + deltaY); // Minimum height of 10

      // Ensure the new dimensions don't exceed the bounds
      const maxAllowedWidth = maxX - currentX;
      const maxAllowedHeight = maxY - currentY;

      newWidth = Math.min(newWidth, maxAllowedWidth);
      newHeight = Math.min(newHeight, maxAllowedHeight);

      currentWidth = newWidth;
      currentHeight = newHeight;

      updateElements();
      onChange(currentX, currentY, currentWidth, currentHeight);
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging || isResizing) {
      onMouseUp(currentX, currentY, currentWidth, currentHeight);
    }
    isDragging = false;
    isResizing = false;
  });

  // Initial call to onChange with the constrained initial values
  onChange(currentX, currentY, currentWidth, currentHeight);

}

export function setUpAreaSelectionOnUnitArea(
  svg: SVGSVGElement,
  margins: Margins,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {
  const svgWidth = parseFloat(getAttribute(svg, 'width'));
  const svgHeight = parseFloat(getAttribute(svg, 'height'));
  const xRange: Pair<number> = [margins.left, svgWidth - margins.right];
  const yRange: Pair<number> = [margins.top, svgHeight - margins.bottom];
  const xMaxWidth = xRange[1] - xRange[0];
  const yMaxHeight = yRange[1] - yRange[0];
  function calVals(
    x: number, y: number, width: number, height: number
  ): [number, number, number, number] {
    const mappedX = mapRangeTo01(xRange, x);
    const mappedY = mapRangeTo01(yRange, y);
    const mappedWidth = width / xMaxWidth;
    const mappedHeight = height / yMaxHeight;
    return [mappedX, mappedY, mappedWidth, mappedHeight];
  }

  function internalOnChange(x: number, y: number, width: number, height: number): void {
    onChange(...calVals(x, y, width, height));
  }

  function internalOnMouseUp(x: number, y: number, width: number, height: number): void {
    onMouseUp(...calVals(x, y, width, height));
  }
  const mappedInitialX = map01ToRange(xRange, initialX);
  const mappedInitialY = map01ToRange(yRange, initialY);
  const mappedInitialWidth = initialWidth * xMaxWidth;
  const mappedInitialHeight = initialHeight * yMaxHeight;
  setUpPixelAreaSelection(
    svg, margins,
    mappedInitialX, mappedInitialY,
    mappedInitialWidth, mappedInitialHeight,
    internalOnChange, internalOnMouseUp
  );
}
export function setUpAreaSelectionOnUnitAreaFlipped(
  svg: SVGSVGElement,
  margins: Margins,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {

  function mapY(y: number, height: number): number {
    return 1 - (y + height);
  }

  function internalOnChange(x: number, y: number, width: number, height: number): void {
    onChange(x, mapY(y, height), width, height);
  }

  function internalOnMouseUp(x: number, y: number, width: number, height: number): void {
    onMouseUp(x, mapY(y, height), width, height);
  }

  setUpAreaSelectionOnUnitArea(
    svg, margins,
    initialX, 1 - (initialY + initialHeight),
    initialWidth, initialHeight,
    internalOnChange, internalOnMouseUp
  );
}

export function setUpAreaSelection(
  svg: SVGSVGElement,
  margins: Margins,
  xRange: Pair<number>,
  yRange: Pair<number>,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {

  const xMaxWidth = xRange[1] - xRange[0];
  const yMaxHeight = yRange[1] - yRange[0];
  function calVals(
    x: number, y: number, width: number, height: number
  ): [number, number, number, number] {
    const mappedX = map01ToRange(xRange, x);
    const mappedY = map01ToRange(yRange, y);
    const mappedWidth = width * xMaxWidth;
    const mappedHeight = height * yMaxHeight;
    return [mappedX, mappedY, mappedWidth, mappedHeight];
  }
  function internalOnChange(x: number, y: number, width: number, height: number): void {
    onChange(...calVals(x, y, width, height));

  }

  function internalOnMouseUp(x: number, y: number, width: number, height: number): void {
    onMouseUp(...calVals(x, y, width, height));
  }
  const mappedInitialX = mapRangeTo01(xRange, initialX);
  const mappedInitialY = mapRangeTo01(yRange, initialY);
  const mappedInitialWidth = initialWidth / xMaxWidth;
  const mappedInitialHeight = initialHeight / yMaxHeight;
  setUpAreaSelectionOnUnitAreaFlipped(
    svg, margins,
    mappedInitialX, mappedInitialY,
    mappedInitialWidth, mappedInitialHeight,
    internalOnChange, internalOnMouseUp
  );
}

function addFromToRow(
  table: HTMLTableElement, label: string
): [Cell, Cell] {
  const row = table.insertRow();
  row.insertCell().innerText = label + ':';
  const fromCell = row.insertCell();
  fromCell.style.textAlign = 'right';
  row.insertCell().innerHTML = '&ndash;';
  const toCell = row.insertCell();
  toCell.style.textAlign = 'right';
  return [fromCell, toCell];
}
function makeInfoBox(
  container: HTMLElement, xLabel: string, yLabel: string
): [HTMLDivElement, Cell, Cell, Cell, Cell, Cell] {
  const div = document.createElement('div');
  container.appendChild(div);

  const table = document.createElement('table');
  table.style.tableLayout = 'fixed';
  div.appendChild(table);

  const [xFromTd, xToTd] = addFromToRow(table, xLabel);
  const [yFromTd, yToTd] = addFromToRow(table, yLabel);

  xFromTd.style.width = '26px';
  xToTd.style.width = '26px';

  const areaRow = table.insertRow();
  areaRow.insertCell().innerText = 'Area:';
  const areaTd = areaRow.insertCell();
  areaTd.style.textAlign = 'right';
  areaTd.colSpan = 3;

  return [div, xFromTd, xToTd, yFromTd, yToTd, areaTd];
}

interface AreaSelectionModel {
    x: number;
    y: number;
    width: number;
    height: number;
    xRange: [number, number];
    yRange: [number, number];
    xLabel: string;
    yLabel: string;
}

const render: Render<AreaSelectionModel> = (props: RenderProps<AreaSelectionModel>) => {
  function onMouseUp(x: number, y: number, width: number, height: number): void {
    props.model.set('x', x);
    props.model.set('y', y);
    props.model.set('width', width);
    props.model.set('height', height);
    props.model.save_changes();
  }
  const xRange: Pair<number> = props.model.get('xRange');
  const yRange: Pair<number> = props.model.get('yRange');
  const fullArea = (xRange[1] - xRange[0]) * (yRange[1] - yRange[0]);
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  props.el.appendChild(container);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '280');
  svg.setAttribute('height', '250');
  const margins: Margins = { top: 10, right: 40, bottom: 40, left: 40 };
  addFrame(svg, margins, xRange, yRange, 6);
  container.appendChild(svg);

  const initialX = props.model.get('x');
  const initialY = props.model.get('y');
  const initialWidth = props.model.get('width');
  const initialHeight = props.model.get('height');

  const [infoBox, xFromTd, xToTd, yFromTd, yToTd, areaTd] = makeInfoBox(
    container, props.model.get('xLabel'), props.model.get('yLabel')
  );
  infoBox.style.marginTop = '40px';

  // Set initial values
  xFromTd.innerText = initialX.toFixed(2);
  xToTd.innerText = (initialX + initialWidth).toFixed(2);
  yFromTd.innerText = initialY.toFixed(2);
  yToTd.innerText = (initialY + initialHeight).toFixed(2);
  areaTd.innerText = (((initialWidth * initialHeight) / fullArea) * 100).toFixed(2) + '%';

  function onChange(x: number, y: number, width: number, height: number): void {
    xFromTd.innerText = x.toFixed(2);
    xToTd.innerText = (x + width).toFixed(2);
    yFromTd.innerText = y.toFixed(2);
    yToTd.innerText = (y + height).toFixed(2);
    areaTd.innerText = (((width * height) / fullArea) * 100).toFixed(2) + '%';
  }

  setUpAreaSelection(
    svg,
    margins,
    xRange,
    yRange,
    initialX,
    initialY,
    initialWidth,
    initialHeight,
    onChange,
    onMouseUp
  );
};

export default { render };
