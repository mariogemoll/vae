import type Pair from './pair';

// Define a scale function type that extends the base function with domain and range properties
interface Scale {
  (value: number): number;
  domain: Pair<number>;
  range: Pair<number>;
}

export default Scale;
