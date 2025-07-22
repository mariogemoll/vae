import { addAxes, addVerticalLine, getContext } from './canvas.js';
import { addCanvas } from './dom.js';
import type { Margins } from './types/margins.js';
import type { Scale } from './types/scale.js';
import { makeScale } from './util.js';

function drawLine(
  ctx: CanvasRenderingContext2D, xScale: Scale, yScale: Scale, data: number[]
): void {
  ctx.beginPath();
  ctx.moveTo(xScale(1), yScale(data[0]));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(xScale(i + 1), yScale(data[i]));
  }
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawChart(
  ctx: CanvasRenderingContext2D, margins: Margins, xScale: Scale, yScale: Scale, data: number[][]
): void {
  addAxes(ctx, xScale, yScale, 11);
  for (const lineData of data) {
    drawLine(ctx, xScale, yScale, lineData);
  }
}

function getSliceIndex(
  canvas: HTMLCanvasElement, margins: Margins, numSlices: number, e: MouseEvent
): number | null {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (mouseX < margins.left || mouseX > canvas.width - margins.right ||
    mouseY < margins.top || mouseY > canvas.height - margins.bottom) {
    return null;
  } else {
    const sliceWidth = (canvas.width - margins.left - margins.right) / numSlices;

    // Anomaly since the first value is at 1, not 0
    if (mouseX < margins.left + sliceWidth * 1.5) {
      return 0;
    } else if (mouseX > canvas.width - margins.right - sliceWidth * 0.5) {
      return numSlices - 1;
    } else {
      return Math.floor((mouseX - margins.left - sliceWidth * 1.5) / sliceWidth) + 1;
    }
  }
}

export function setUpLossChart(
  container: HTMLElement,
  minVal: number,
  maxVal: number,
  data: number[][],
  callback: (index: number) => void
): void {
  const canvas = addCanvas(container, { width: '400', height: '300' });
  const ctx = getContext(canvas);
  let status: 'playing' | 'dragging' | 'stopped' = 'playing';
  let selectedIndex = 0;
  let interval: ReturnType<typeof setInterval> | null = null;

  const margins = { top: 20, right: 20, bottom: 20, left: 40 };

  const numEntries = data[0].length;
  const xScale = makeScale([0, numEntries], [margins.left, canvas.width - margins.right]);

  const minMaxDiff = maxVal - minVal;
  const margin = minMaxDiff * 0.05;
  const yScale = makeScale(
    [minVal - margin, maxVal + margin], [canvas.height - margins.bottom, margins.top]
  );

  container.appendChild(document.createElement('br'));

  const btn = document.createElement('button');
  btn.innerText = '▶';
  container.appendChild(btn);

  function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawChart(ctx, margins, xScale, yScale, data);
    addVerticalLine(
      ctx, 'black', xScale(selectedIndex + 1), [margins.top, canvas.height - margins.bottom]
    );
    callback(selectedIndex);
  }

  canvas.addEventListener('mousedown', e => {
    const newIndex = getSliceIndex(canvas, margins, numEntries, e);
    if (newIndex === null) {
      return;
    }
    stopAnimation();
    status = 'dragging';
    if (newIndex === selectedIndex) {
      return;
    }
    selectedIndex = newIndex;
    draw();
  });

  canvas.addEventListener('mousemove', e => {
    if (status !== 'dragging') {
      return;
    }
    const newIndex = getSliceIndex(canvas, margins, numEntries, e);
    if (newIndex === null || newIndex === selectedIndex) {
      return;
    }
    selectedIndex = newIndex;
    draw();
  });

  canvas.addEventListener('mouseup', () => {
    status = 'stopped';
  });

  canvas.addEventListener('mouseleave', () => {
    if (status === 'dragging') {
      status = 'stopped';
    }
  });

  function startAnimation(): void {
    status = 'playing';
    btn.textContent = '⏸';
    interval = setInterval(() => {
      if (status !== 'playing') {
        if (interval !== null) {
          clearInterval(interval);
          interval = null;
        }
        return;
      }
      selectedIndex = (selectedIndex + 1) % numEntries;
      draw();
    }, 200);


  }

  function stopAnimation(): void {
    status = 'stopped';
    btn.textContent = '▶';
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function toggleAnimation(): void {
    if (status === 'playing') {
      stopAnimation();
    } else {
      startAnimation();

    }
  }

  btn.addEventListener('click', toggleAnimation);

  draw();
  startAnimation();
}
