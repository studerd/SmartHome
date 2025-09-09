import {
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  NgZone,
  OnDestroy,
  Output,
  signal,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FaceRecognitionService} from '../../service/face-recognition.service';
import {FaceRecognitionLibraryStatus as Status} from '../../data/enum';
import {TranslatePipe} from '@ngx-translate/core';
import {VideoFrameScheduler} from '../../data';
import {FaceRecognitionManagerUtil} from '../../util';

type LmPt = { x: number; y: number };

@Component({
  selector: 'app-face-recognition-sign-in',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './face-recognition-sign-in.html',
  styleUrls: [
    './face-recognition-sign-in.scss',
    '../face-recognition-manager/face-recognition-manager.scss'
  ]
})
export class FaceRecognitionSignIn implements OnDestroy {
  protected libs = inject(FaceRecognitionService);
  private zone = inject(NgZone);

  @ViewChild('video', {static: false}) videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', {static: false}) canvasRef?: ElementRef<HTMLCanvasElement>;

  @Output() setBiometricData = new EventEmitter<Float32Array<any>>();

  // UI
  splashUp$ = signal(false);
  camReady$ = signal(false);
  capturing$ = signal(false);
  progress$ = signal(0);
  error$ = signal<string | null>(null);
  isCapturable$ = signal(false);
  finalized$ = signal(false);
  loadingLibs$ = computed(() => this.libs.status$() === Status.LOADING);

  // capture config
  private targetFrames = 16;
  private margin = 0.30;
  private embedBusy = false;
  private sumEmb: Float32Array<any> | null = null;
  private count = 0;
  private lastLm: LmPt[] | null = null;
  private lastLmTs = 0;
  private LOST_TTL = 300;
  private SMOOTH_W = 0.5;
  private scheduler!: VideoFrameScheduler;
  private frameId: number | null = null;

  // -------- Splash → Auto start --------
  async onSplashClick() {
    if (this.splashUp$()) return;
    this.splashUp$.set(true);
    this.error$.set(null);
    try {
      await this.libs.whenReady();
      await this.openCamera();
      this.startAutoCapture();
    } catch (e: any) {
      this.error$.set(e?.message ?? 'Initialisation impossible');
    }
  }

  private startAutoCapture() {
    if (!this.camReady$() || this.capturing$()) return;
    this.sumEmb = null;
    this.count = 0;
    this.progress$.set(0);
    this.capturing$.set(true);
    this.captureUntilReady().then(() => {
      const embedding = this.finalize();
      this.capturing$.set(false);
      this.setBiometricData.emit(embedding);
      this.finalized$.set(true);
      this.closeCamera().then()
    });
  }

