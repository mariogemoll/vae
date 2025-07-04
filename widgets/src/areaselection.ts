import type { RenderProps, Render } from '@anywidget/types';

type Cell = HTMLTableCellElement;

// function that maps from [0, 1] to range [a, b]
export function map01ToRange(range: [number, number], value: number): number {
  if (value< 0) {
    throw new Error(`Value ${value.toFixed(3)} is less than 0`);
  }
  if (value > 1) {
    throw new Error(`Value ${value.toFixed(3)} is greater than 1`);
  }
  const [min, max] = range;
  const rangeSize = max - min;
  const amount = value * rangeSize;
  const result = min + amount;
  return result;
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

function addInfo(container: HTMLElement): [Cell, Cell, Cell, Cell, Cell] {
  const div = document.createElement('div');
  container.appendChild(div);

  const table = document.createElement('table');
  table.style.tableLayout = 'fixed';
  div.appendChild(table);

  const [sizeFromTd, sizeToTd] = addFromToRow(table, 'Size');
  const [hueFromTd, hueToTd] = addFromToRow(table, 'Hue');

  sizeFromTd.style.width = '26px';
  sizeToTd.style.width = '26px';

  const areaRow = table.insertRow();
  areaRow.insertCell().innerText = 'Area:';
  const areaTd = areaRow.insertCell();
  areaTd.style.textAlign = 'right';
  areaTd.colSpan = 3;

  return [sizeFromTd, sizeToTd, hueFromTd, hueToTd, areaTd];
}

const render: Render<AreaSelectionModel> = (props: RenderProps<AreaSelectionModel>) => {

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  props.el.appendChild(container);

  // Add canvas
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.border = '1px solid black';
  container.appendChild(canvas);

  const [sizeFromTd, sizeToTd, hueFromTd, hueToTd, areaTd] = addInfo(container);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const initialModelX = props.model.get('x');
  const initialModelY = props.model.get('y');
  const initialModelWidth = props.model.get('width');
  const initialModelHeight = props.model.get('height');

  const rect = {
    x: initialModelX * canvas.width,
    y: (1 - (initialModelY + initialModelHeight)) * canvas.height,
    w: initialModelWidth * canvas.width,
    h: initialModelHeight * canvas.height
  };
  let isDragging = false;
  let isResizing = false;
  let offsetX: number, offsetY: number;
  const handleSize = 14;

  // Redraw everything
  function draw(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Main rectangle
    ctx.fillStyle = '#eee';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    // Resizer handle
    ctx.fillStyle = '#ccc';
    ctx.fillRect(
      rect.x + rect.w - handleSize, rect.y + rect.h - handleSize, handleSize, handleSize);
  }

  // Check inside rect
  function inRect(x: number, y: number): boolean{
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  // Check inside resize handle
  function inHandle(x: number, y: number): boolean {
    return x >= rect.x + rect.w - handleSize && x <= rect.x + rect.w &&
            y >= rect.y + rect.h - handleSize && y <= rect.y + rect.h;
  }

  function handleChange(): void {
    const r = {
      x: rect.x / canvas.width,
      y: 1 - (rect.y + rect.h) / canvas.height,
      width: rect.w / canvas.width,
      height: rect.h / canvas.height
    };
    const xRange = props.model.get('xRange');
    const yRange = props.model.get('yRange');
    const areaPercent = Math.round(r.width * r.height * 100);
    sizeFromTd.innerText = map01ToRange(xRange, r.x).toFixed(2);
    sizeToTd.innerText = map01ToRange(xRange, r.x + r.width).toFixed(2);
    hueFromTd.innerText = map01ToRange(yRange, r.y).toFixed(2);
    hueToTd.innerText = map01ToRange(yRange, r.y + r.height).toFixed(2);
    areaTd.innerText = `${areaPercent.toString()}%`;
  }

  canvas.addEventListener('mousedown', e => {
    const rectCanvas = canvas.getBoundingClientRect();
    const x = e.clientX - rectCanvas.left;
    const y = e.clientY - rectCanvas.top;

    if (inHandle(x, y)) {
      isResizing = true;
    } else if (inRect(x, y)) {
      isDragging = true;
      offsetX = x - rect.x;
      offsetY = y - rect.y;
    }
  });

  canvas.addEventListener('mousemove', e => {
    const rectCanvas = canvas.getBoundingClientRect();
    const x = e.clientX - rectCanvas.left;
    const y = e.clientY - rectCanvas.top;

    if (isDragging) {
      rect.x = x - offsetX;
      rect.y = y - offsetY;
      constrainToCanvas();
      draw(ctx);
      handleChange();
    } else if (isResizing) {
      rect.w = Math.max(20, x - rect.x);
      rect.h = Math.max(20, y - rect.y);
      constrainToCanvas();
      draw(ctx);
      handleChange();
    } else {
      canvas.style.cursor = inHandle(x, y) ? 'se-resize' : inRect(x, y) ? 'move' : 'default';
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    const x = rect.x / canvas.width;
    const bottomY = 1 - (rect.y + rect.h) / canvas.height;
    const width = rect.w / canvas.width;
    const height = rect.h / canvas.height;
    props.model.set('x', x);
    props.model.set('y', bottomY);
    props.model.set('width', width);
    props.model.set('height', height);
    props.model.save_changes();
  });

  function constrainToCanvas(): void {
    rect.x = Math.max(0, Math.min(canvas.width - rect.w, rect.x));
    rect.y = Math.max(0, Math.min(canvas.height - rect.h, rect.y));
    rect.w = Math.min(canvas.width - rect.x, rect.w);
    rect.h = Math.min(canvas.height - rect.y, rect.h);
  }

  draw(ctx);
  handleChange(); // initial

};

export default { render };
