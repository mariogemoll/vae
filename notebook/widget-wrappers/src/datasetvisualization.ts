import fromBase64 from 'es-arraybuffer-base64/Uint8Array.fromBase64';
import { setUpDatasetVisualization } from 'widgets/datasetvisualization';

import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var datasetVisualizationTrainsetX: number[];
declare var datasetVisualizationTrainsetY: number[];
declare var datasetVisualizationValsetX: number[];
declare var datasetVisualizationValsetY: number[];
declare var datasetVisualizationTrainsetImagesBase64: string;
declare var datasetVisualizationValsetImagesBase64: string;

var trainsetImages: Uint8Array = fromBase64(datasetVisualizationTrainsetImagesBase64);
var valsetImages: Uint8Array = fromBase64(datasetVisualizationValsetImagesBase64);
/* eslint-enable no-var */

setUpDatasetVisualization(
    getPreviousElementSibling() as HTMLDivElement,
    datasetVisualizationTrainsetX,
    datasetVisualizationTrainsetY,
    datasetVisualizationValsetX,
    datasetVisualizationValsetY,
    trainsetImages,
    valsetImages
);
