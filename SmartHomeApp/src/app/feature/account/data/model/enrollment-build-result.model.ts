export interface EnrollmentBuildResult {
  centroid: number[];                 // embedding final (L2)
  usedIndexes: number[];              // indices gardés
  rejectedIndexes: number[];          // indices rejetés (outliers)
  simsToCentroid: number[];           // similarités des gardés
  gallery: string[];                  // 2 meilleures images (dataURL) pour debug / backend
}
