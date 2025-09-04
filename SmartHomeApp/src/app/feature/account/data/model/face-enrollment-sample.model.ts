export interface FaceEnrollmentPayload {
  embedding: number[]; // 128D L2-normalized
  imageDataUrl: string; // "data:image/jpeg;base64,..."
  bbox: { x: number; y: number; width: number; height: number };
  angles: { yaw: number; pitch: number; roll: number };
  detectionScore: number;
  faceRatio: number; // taille visage / min(videoW,videoH)
  createdAt: string; // ISO
  model: string;     // version face-api
}
