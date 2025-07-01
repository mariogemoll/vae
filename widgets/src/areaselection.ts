import type { RenderProps, Render } from '@anywidget/types';

interface AreaSelectionModel {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const render: Render<AreaSelectionModel> = (props: RenderProps<AreaSelectionModel>) => {

  // Add canvas
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  canvas.style.border = '1px solid black';
  props.el.appendChild(canvas);

  const info = document.createElement('p');
  props.el.appendChild(info);

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
    ctx.strokeStyle = 'blue';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    // Resizer handle
    ctx.fillStyle = 'blue';
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
    const xStr = r.x.toFixed(2);
    const yStr = r.y.toFixed(2);
    const widthStr = r.width.toFixed(2);
    const heightStr = r.height.toFixed(2);
    info.textContent = `x=${xStr}, y=${yStr}, w=${widthStr}, h=${heightStr}`;
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
