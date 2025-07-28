export function drawImage(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  canvasX = 0,
  canvasY = 0,
  dataOffset = 0
): void {
  const height = 32;
  const width = 32;

  const imgData = ctx.createImageData(width, height);

  const pixels = width * height;

  for (let i = 0; i < pixels; i++) {
    const dataIndex = i + dataOffset;
    const r = Math.floor(data[dataIndex] * 255);                     // Red channel
    const g = Math.floor(data[dataIndex + pixels] * 255);            // Green channel
    const b = Math.floor(data[dataIndex + 2 * pixels] * 255);        // Blue channel

    imgData.data[i * 4 + 0] = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = 255;  // Fully opaque
  }

  ctx.putImageData(imgData, canvasX, canvasY);
}
