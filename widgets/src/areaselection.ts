import type { RenderProps, Render } from '@anywidget/types';

type Cell = HTMLTableCellElement;
type UpdateHandler = (x: number, y: number, width: number, height: number) => void;

function getAttribute(element: Element, attribute: string): string {
  const value = element.getAttribute(attribute);
  if (value === null) {
    throw new Error(`Attribute "${attribute}" not found on element.`);
  }
  return value;
}

function setUpUnitAreaSelection(
  container: HTMLElement,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {
  const svgSize = 200;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', svgSize.toString());
  svg.setAttribute('height', svgSize.toString());
  svg.style.border = '1px solid black';
  svg.style.cursor = 'default';

  // Create selection rectangle
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('fill', '#eee');
  rect.setAttribute('stroke', '#ccc');
  rect.setAttribute('stroke-width', '1');
  rect.style.cursor = 'move';

  // Create resize handle
  const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  handle.setAttribute('width', '14');
  handle.setAttribute('height', '14');
  handle.setAttribute('fill', '#ccc');
  handle.style.cursor = 'se-resize';

  svg.appendChild(rect);
  svg.appendChild(handle);
  container.appendChild(svg);

  let isDragging = false;
  let isResizing = false;
  const dragOffset = { x: 0, y: 0 };

  function calculateValues(): [number, number, number, number] {
    const x = parseFloat(getAttribute(rect, 'x')) / svgSize;
    const y = parseFloat(getAttribute(rect, 'y')) / svgSize;
    const width = parseFloat(getAttribute(rect, 'width')) / svgSize;
    const height = parseFloat(getAttribute(rect, 'height')) / svgSize;
    return [x, y, width, height];
  }

  // Event handlers
  rect.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rectBounds = rect.getBoundingClientRect();
    dragOffset.x = e.clientX - rectBounds.left;
    dragOffset.y = e.clientY - rectBounds.top;
    e.preventDefault();
  });

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.stopPropagation();
    e.preventDefault();
  });

  svg.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const svgBounds = svg.getBoundingClientRect();
      const newX = Math.max(0, Math.min(svgSize - parseFloat(getAttribute(rect, 'width')),
        e.clientX - svgBounds.left - dragOffset.x));
      const newY = Math.max(0, Math.min(svgSize - parseFloat(getAttribute(rect, 'height')),
        e.clientY - svgBounds.top - dragOffset.y));

      rect.setAttribute('x', newX.toString());
      rect.setAttribute('y', newY.toString());

      // Update handle position
      handle.setAttribute('x', (newX + parseFloat(getAttribute(rect, 'width')) - 14).toString());
      handle.setAttribute('y', (newY + parseFloat(getAttribute(rect, 'height')) - 14).toString());

      onChange(...calculateValues());
    } else if (isResizing) {
      const svgBounds = svg.getBoundingClientRect();
      const rectX = parseFloat(getAttribute(rect, 'x'));
      const rectY = parseFloat(getAttribute(rect, 'y'));
      const newWidth = Math.max(20, Math.min(svgSize - rectX, e.clientX - svgBounds.left - rectX));
      const newHeight = Math.max(20, Math.min(svgSize - rectY, e.clientY - svgBounds.top - rectY));

      rect.setAttribute('width', newWidth.toString());
      rect.setAttribute('height', newHeight.toString());

      handle.setAttribute('x', (rectX + newWidth - 14).toString());
      handle.setAttribute('y', (rectY + newHeight - 14).toString());

      onChange(...calculateValues());
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging || isResizing) {
      isDragging = false;
      isResizing = false;
      onMouseUp(...calculateValues());
    }
  });

  const x = initialX * svgSize;
  const y = initialY * svgSize;
  const width = initialWidth * svgSize;
  const height = initialHeight * svgSize;

  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', width.toString());
  rect.setAttribute('height', height.toString());

  handle.setAttribute('x', (x + width - 14).toString());
  handle.setAttribute('y', (y + height - 14).toString());
}

