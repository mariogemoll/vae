import { setUpDatasetVisualization } from 'widgets/datasetvisualization';

import { getPreviousElementSibling } from './util';

/* eslint-disable no-var */
declare var datasetVisualizationTrainsetX: number[];
declare var datasetVisualizationTrainsetY: number[];
declare var datasetVisualizationValsetX: number[];
declare var datasetVisualizationValsetY: number[];
declare var datasetVisualizationTrainsetImagesBase64: string;
declare var datasetVisualizationValsetImagesBase64: string;
/* eslint-enable no-var */

setUpDatasetVisualization(
    getPreviousElementSibling() as HTMLDivElement,
    datasetVisualizationTrainsetX,
    datasetVisualizationTrainsetY,
    datasetVisualizationValsetX,
    datasetVisualizationValsetY,
    datasetVisualizationTrainsetImagesBase64,
    datasetVisualizationValsetImagesBase64
);