  // ---- camera lifecycle ----
  private async openCamera() {
    const video = this.videoRef!.nativeElement;
    const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}, audio: false});
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    await this.whenCanPlay(video);
    await video.play();
    this.camReady$.set(true);
    this.startLoop();
  }

  private async closeCamera() {
    this.stopLoop();
    const v = this.videoRef?.nativeElement;
    if (v) {
      (v.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
      v.pause();
      //v.srcObject = null;
    }

    this.camReady$.set(false);
    this.isCapturable$.set(false);
  }

  private whenCanPlay(v: HTMLVideoElement) {
    return new Promise<void>(res => {
      if (v.readyState >= 3) return res();
      const on = () => {
        v.removeEventListener('canplay', on);
        res();
      };
      v.addEventListener('canplay', on, {once: true});
    });
  }

  // ---- loop + capture ----
  private startLoop() {
    const video = this.videoRef!.nativeElement;
    const canvas = this.canvasRef!.nativeElement;
    const ctx = canvas.getContext('2d', {alpha: true})!;

    this.scheduler = FaceRecognitionManagerUtil.makeVideoFrameScheduler(video)

    const step = (now: number) => {
      this.frameId = this.scheduler.schedule(step)

      // resize canvas
      const dpr = Math.max(1, devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(r.width * dpr) || canvas.height !== Math.round(r.height * dpr)) {
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);

      if (!this.libs.landmarker) return;

      const res = this.libs.landmarker.detectForVideo(video, now);

      // ---- set isCapturable$ en fonction de la détection ACTUELLE (sans TTL)
      const detectedNow = !!(res?.faceLandmarks && res.faceLandmarks.length > 0);
      if (this.isCapturable$() !== detectedNow) {
        this.isCapturable$.set(detectedNow);
      }

      // Landmarks pour crop (avec smoothing/TTL uniquement pour stabilité visuelle)
      let lm = res?.faceLandmarks?.[0] as LmPt[] | undefined;
      if (lm && lm.length) {
        if (this.lastLm) {
          const w = this.SMOOTH_W, out = new Array(lm.length);
          for (let i = 0; i < lm.length; i++) {
            const px = this.lastLm[i]?.x ?? lm[i].x, py = this.lastLm[i]?.y ?? lm[i].y;
            out[i] = {x: px * (1 - w) + lm[i].x * w, y: py * (1 - w) + lm[i].y * w};
          }
          lm = out as LmPt[];
        }
        this.lastLm = lm;
        this.lastLmTs = now;
      } else if (this.lastLm && (now - this.lastLmTs) < this.LOST_TTL) {
        lm = this.lastLm;
      } else {
        this.lastLm = null;
      }

      // pipeline capture
      if (this.capturing$() && lm && !this.embedBusy && this.count < this.targetFrames) {
        this.embedBusy = true;
        const crop = this.makeCrop112(video, lm, this.margin);
        this.forwardEmbedding(crop).then(emb => {
          this.accumulate(emb);
          this.progress$.set(Math.min(1, this.count / this.targetFrames));
        }).finally(() => this.embedBusy = false);
      }
    };

    this.zone.runOutsideAngular(() => {
      this.frameId = this.scheduler.schedule(step);
    });
  }

  private stopLoop() {
    if (this.frameId != null && this.scheduler) {
      this.scheduler.cancel(this.frameId);
      this.frameId = null;
    }
  }

  /** Attend que la capture atteigne targetFrames. */
  private captureUntilReady(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (!this.capturing$()) return resolve();
        if (this.count >= this.targetFrames) return resolve();
        requestAnimationFrame(check);
      };
      check();
    });
  }

  // ---- preproc + inference ----
  private cropCanvas?: HTMLCanvasElement;
  private cropCtx?: CanvasRenderingContext2D;

  private makeCrop112(video: HTMLVideoElement, lm: LmPt[], marginRatio: number): ImageData {
    if (!this.cropCanvas) {
      this.cropCanvas = document.createElement('canvas');
      this.cropCanvas.width = 112;
      this.cropCanvas.height = 112;
      this.cropCtx = this.cropCanvas.getContext('2d', {willReadFrequently: true})!;
    }
    const vw = video.videoWidth, vh = video.videoHeight;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of lm) {
      const x = p.x * vw, y = p.y * vh;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const bw = maxX - minX, bh = maxY - minY, size = Math.max(bw, bh) * (1 + marginRatio * 2);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const sx = Math.max(0, cx - size / 2), sy = Math.max(0, cy - size / 2);
    const sw = Math.min(size, vw - sx), sh = Math.min(size, vh - sy);
    this.cropCtx!.drawImage(video, sx, sy, sw, sh, 0, 0, 112, 112);
    return this.cropCtx!.getImageData(0, 0, 112, 112);
  }

  private async forwardEmbedding(img: ImageData): Promise<Float32Array<any>> {
    const ort = this.libs.ort as any;
    const session = this.libs.session as any;
    const H = 112, W = 112;
    const nchw = new Float32Array(1 * 3 * H * W);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = img.data[i] / 255, g = img.data[i + 1] / 255, b = img.data[i + 2] / 255;
        nchw[0 * H * W + y * W + x] = (r - 0.5) / 0.5;
        nchw[1 * H * W + y * W + x] = (g - 0.5) / 0.5;
        nchw[2 * H * W + y * W + x] = (b - 0.5) / 0.5;
      }
    }
    const inputName = session.inputNames[0];
    const tensor = new ort.Tensor('float32', nchw, [1, 3, H, W]);
    const out = await session.run({[inputName]: tensor});
    const outName = session.outputNames[0];
    const emb: Float32Array<any> = out[outName].data as Float32Array<any>;

    // L2-norm
    let n = 0;
    for (let i = 0; i < emb.length; i++) n += emb[i] * emb[i];
    n = Math.sqrt(n) || 1;
    const norm = new Float32Array(emb.length);
    for (let i = 0; i < emb.length; i++) norm[i] = emb[i] / n;
    return norm;
  }

  private accumulate(emb: Float32Array<any>) {
    if (!this.sumEmb) this.sumEmb = new Float32Array<any>(emb.length);
    for (let i = 0; i < emb.length; i++) this.sumEmb[i] += emb[i];
    this.count++;
  }

  private finalize(): Float32Array<any> {
    const out = new Float32Array<any>(this.sumEmb!.length);
    for (let i = 0; i < out.length; i++) out[i] = this.sumEmb![i] / this.count;
    let n = 0;
    for (let i = 0; i < out.length; i++) n += out[i] * out[i];
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < out.length; i++) out[i] /= n;
    return out;
  }

  ngOnDestroy() {
    this.closeCamera();
  }
}
