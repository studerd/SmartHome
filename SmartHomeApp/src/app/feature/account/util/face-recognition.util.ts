import {EnrollmentBuildResult, FaceEnrollmentPayload, QualityResult} from '../data';
import * as faceapi from '@vladmandic/face-api';
import {SsdMobilenetv1Options} from '@vladmandic/face-api';
import {ElementRef} from '@angular/core';

export class FaceRecognitionUtil {
  static async captureEnrollmentSample(videoRef: ElementRef<HTMLVideoElement>, optionsSSDMobileNet: SsdMobilenetv1Options): Promise<FaceEnrollmentPayload> {
    const video = videoRef.nativeElement;

    // 1) Détection + landmarks + descriptor (1 visage)
    const res = await faceapi
      .detectSingleFace(video, optionsSSDMobileNet)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!res) throw new Error('Aucun visage détecté');

    const {detection, descriptor, landmarks} = res;
    const box = detection.box;
    const score = detection.score ?? 0;

    // 2) Angles (pour QC / analytics)
    const {yaw, pitch, roll} = this.estimateAngles(landmarks);

    // 3) Ratio de taille du visage (contrôle qualité possible)
    const vw = video.videoWidth || 1;
    const vh = video.videoHeight || 1;
    const faceRatio = Math.min(box.width, box.height) / Math.min(vw, vh);

    // 4) Face chip 256×256 (crop simple de la box – pas de miroir)
    const chipSize = 256;
    const chip = document.createElement('canvas');
    chip.width = chipSize;
    chip.height = chipSize;
    const c = chip.getContext('2d')!;
    c.drawImage(video, box.x, box.y, box.width, box.height, 0, 0, chipSize, chipSize);
    const imageDataUrl = chip.toDataURL('image/jpeg', 0.9);

    // 5) Embedding normalisé (Float32Array -> number[] + L2)
    const embedding = this.l2Normalize(Array.from(descriptor));

    // 6) Payload à stocker
    return {
      embedding,
      imageDataUrl,
      bbox: {x: box.x, y: box.y, width: box.width, height: box.height},
      angles: {yaw, pitch, roll},
      detectionScore: score,
      faceRatio,
      createdAt: new Date().toISOString(),
      model: `face-api:${faceapi.version ?? 'unknown'}`,
    };
  }

  static estimateAngles(lm: faceapi.FaceLandmarks68): { roll: number; pitch: number; yaw: number } {
    const c = (pts: faceapi.Point[]) => {
      const n = pts.length;
      const sx = pts.reduce((s, p) => s + p.x, 0), sy = pts.reduce((s, p) => s + p.y, 0);
      return new faceapi.Point(sx / n, sy / n);
    };
    const cL = c(lm.getLeftEye());
    const cR = c(lm.getRightEye());
    const dist = Math.hypot(cR.x - cL.x, cR.y - cL.y) || 1;
    const nose = lm.getNose()[6];

    const rollRad = Math.atan2(cR.y - cL.y, cR.x - cL.x);
    const yawDeg = ((nose.x - (cL.x + cR.x) / 2) / dist) * 90;
    const pitchDeg = ((nose.y - (cL.y + cR.y) / 2) / dist) * 90;

    return {
      roll: Math.round((rollRad * 180) / Math.PI),
      pitch: Math.round(pitchDeg),
      yaw: Math.round(yawDeg),
    };
  }

  static l2Normalize(v: number[]): number[] {
    let s = 0;
    for (const x of v) s += x * x;
    const n = Math.sqrt(s) || 1;
    return v.map(x => x / n);
  }

  static async captureOneSample(videoRef: ElementRef<HTMLVideoElement>, optionsSSDMobileNet: SsdMobilenetv1Options): Promise<FaceEnrollmentPayload | null> {
    const sample = await FaceRecognitionUtil.captureEnrollmentSample(videoRef, optionsSSDMobileNet);
    const check = FaceRecognitionUtil.qc(sample);
    if (!check.ok) {
      console.warn('[enroll] sample rejeté:', check.reason, sample);
      return null;
    }
    return sample; // tu l’envoies direct à ton backend si tu veux
  }