function setUpBottomLeftOrientedUnitAreaSelection(
  container: HTMLElement,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {
  const adjustedInitialY = 1 - (initialY + initialHeight);

  function onChangeWrapper(x: number, y: number, width: number, height: number): void {
    const adjustedY = 1 - (y + height);
    onChange(x, adjustedY, width, height);
  };

  function onMouseUpWrapper(x: number, y: number, width: number , height: number): void {
    const adjustedY = 1 - (y + height);
    onMouseUp(x, adjustedY, width, height);
  }

  setUpUnitAreaSelection(
    container,
    initialX,
    adjustedInitialY,
    initialWidth,
    initialHeight,
    onChangeWrapper,
    onMouseUpWrapper
  );
}

// function that maps from [0, 1] to range [a, b]
function mapFrom01ToRange(range: [number, number], value: number): number {
  if (value< 0) {
    throw new Error(`Value ${value.toFixed(3)} is less than 0`);
  }
  if (value > 1) {
    throw new Error(`Value ${value.toFixed(3)} is greater than 1`);
  }
  const [min, max] = range;
  return min + value * (max - min);
}

// function that maps from range [a, b] to [0, 1]
function mapFromRangeTo01(range: [number, number], value: number): number {
  return (value - range[0]) / (range[1] - range[0]);
}

function mapLengthFromRangeTo01(range: [number, number], length: number): number {
  const rangeSize = range[1] - range[0];
  return length / rangeSize;
}

function mapLengthFrom01ToRange(range: [number, number], length: number): number {
  const rangeSize = range[1] - range[0];
  return length * rangeSize;
}

function mapValues(
  xRange: [number, number],
  yRange: [number, number],
  x01: number,
  y01: number,
  width01: number,
  height01: number
): [number, number, number, number] {
  const x = mapFrom01ToRange(xRange, x01);
  const y = mapFrom01ToRange(yRange, y01);
  const width = mapLengthFrom01ToRange(xRange, width01);
  const height = mapLengthFrom01ToRange(yRange, height01);
  return [x, y, width, height];
}

function setUpAreaSelectionWithRanges(
  container: HTMLElement,
  xRange: [number, number],
  yRange: [number, number],
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onChange: UpdateHandler,
  onMouseUp: UpdateHandler
): void {
  function onChangeWrapper(x: number, y: number, width: number, height: number): void {
    onChange(...mapValues(xRange, yRange, x, y, width, height));
  };

  function onMouseUpWrapper(x: number, y: number, width: number, height: number): void {
    onMouseUp(...mapValues(xRange, yRange, x, y, width, height));
  }

  setUpBottomLeftOrientedUnitAreaSelection(
    container,
    mapFromRangeTo01(xRange, initialX),
    mapFromRangeTo01(yRange, initialY),
    mapLengthFromRangeTo01(xRange, initialWidth),
    mapLengthFromRangeTo01(yRange, initialHeight),
    onChangeWrapper,
    onMouseUpWrapper
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

function setUpAreaSelection(
  el: HTMLElement,
  xRange: [number, number],
  yRange: [number, number],
  xLabel: string,
  yLabel: string,
  initialX: number,
  initialY: number,
  initialWidth: number,
  initialHeight: number,
  onMouseUp: UpdateHandler
): void {
  const fullArea = (xRange[1] - xRange[0]) * (yRange[1] - yRange[0]);

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  el.appendChild(container);

  const [infoBox, xFromTd, xToTd, yFromTd, yToTd, areaTd] = makeInfoBox(container, xLabel, yLabel);
  infoBox.style.marginLeft = '4px';

  // Set initial values
  xFromTd.innerText = initialX.toFixed(2);
  xToTd.innerText = (initialX + initialWidth).toFixed(2);
  yFromTd.innerText = initialY.toFixed(2);
  yToTd.innerText = (initialY + initialHeight).toFixed(2);
  areaTd.innerText = (((initialWidth * initialHeight) / fullArea) * 100).toFixed(2) + '%';

  function wrappedOnChange(x: number, y: number, width: number, height: number): void {
    xFromTd.innerText = x.toFixed(2);
    xToTd.innerText = (x + width).toFixed(2);
    yFromTd.innerText = y.toFixed(2);
    yToTd.innerText = (y + height).toFixed(2);
    areaTd.innerText = (((width * height) / fullArea) * 100).toFixed(2) + '%';
  }

  setUpAreaSelectionWithRanges(
    container,
    xRange,
    yRange,
    initialX,
    initialY,
    initialWidth,
    initialHeight,
    wrappedOnChange,
    onMouseUp
  );
  container.appendChild(infoBox);
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
  setUpAreaSelection(
    props.el,
    props.model.get('xRange'),
    props.model.get('yRange'),
    props.model.get('xLabel'),
    props.model.get('yLabel'),
    props.model.get('x'),
    props.model.get('y'),
    props.model.get('width'),
    props.model.get('height'),
    onMouseUp
  );
};

export default { render };
