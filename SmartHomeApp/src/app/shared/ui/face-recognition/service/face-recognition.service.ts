// face-recognition.service.ts (extrait pertinent)
import { Injectable, NgZone, signal } from '@angular/core';
import { FaceRecognitionLibraryStatus as Status } from '../enum';
declare global {
  interface Navigator { hardwareConcurrency?: number; }
}

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  // État public
  readonly status$ = signal<Status>(Status.IDLE);
  readonly error$  = signal<string | null>(null);

  // Instances réutilisables
  landmarker: any | null = null; // MediaPipe FaceLandmarker
  ort: any | null = null;        // module onnxruntime-web
  session: any | null = null;    // ORT InferenceSession (ArcFace)

  // Chemins (adapte si tes noms diffèrent)
  mediapipeBasePath  = '/assets/mediapipe';         // sans slash final
  embeddingModelPath = '/assets/models/w600k_mbf.onnx';
  ortBasePath        = '/assets/ort';               // sans slash final

  private loading?: Promise<void>;

  constructor(private zone: NgZone) {}

  /** Charge MediaPipe + ORT une seule fois (idempotent). */
  load(): Promise<void> {
    if (this.loading) return this.loading;

    this.status$.set(Status.LOADING);
    this.error$.set(null);

    const mpBase  = this.mediapipeBasePath.replace(/\/+$/, ''); // '/assets/mediapipe'
    const ortBase = this.ortBasePath.replace(/\/+$/, '');       // '/assets/ort'

    this.loading = (async () => {
      // 1) MediaPipe Tasks Vision
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
      const files = await FilesetResolver.forVisionTasks(mpBase);
      const landmarker = await FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${mpBase}/face_landmarker.task` },
        runningMode: 'VIDEO',
        numFaces: 1,
        // ↓ seuils un peu plus permissifs
        minFaceDetectionConfidence: 0.35,
        minFacePresenceConfidence: 0.35,
        minTrackingConfidence: 0.30,
        // on ne calcule pas d’infos inutiles
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      // 2) ONNX Runtime Web (WASM) — import ESM et chemins explicites
      const ort = await import(/* @vite-ignore */ 'onnxruntime-web/wasm');

      // Donne un "base path" simple : ORT construira les URLs .mjs/.wasm
      (ort as any).env.wasm.wasmPaths = `${ortBase}/`; // <- slash final volontaire
      (ort as any).env.logLevel = 'warning';
      (ort as any).env.wasm.simd = true;

      // Threads (worker) uniquement si COOP/COEP → crossOriginIsolated = true
      const threadsOK = (self as any).crossOriginIsolated === true;
      (ort as any).env.wasm.proxy = threadsOK;
      (ort as any).env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency ?? 2);

      // 3) Session ArcFace (112x112 → 512D)
      const session = await (ort as any).InferenceSession.create(this.embeddingModelPath, {
        executionProviders: ['wasm']
      });

      // 4) Expose
      this.landmarker = landmarker;
      this.ort = ort;
      this.session = session;
      this.status$.set(Status.READY);
    })().catch((err: any) => {
      console.error('[FaceRecognitionService] load error:', err);
      this.error$.set(err?.message ?? String(err));
      this.status$.set(Status.ERROR);
      throw err;
    }).finally(() => { this.loading = undefined; });

    return this.loading;
  }

  /** Attend que les libs soient prêtes (ou jette si erreur). */
  async whenReady(): Promise<void> {
    if (this.status$() === Status.READY) return;
    if (this.status$() === Status.ERROR) throw new Error(this.error$() ?? 'libs error');
    await this.load();
  }

  /** Nettoyage optionnel. */
  async dispose(): Promise<void> {
    try { await (this.landmarker?.close?.()); } catch {}
    this.landmarker = null;
    this.session = null;
    this.ort = null;
    this.status$.set(Status.IDLE);
    this.error$.set(null);
  }
}
