export class FaceRecognitionManagerUtil {
  static mapToViewport(
    p: { x: number, y: number },
    video: HTMLVideoElement,
    rect: { width: number; height: number }
  ) {
    const vw = video.videoWidth, vh = video.videoHeight;
    const cw = rect.width, ch = rect.height;

    // scale/offset de object-fit: cover
    const scale = Math.max(cw / vw, ch / vh);
    const dx = (cw - vw * scale) / 2;
    const dy = (ch - vh * scale) / 2;

    // MediaPipe renvoie x,y normalisés [0..1] dans le repère de la frame vidéo
    const x = dx + (p.x * vw) * scale;
    const y = dy + (p.y * vh) * scale;
    return {x, y};
  }
}
