import type * as ort from 'onnxruntime-web';

type OrtFunction = (input: ort.Tensor) => Promise<ort.InferenceSession.ReturnType>;

export default OrtFunction;
