import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
  WritableSignal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import {EnrollmentBuildResult, FaceDirection, FaceEmotion, FaceRecognitionContext, FaceSnap} from '../../data';
import {isNil} from 'lodash';
import {FaceRecognitionUtil} from '../../util';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'app-face-recognition',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './face-recognition.html',
  styleUrls: ['./face-recognition.scss'],
})
export class FaceRecognition implements OnInit, OnDestroy {
  @Output() biometricData: EventEmitter<EnrollmentBuildResult> = new EventEmitter<EnrollmentBuildResult>();
  @ViewChild('video', {static: true}) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;
  dataIsOk$: WritableSignal<boolean> = signal(false);
  loading$: WritableSignal<boolean> = signal(false);
  showBioMetricForm$: WritableSignal<boolean> = signal(false);
  context$: WritableSignal<FaceRecognitionContext> = signal({
    yaw: 0, roll: 0, pitch: 0, pitchNeutralValue: 0, age: 0, gender: 'unknown', expression: FaceEmotion.NEUTRAL
  })
  styleLoading$: WritableSignal<string> = signal('');
  snapList$: WritableSignal<FaceSnap[]> = signal([]);
  pitchNeutralValue$ = signal<number>(0);
  private posEffect = effect(() => {
    this.setNeutralValue(this.context$())
  });
  private fillRecoEffect = effect(() => {
    this.checkPosition(this.pitchNeutralValue$());
  });
  // modèles
  private cal: number[] = [];
  private readonly modelPath = 'assets/face-detector-model/';
  private readonly minScore = 0.2;
  private readonly maxResults = 5;
  private optionsSSDMobileNet!: faceapi.SsdMobilenetv1Options;
  private nbPictures: number = 9;
  // runtime
  private stream?: MediaStream;
  private rafId?: number;
  private ctx!: CanvasRenderingContext2D;

  async ngOnInit() {
    await this.start();
    this.showForm().then();
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
  }

