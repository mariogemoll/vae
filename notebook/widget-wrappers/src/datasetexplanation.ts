import { setUpDatasetExplanation } from "widgets/datasetexplanation";
import faceImg from '../../../misc/face.png';
import pica from "pica";

// Get the current script tag
const currentScript = document.currentScript as HTMLScriptElement;

// Get the element right above the current script tag
const elementAbove = currentScript.previousElementSibling;

setUpDatasetExplanation(pica(), faceImg, elementAbove as HTMLDivElement).then(() => {
  console.log("Dataset explanation setup complete.");
}).catch((error: unknown) => {
  console.error("Error setting up dataset explanation:", error);
});
