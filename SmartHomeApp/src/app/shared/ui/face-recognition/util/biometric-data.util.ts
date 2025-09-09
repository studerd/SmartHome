import {BiometricData, BiometricModel} from '../data';

export class BiometricDataUtil {
  static makeBiometricData(
    embedding: Float32Array<any> | number[],
    model: BiometricModel = 'arcface-w600k-mbf'
  ): BiometricData {
    return {
      vector: Array.from(embedding),
      model,
      dim: 512 as const,
      normalized: true as const,
    };
  }
}
