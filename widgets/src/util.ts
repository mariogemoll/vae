import { getContext } from './canvas.js';
import type Pair from './types/pair';
import type Scale from './types/scale';

export function el(parent: Document | Element, query: string): Element {
  const element = parent.querySelector(query);
  if (!element) {
    throw new Error(`Element for query ${query} not found`);
  }
  return element;
}

// function that maps from [0, 1] to range [a, b]
export function map01ToRange(range: Pair<number>, value: number): number {
  const [min, max] = range;
  return min + value * (max - min);
}

// function that maps a value from range a to range b
export function mapRange(fromRange: Pair<number>, toRange: Pair<number>, value: number): number {
  const [fromMin, fromMax] = fromRange;
  const [toMin, toMax] = toRange;
  return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

export function mapRangeTo01(range: Pair<number>, value: number): number {
  const mapped = mapRange(range, [0, 1], value);
  return Math.max(0, Math.min(1, mapped)); // Clamp to [0, 1]
}

export function midRangeValue(range: Pair<number>): number {
  const [min, max] = range;
  return (min + max) / 2;
}

export function makeScale(domain: Pair<number>, range: Pair<number>): Scale {
  const fnc = mapRange.bind(null, domain, range) as Scale;
  fnc.domain = domain;
  fnc.range = range;
  return fnc;
}

// Function to add a percentual margin to range [a, b]
export function addMarginToRange(range: Pair<number>, marginFraction: number): [number, number] {
  const [min, max] = range;
  const rangeSize = max - min;
  const margin = rangeSize * marginFraction;
  return [min - margin, max + margin];
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = (): void => { resolve(img); };
    img.onerror = (error): void => {
      const errorMessage = error instanceof Error
        ? error.message
        : error instanceof Event
          ? 'Image load failed'
          : 'Unknown error';
      reject(new Error(`Failed to load image from ${src}: ${errorMessage}`));
    };
    img.src = src;
  });
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number, k = (n + h * 6) % 6): number =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)];
}

export function mapPair<T, U>(fn: (value: T) => U, pair: Pair<T>): Pair<U> {
  return [fn(pair[0]), fn(pair[1])];
}

export function writePixelValues(
  fullArray: Float32Array, sampleIndex: number, canvas: HTMLCanvasElement
): void {
  const ctx = getContext(canvas);
  // Extract image data (after Pica resize)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // RGBA flat array

  // Initialize channel-first tensor (3x32x32)
  const C = 3, H = 32, W = 32;
  const baseOffset = sampleIndex * C * W * H;

  // Fill the tensor: channel-first [c][h][w]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x);
      const idx = i * 4;
      const r = data[idx];     // Red
      const g = data[idx + 1]; // Green
      const b = data[idx + 2]; // Blue

      fullArray[baseOffset + 0 * W * H + i] = r / 255; // Normalize if needed
      fullArray[baseOffset + 1 * W * H + i] = g / 255;
      fullArray[baseOffset + 2 * W * H + i] = b / 255;
    }
  }
}

export function getAttribute(element: Element, attribute: string): string {
  const value = element.getAttribute(attribute);
  if (value === null) {
    throw new Error(`Attribute "${attribute}" not found on element.`);
  }
  return value;
}

export function generateTicks(range: [number, number], count: number): number[] {
  const [min, max] = range;
  const step = (max - min) / (count - 1);
  const tickValues: number[] = [];

  for (let i = 0; i < count; i++) {
    tickValues.push(min + i * step);
  }

  return tickValues;
}

// Reads two 32-bit little-endian floats from the start of the buffer as min and max values. Then
// reads the rest as an array of bytes and scales the byte values to the range [min, max].
export function expandFloats(buf: ArrayBuffer): [number, number, Float32Array] {
  const headerView = new DataView(buf, 0, 8);
  const minVal = headerView.getFloat32(0, true); // little-endian
  const maxVal = headerView.getFloat32(4, true);
  const gridUint8 = new Uint8Array(buf, 8);  // Skip first 8 bytes
  const extent = maxVal - minVal;
  function convert(val: number): number {
    return minVal + (val / 255.0) * extent;
  }
  const gridData = new Float32Array(gridUint8.length);
  for (let i = 0; i < gridUint8.length; i++) {
    gridData[i] = convert(gridUint8[i]);
  }
  return [minVal, maxVal, gridData];
}

export function getEventCoordinates(
  e: MouseEvent | TouchEvent
): { clientX: number; clientY: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
  }
  return { clientX: (e as MouseEvent).clientX, clientY: (e as MouseEvent).clientY };
};

export function floorString(value: number): string {
  return Math.floor(value).toString();
}