  async showForm() {
    this.showBioMetricForm$.set(true);
    await this.detectVideo()
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

  private fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const {width, height} = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // on dessine en px CSS
    return dpr;
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

    // Bandeau FPS (inchangé)
    ctx.fillStyle = '#fff';
    ctx.fillRect(8, 8, 110, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '13px system-ui, sans-serif';

    for (const person of data) {

      const det = person?.detection as faceapi.FaceDetection | undefined;
      const lm = person?.landmarks as faceapi.FaceLandmarks68 | undefined;
      const PAD = 0.16;                 // marge autour de la box
      const FILL = '#e6edf6';           // fond
      const FILL_ALPHA = 0.05;          // opacité
      const FRAME_COLOR = '#f7c97d';        // couleur des coins
      const FRAME_THICK = 6;            // épaisseur des coins
      const CORNER_LEN_PCT = 0.22;      // longueur des coins (en % de min(w,h))
      if (!det || !lm) continue;

      const box = det.box as faceapi.Box;

      // Cadre "un peu plus grand" : on ajoute une marge
      let x = box.x - box.width * PAD;
      let y = box.y - box.height * PAD;
      let w = box.width * (1 + 2 * PAD);
      let h = box.height * (1 + 2 * PAD);

      // Clamp dans le canvas (évite de dépasser)
      x = Math.max(0, x);
      y = Math.max(0, y);
      w = Math.min(canvas.width - x, w);
      h = Math.min(canvas.height - y, h);

      // 1) Fond semi-opaque sous le cadre
      ctx.save();
      ctx.globalAlpha = FILL_ALPHA;
      ctx.fillStyle = FILL;
      ctx.fillRect(x, y, w, h);
      ctx.restore();

      // 2) Bordure du cadre
      FaceRecognitionUtil.drawCornerFrame(ctx, x, y, w, h, {
        len: Math.min(w, h) * CORNER_LEN_PCT,
        thick: FRAME_THICK,
        color: FRAME_COLOR
      });

      // 3) Expression + âge/genre + angles (inchangé)
      const {roll, pitch, yaw} = FaceRecognitionUtil.estimateAngles(lm);
      if (person === data[0]) {
        const exp = (person?.expressions ?? {}) as Record<string, number>;
        const entries = Object.entries(exp) as [string, number][];
        const topExpr = entries.length ? entries.sort((a, b) => b[1] - a[1])[0] : null;
        this.context$.set({
          ...this.context$(),
          yaw, roll, pitch,
          gender: person.gender,
          age: Math.floor(person.age),
          expression: topExpr ? (topExpr[0].toUpperCase() as FaceEmotion) : FaceEmotion.NEUTRAL
        });
      }

      // 4) Landmarks (68 points) — inchangé
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#f7c97d';
      const pts: faceapi.Point[] = lm.positions ?? [];
      for (let i = 0; i < pts.length; i++) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }


  private setNeutralValue(context: FaceRecognitionContext): void {
    if (this.pitchNeutralValue$() === 0 && Math.abs(context.yaw) < 8 && Math.abs(context.roll) < 12) {
      this.cal.push(context.pitch);
      if (this.cal.length >= 10) { // ~10 échantillons
        const avg = this.cal.reduce((s, v) => s + v, 0) / this.cal.length;
        this.pitchNeutralValue$.set(parseInt(avg.toFixed(1)));
        this.cal = [];
      }
    }
  }

  async stopAndCleanup(reason?: string): Promise<void> {
    try {
      // 1) arrêter la boucle de rendu/détection
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = undefined;
      }
      if ((this as any).timer) {            // au cas où tu as un setInterval ailleurs
        clearInterval((this as any).timer);
        (this as any).timer = undefined;
      }

      // 2) retirer les écouteurs
      const canvas = this.canvasRef?.nativeElement;

      // 3) stopper la caméra
      if (this.stream) {
        for (const t of this.stream.getTracks()) {
          try {
            t.stop();
          } catch {
          }
        }
        this.stream = undefined;
      }

      // 4) mettre la vidéo en pause & libérer la source
      const video = this.videoRef?.nativeElement;
      if (video) {
        try {
          video.pause();
        } catch {
        }
        // @ts-ignore
        video.srcObject = null;
        video.removeAttribute('src');
        video.load?.();
      }

      // 5) nettoyer l’overlay (canvas)
      if (canvas && this.ctx) {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        // si tu veux libérer la mémoire du buffer :
        // canvas.width = 0; canvas.height = 0;
      }
      // 7) (optionnel) purge TFJS variables (si utilisées)
      try {
        (faceapi.tf as any)?.engine?.().disposeVariables?.();
      } catch {
      }
      try {
        (tf as any)?.disposeVariables?.();
      } catch {
      }
    } finally {
      this.dataIsOk$.set(true);
      if (reason) console.log('[stopAndCleanup]', reason);
    }
  }

  private checkPosition(pitchNeutral: number): void {
    const {yaw, pitch} = this.context$();

    let position: FaceDirection;
    if (pitchNeutral > 0) {
      if (this.pitchNeutralValue$() - pitch > 4) {
        if (yaw > 4) {
          position = FaceDirection.TOP_LEFT;
        } else if (yaw < -4) {
          position = FaceDirection.TOP_RIGHT;
        } else {
          position = FaceDirection.TOP;
        }
      } else if (this.pitchNeutralValue$() - pitch < -4) {

        if (yaw > 4) {
          position = FaceDirection.BOTTOM_LEFT;
        } else if (yaw < -4) {
          position = FaceDirection.BOTTOM_RIGHT;
        } else {
          position = FaceDirection.BOTTOM;
        }
      } else {
        if (yaw > 4) {
          position = FaceDirection.LEFT;
        } else if (yaw < -4) {
          position = FaceDirection.RIGHT;
        } else {
          position = FaceDirection.FACE
        }
      }
      // on traite les captures
      this.getCaptureIfNeeded(position).then();
    }
  }

  private async getCaptureIfNeeded(position: FaceDirection): Promise<void> {
    const list: FaceSnap[] = this.snapList$();
    let founded = list.find(item => item.position === position);
    if (isNil(founded)) {
      const value = await FaceRecognitionUtil.pushOneSample(this.videoRef, this.optionsSSDMobileNet);
      if (value) {
        list.push({position, emotion: this.context$().expression, value});
      }
    }
    this.setRingStyle(list);
    this.snapList$.set(list);
    if (list.length === this.nbPictures) {
      const bioData: EnrollmentBuildResult = FaceRecognitionUtil.buildEnrollment(list.map(i => i.value) /*, qualities? */);
      this.biometricData.emit(bioData);
      this.stopAndCleanup().then();
    }
  }

  private setRingStyle(list: FaceSnap[]): void {
    this.styleLoading$.set(`bottom:${100 / this.nbPictures * list.length}%`);
  }
}
