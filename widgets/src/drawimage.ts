export function drawImage(ctx: CanvasRenderingContext2D, data: Float32Array): void {
  const height = 32;
  const width = 32;

  const imgData = ctx.createImageData(width, height);

  const pixels = width * height;

  for (let i = 0; i < pixels; i++) {
    const r = Math.floor(data[i] * 255);                     // Red channel
    const g = Math.floor(data[i + pixels] * 255);            // Green channel
    const b = Math.floor(data[i + 2 * pixels] * 255);        // Blue channel

    imgData.data[i * 4 + 0] = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = 255;  // Fully opaque
  }

  ctx.putImageData(imgData, 0, 0);
}
