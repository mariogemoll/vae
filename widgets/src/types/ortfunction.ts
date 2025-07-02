import type * as ort from 'onnxruntime-web';

export type OrtFunction = (input: ort.Tensor) => Promise<ort.InferenceSession.ReturnType>;
