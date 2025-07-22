import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import { setUpEvolution as setUpEvolutionInternal } from 'widgets/evolution';
import { expandFloats } from 'widgets/util';

import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var trainLosses : number[];
declare var valLosses : number[];
declare var gridDataBase64: string;
var decodingContainer = getPreviousElementSibling() as HTMLDivElement;
/* eslint-enable no-var */

function setUpEvolution(): void {
  const gridData = fromBase64(gridDataBase64);
  const [, , gridFloats] = expandFloats(gridData.buffer);
  setUpEvolutionInternal(
    decodingContainer,
    trainLosses,
    valLosses,
    gridFloats
  );
}

setUpEvolution();
