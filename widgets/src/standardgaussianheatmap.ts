function gaussian2d(x: number, y: number): number {
  const sigma = 1;
  return (1 / (2 * Math.PI * sigma * sigma)) *
        Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
}


export function drawGaussian(canvas: HTMLCanvasElement, zrange: number): void {

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for canvas');
  }
  const W = canvas.width;
  const H = canvas.height;
  const image = ctx.createImageData(W, H);
  const data = image.data;

  const centerValue = gaussian2d(0, 0);

  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = (i / (W - 1)) * 2 * zrange - zrange;
      const y = (j / (H - 1)) * 2 * zrange - zrange;
      const g = gaussian2d(x, y) / centerValue;
      const value = Math.floor(g * 255);
      const idx = (j * W + i) * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function getStandardGaussianHeatmap(width: number, height: number, zrange: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawGaussian(canvas, zrange);
  return canvas.toDataURL('image/png');
}