// ====== 2) Capture & PUSH dans le buffer (pour moyenner plus tard) ======
  static async pushOneSample(videoRef: ElementRef<HTMLVideoElement>, optionsSSDMobileNet: SsdMobilenetv1Options): Promise<FaceEnrollmentPayload | null> {
    const sample = await FaceRecognitionUtil.captureOneSample(videoRef, optionsSSDMobileNet);
    if (sample) {// ← 1 seul échantillon
      const check = FaceRecognitionUtil.qc(sample);
      if (!check.ok) {
        console.warn('[enroll] sample rejeté:', check.reason, sample);
        return null;
      }

    }
    return sample;
  }

  static qc(sample: FaceEnrollmentPayload): { ok: boolean; reason?: string } {
    /* if (sample.detectionScore < this.min_score) return {ok: false, reason: 'score faible'};
     if (sample.faceRatio < this.min_face_ratio) return {ok: false, reason: 'visage trop petit'};
     if (Math.abs(sample.angles.yaw) > this.max_abs_yaw) return {ok: false, reason: 'yaw trop grand'};
     if (Math.abs(sample.angles.pitch) > this.max_abs_pitch) return {ok: false, reason: 'pitch trop grand'};*/
    return {ok: true};
  }

  // cosinus entre deux embeddings L2 (ou pas)
  static cosineSim(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const den = Math.sqrt(na) * Math.sqrt(nb) || 1;
    return dot / den;
  }

  static weightedMean(vectors: number[][], weights?: number[]): number[] {
    const dim = vectors[0].length;
    const out = new Array(dim).fill(0);
    const w = weights && weights.length === vectors.length ? weights : vectors.map(() => 1);
    let wsum = 0;
    for (let i = 0; i < vectors.length; i++) {
      const wi = w[i];
      wsum += wi;
      const v = vectors[i];
      for (let d = 0; d < dim; d++) out[d] += wi * v[d];
    }
    if (wsum === 0) return FaceRecognitionUtil.l2Normalize(out);
    for (let d = 0; d < dim; d++) out[d] /= wsum;
    return FaceRecognitionUtil.l2Normalize(out);
  }

  static buildEnrollment(samples: FaceEnrollmentPayload[], qualities?: QualityResult[]): EnrollmentBuildResult {
    if (!samples?.length) throw new Error('Aucun sample');

    // 1) Embeddings & poids (facultatif)
    const embeddings = samples.map(s => s.embedding);
    const weights = qualities?.map(q => Math.max(0.1, (q.score ?? 0) / 100)) ?? undefined;

    // 2) Centre provisoire (moyenne pondérée)
    let center = FaceRecognitionUtil.weightedMean(embeddings, weights);

    // 3) Similarités au centre + tri
    const sims = embeddings.map(e => FaceRecognitionUtil.cosineSim(e, center));
    const idxSorted = sims.map((s, i) => [s, i] as const).sort((a, b) => b[0] - a[0]).map(x => x[1]);

    // 4) Rejet léger d’outliers
    //    - seuil absolu doux (>= 0.60)
    //    - on garde au moins 4 meilleurs pour stabilité
    const MIN_KEEP = Math.min(4, samples.length);
    const ABS_THR = 0.60;

    const keptIdx: number[] = [];
    for (const i of idxSorted) {
      if (keptIdx.length < MIN_KEEP || sims[i] >= ABS_THR) keptIdx.push(i);
    }
    keptIdx.sort((a, b) => a - b);
    const rejIdx = embeddings.map((_, i) => i).filter(i => !keptIdx.includes(i));

    // 5) Centre final recalculé sur les gardés
    const keptEmb = keptIdx.map(i => embeddings[i]);
    const keptW = weights ? keptIdx.map(i => weights![i]) : undefined;
    center = FaceRecognitionUtil.weightedMean(keptEmb, keptW);

    // 6) Similarités finales (pour debug / stats)
    const simsFinal = keptEmb.map(e => FaceRecognitionUtil.cosineSim(e, center));

    // 7) 2 images “meilleures” (les plus proches du centre final)
    const bestOrder = keptIdx
      .map((i, k) => ({i, s: simsFinal[k]}))
      .sort((a, b) => b.s - a.s)
      .map(x => x.i);
    const gallery = bestOrder.slice(0, 2).map(i => samples[i].imageDataUrl);

    return {
      centroid: center,
      usedIndexes: keptIdx,
      rejectedIndexes: rejIdx,
      simsToCentroid: simsFinal,
      gallery,
    };
  }
  static drawCornerFrame(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    { len = Math.min(w, h) * 0.22, thick = 3, color = 'red' } = {}
  ){
    const l = Math.max(8, len);     // longueur des coins
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thick;
    ctx.lineCap = 'round';

    ctx.beginPath();
    // top-left
    ctx.moveTo(x, y);         ctx.lineTo(x + l, y);
    ctx.moveTo(x, y);         ctx.lineTo(x, y + l);
    // top-right
    ctx.moveTo(x + w, y);     ctx.lineTo(x + w - l, y);
    ctx.moveTo(x + w, y);     ctx.lineTo(x + w, y + l);
    // bottom-left
    ctx.moveTo(x, y + h);     ctx.lineTo(x + l, y + h);
    ctx.moveTo(x, y + h);     ctx.lineTo(x, y + h - l);
    // bottom-right
    ctx.moveTo(x + w, y + h); ctx.lineTo(x + w - l, y + h);
    ctx.moveTo(x + w, y + h); ctx.lineTo(x + w, y + h - l);

    ctx.stroke();
    ctx.restore();
  }

}
