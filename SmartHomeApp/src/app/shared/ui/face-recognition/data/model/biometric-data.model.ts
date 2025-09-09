export type BiometricModel = 'arcface-w600k-mbf';

/** Empreinte faciale (512-D, L2-normalisée côté client) */
export interface BiometricData {
  vector: number[];          // 512 floats
  model: BiometricModel;     // ex: 'arcface-w600k-mbf'
  dim: 512;                  // littéral, force 512
  normalized: true;          // on stocke toujours normalisé
}
