import { numEpochs,numModels } from './constants.js';

export function loadLosses(lossesBuf: ArrayBuffer): [number, number, number[][], number[][]] {
  const dataView = new DataView(lossesBuf);

  const result: number[][][] = Array.from({ length: numModels }, () =>
    Array.from({ length: 2 }, () =>
      Array.from({ length: numEpochs }, () => 0)
    )
  );

  let minVal = Infinity;
  let maxVal = 0;

  let offset = 0;
  for (let i = 0; i < numModels; i++) {
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < numEpochs; j++) {
        const val = dataView.getFloat32(offset, true);
        result[i][k][j] = val;
        minVal = Math.min(minVal, val);
        maxVal = Math.max(maxVal, val);
        offset += 4;
      }
    }
  }

  const trainLosses: number[][] = Array.from({ length: numModels }, () =>
    Array.from({ length: numEpochs }, () => 0)
  );

  const valLosses: number[][] = Array.from({ length: numModels }, () =>
    Array.from({ length: numEpochs }, () => 0)
  );

  for (let i = 0; i < numModels; i++) {
    for (let j = 0; j < numEpochs; j++) {
      trainLosses[i][j] = result[i][0][j];
      valLosses[i][j] = result[i][1][j];
    }
  }

  return [minVal, maxVal, trainLosses, valLosses];
}
