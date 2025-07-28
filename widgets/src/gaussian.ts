export function standardGaussianPdf(x: number, y: number): number {
  return (1 / (2 * Math.PI)) * Math.exp(-(x * x + y * y) / 2);
}

export function sampleFromStandardGaussian(): [number, number] {
  // Box-Muller transform to generate two independent standard normal random variables
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

  return [z0, z1];
}
