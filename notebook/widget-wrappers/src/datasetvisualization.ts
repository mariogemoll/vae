import { setUpDatasetVisualization } from 'widgets/datasetvisualization';

import { getPreviousElementSibling } from './util';

// Global variables injected by Python
declare let trainsetX: number[];
declare let trainsetY: number[];
declare let valsetX: number[];
declare let valsetY: number[];
declare let trainsetImagesBase64: string;
declare let valsetImagesBase64: string;

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
