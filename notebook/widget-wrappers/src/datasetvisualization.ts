import { setUpDatasetVisualization } from 'widgets/datasetvisualization';

import { getPreviousElementSibling } from './util';

// Global variables injected by Python
declare var trainsetX: number[];
declare var trainsetY: number[];
declare var valsetX: number[];
declare var valsetY: number[];
declare var trainsetImagesBase64: string;
declare var valsetImagesBase64: string;

const pes = getPreviousElementSibling();

setUpDatasetVisualization(
    pes as HTMLDivElement,
    trainsetX,
    trainsetY,
    valsetX,
    valsetY,
    trainsetImagesBase64,
    valsetImagesBase64
);
