import {Component, computed, effect, ElementRef, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import {FaceDirection} from '../../data/enum';

type FaceExpressions = {
  neutral?: number; happy?: number; sad?: number; angry?: number;
  fearful?: number; disgusted?: number; surprised?: number;
};

@Component({
  selector: 'app-face-recognition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './face-recognition.html',
  styleUrls: ['./face-recognition.scss'],
})
export class FaceRecognition implements OnInit, OnDestroy {
  @ViewChild('video', {static: true}) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;
  yaw$ = signal<number>(0);
  roll$ = signal<number>(0);
  pitch$ = signal<number>(0);
  pitchNeutralValue$ = signal<number>(0);
  age$ = signal<number>(0);
  gender$ = signal<string>('unknown');
  expression$ = signal<string>('unknown');
  position$ = computed<FaceDirection>(() => this.checkPosition(this.pitch$(), this.yaw$()));
// déclencheur : à chaque changement de yaw/roll → checkPosition()
  private posEffect = effect(() => {
    this.setNeutralValue(this.yaw$(), this.roll$())
  });
  // modèles
  private cal: number[] = [];

  private readonly modelPath = 'assets/face-detector-model/';
  private readonly minScore = 0.2;
  private readonly maxResults = 5;
  private optionsSSDMobileNet!: faceapi.SsdMobilenetv1Options;

  // runtime
  private stream?: MediaStream;
  private rafId?: number;
  private ctx!: CanvasRenderingContext2D;

  async ngOnInit() {
    await this.start();
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }

  // ---------------- Main (init TFJS + modèles + caméra) ----------------
  private async start() {

    // Backend: WebGL → fallback WASM
    try {
      await tf.setBackend('webgl');
      await tf.ready();
    } catch {
      await tf.setBackend('wasm');
      await tf.ready();
    }

    // Optimisations TFJS (silencieuses si flags absents)
    // @ts-ignore
    if (tf?.env?.().flagRegistry?.CANVAS2D_WILL_READ_FREQUENTLY) tf.env().set('CANVAS2D_WILL_READ_FREQUENTLY', true);
    // @ts-ignore
    if (tf?.env?.().flagRegistry?.WEBGL_EXP_CONV) tf.env().set('WEBGL_EXP_CONV', true);


    await this.setupFaceAPI();
    await this.setupCamera();
    await this.detectVideo();
  }

  // ---------------- Modèles ----------------
  private async setupFaceAPI() {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath),
      faceapi.nets.ageGenderNet.loadFromUri(this.modelPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath),
    ]);

    this.optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
      minConfidence: this.minScore,
      maxResults: this.maxResults,
    });
  }

  // ---------------- Caméra ----------------
  private async setupCamera(): Promise<void> {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    const constraints: MediaStreamConstraints = {audio: false, video: {facingMode: 'user'}};
    if (window.innerWidth > window.innerHeight) {
      (constraints.video as MediaTrackConstraints).width = {ideal: window.innerWidth};
    } else {
      (constraints.video as MediaTrackConstraints).height = {ideal: window.innerHeight};
    }

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = this.stream;

    await new Promise<void>(res => {
      video.onloadeddata = async () => {
        await video.play();

        // Dimensions internes fiables
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;

        // IMPORTANT: faire correspondre le canvas aux dimensions “source”
        canvas.width = vw;
        canvas.height = vh;

        // Met le canvas AU-DESSUS (au cas où le CSS ne le ferait pas)
        canvas.style.position = 'absolute';
        canvas.style.inset = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1000'; // 👈 force l’overlay
        (canvas as any).style.pointerEvents = 'none';

        // Contexte 2D robuste
        const ctxOpts = {alpha: true, desynchronized: true} as CanvasRenderingContext2DSettings;
        this.ctx = (canvas.getContext('2d', ctxOpts) ||
          canvas.getContext('2d')) as CanvasRenderingContext2D;

        res();
      };
    });
  }


  // ---------------- Boucle détection ----------------
  private async detectVideo() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    if (!video || video.paused) return;

    try {
      // ↓ garde expressions + âge/genre (si tu as bien les fichiers)
      const result = await faceapi
        .detectAllFaces(video, this.optionsSSDMobileNet)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      // mappe les coords au canvas (overlay transparent)
      const display = {width: canvas.width, height: canvas.height};
      faceapi.matchDimensions(canvas, display);
      const resized = faceapi.resizeResults(result, display) as any[];
      this.drawFaces(canvas, resized); // ← appelle bien le rendu texte/boîtes
    } catch (err) {
    } finally {
      if (!video.paused) this.rafId = requestAnimationFrame(() => this.detectVideo());
    }
  }

  private drawFaces(canvas: HTMLCanvasElement, data: any[]): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Efface en TRANSPARENT (canvas créé avec alpha:true)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bandeau FPS
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(8, 8, 110, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '13px system-ui, sans-serif';

    for (const person of data) {

      const det = person?.detection as faceapi.FaceDetection | undefined;
      const lm = person?.landmarks as faceapi.FaceLandmarks68 | undefined;
      if (!det || !lm) continue;

      const box = det.box as faceapi.Box;
      const scorePct = Math.round(((det.score ?? 0) * 1000)) / 10; // ex: 97.3%

      // 1) Cadre
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'deepskyblue';
      ctx.strokeRect(box.x, box.y, box.width, box.height);


      // 3) Expression (top) + Age/Gender (si présents) + Angles

      const {roll, pitch, yaw} = this.estimateAngles(lm);
      if (person === data[0]) {
        const exp = (person?.expressions ?? {}) as Record<string, number>;
        const entries = Object.entries(exp) as [string, number][];
        const topExpr = entries.length ? entries.sort((a, b) => b[1] - a[1])[0] : null;

        this.yaw$.set(yaw);
        this.roll$.set(roll);
        this.gender$.set(person.gender);
        this.age$.set(Math.floor(person.age));
        this.pitch$.set(pitch);
        if (topExpr) {
          this.expression$.set(topExpr[0]);
        }

      }

      // 4) Landmarks (68 points)
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'deepskyblue';
      const pts: faceapi.Point[] = lm.positions ?? [];
      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

// Angles approx (comme la démo)
  private estimateAngles(lm: faceapi.FaceLandmarks68): { roll: number; pitch: number; yaw: number } {
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
  private setNeutralValue(yaw: number, roll: number): void {
    if (this.pitchNeutralValue$() === 0 && Math.abs(yaw) < 8 && Math.abs(roll) < 12) {
      this.cal.push(this.pitch$());
      if (this.cal.length >= 10) { // ~10 échantillons
        const avg = this.cal.reduce((s, v) => s + v, 0) / this.cal.length;
        this.pitchNeutralValue$.set(parseInt(avg.toFixed(1)));
        this.cal = [];
      }
    }
  }

  private checkPosition(pitch: number, yaw: number): FaceDirection {
    if (this.pitchNeutralValue$() > 0) {
      if (this.pitchNeutralValue$() - pitch > 4) {
        if (yaw > 4) {
          return FaceDirection.TOP_LEFT;
        } else if (yaw < -4) {
          return FaceDirection.TOP_RIGHT;
        }
        return FaceDirection.TOP;
      } else if (this.pitchNeutralValue$() - pitch < -4) {

        if (yaw > 4) {
          return FaceDirection.BOTTOM_LEFT;
        } else if (yaw < -4) {
          return FaceDirection.BOTTOM_RIGHT;
        }
        return FaceDirection.BOTTOM;
      } else {
        if (yaw > 4) {
          return FaceDirection.LEFT;
        } else if (yaw < -4) {
          return FaceDirection.RIGHT;
        }
        return FaceDirection.FACE
      }
    }
    return FaceDirection.FACE;
  }
}
