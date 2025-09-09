import {
  Component,
  computed,
  effect,
  ElementRef, EventEmitter,
  inject,
  NgZone,
  OnDestroy,
  Output,
  signal,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FaceRecognitionService} from '../../service';
import {FaceRecognitionLibraryStatus} from '../../data';
import {TranslatePipe} from '@ngx-translate/core';
import {delay} from 'rxjs';
import {BiometricData} from '../../data';
import {BiometricDataUtil} from '../../util';


type LmPt = { x: number; y: number };

@Component({
  selector: 'app-face-recognition-manager',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './face-recognition-manager.html',
  styleUrls: ['./face-recognition-manager.scss']
})
export class FaceRecognitionManager implements OnDestroy {
  protected libs = inject(FaceRecognitionService);
  protected readonly FaceRecognitionLibraryStatus = FaceRecognitionLibraryStatus;
  private zone = inject(NgZone);

  @ViewChild('video', {static: false}) videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', {static: false}) canvasRef?: ElementRef<HTMLCanvasElement>;
  @Output() embeddingFinalized = new EventEmitter<BiometricData>();
  // --- UI state
  dataIsOk$ = signal(false);
  camReady$ = signal(false);
  capturing$ = signal(false);
  progress$ = signal(0);          // 0..1
  error$ = signal<string | null>(null);
  embedding: Float32Array | null = null; // résultat final 512-D

  camBtn = computed(() => this.camReady$() ? '⏹ Fermer la caméra' : '📷 Activer la caméra');
  captureBtn = computed(() =>
    this.capturing$() ? `⏳ Capture ${Math.round(this.progress$() * 100)}%` : '✨ Capturer l’empreinte'
  );
  private statusReadyEffect = effect(() => this.showCameraAndStartCapturing(this.libs.status$()));
  // --- Capture config
  private targetFrames = 20;  // nb de frames pour la moyenne
  private margin = 0.30;      // marge autour de la bbox (crop 112x112)

  // --- Boucle vidéo (rVFC/RAF)
  private useRVFC = 'requestVideoFrameCallback'
  in
  HTMLVideoElement
.
  prototype;
  private onFrameId: number | null = null;

  // --- Smoothing & TTL (robuste rotations)
  private lastLm: LmPt[] | null = null;
  private lastLmTs = 0;
  private LOST_TTL = 350;     // ms
  private SMOOTH_W = 0.55;    // 0..1

  // --- Mesh (maillage “lié”)
  private showMesh = true;
  private maxNeighbors = 4;
  private maxDistFactor = 0.13;
  private recomputeEvery = 3;
  private frameNo = 0;
  private meshEdges: [number, number][] = [];

  // --- Embedding accumulation
  private sumEmb: Float32Array | null = null;
  private count = 0;
  private embedBusy = false;
  private cropCanvas?: HTMLCanvasElement;
  private cropCtx?: CanvasRenderingContext2D;

  // ------------------ Actions ------------------

  async onLoadLibs() {
    this.error$.set(null);
    try {
      await this.libs.load();
    } catch (e: any) {
      this.error$.set(e?.message ?? 'Échec de chargement des modules');
    }
  }

  async onToggleCamera() {
    this.error$.set(null);
    if (this.camReady$()) {
      await this.closeCamera();
      return;
    }
    try {
      await this.libs.whenReady();       // charge si nécessaire
      await this.openCamera();
    } catch (e: any) {
      this.error$.set(e?.message ?? 'Impossible d’activer la caméra');
    }
  }

  onCapture() {
    if (!this.camReady$() || this.capturing$()) return;
    this.embedding = null;
    this.sumEmb = null;
    this.count = 0;
    this.progress$.set(0);
    this.capturing$.set(true);
  }

  // ------------------ Camera lifecycle ------------------

  private async openCamera() {
    if (!this.videoRef || !this.canvasRef) return;
    try {
      const video = this.videoRef.nativeElement;
      const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user'}, audio: false});
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;

      await this.whenCanPlay(video);
      await video.play();

      this.camReady$.set(true);
      this.startLoop();
    } catch (e: any) {
      this.error$.set('Caméra indisponible ou refusée');
      console.error(e);
    }
  }

  private async closeCamera() {
    this.stopLoop();
    const v = this.videoRef?.nativeElement;
    if (v) {
      (v.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
      v.pause();
      v.srcObject = null;
    }
    this.camReady$.set(false);
    this.capturing$.set(false);
    this.progress$.set(0);
  }

  private whenCanPlay(v: HTMLVideoElement) {
    return new Promise<void>((resolve) => {
      if (v.readyState >= 3) return resolve(); // HAVE_FUTURE_DATA
      const on = () => {
        v.removeEventListener('canplay', on);
        resolve();
      };
      v.addEventListener('canplay', on, {once: true});
    });
  }

  // ------------------ Video loop + overlay ------------------

  private startLoop() {
    const video = this.videoRef!.nativeElement;
    const canvas = this.canvasRef!.nativeElement;
    const ctx = canvas.getContext('2d', {alpha: true}) as CanvasRenderingContext2D;

    const fitCover = (vw: number, vh: number, cw: number, ch: number) => {
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale, dh = vh * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      return {scale, dx, dy, dw, dh};
    };
    const mapToViewport = (p: LmPt, vw: number, vh: number, f: { scale: number; dx: number; dy: number }) => ({
      x: f.dx + (p.x * vw) * f.scale,
      y: f.dy + (p.y * vh) * f.scale,
    });
    const smoothLm = (prev: LmPt[], curr: LmPt[], w: number) => {
      const out = new Array(curr.length);
      for (let i = 0; i < curr.length; i++) {
        const px = prev[i]?.x ?? curr[i].x, py = prev[i]?.y ?? curr[i].y;
        out[i] = {x: px * (1 - w) + curr[i].x * w, y: py * (1 - w) + curr[i].y * w};
      }
      return out as LmPt[];
    };

    const step = (now: number) => {
      // schedule next
      this.onFrameId = this.useRVFC
        // @ts-ignore
        ? video.requestVideoFrameCallback(step)
        : requestAnimationFrame(step);

      if (!this.libs.landmarker) return;

      // resize canvas (CSS px)
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // detect
      const res = this.libs.landmarker.detectForVideo(video, now);
      let lm = res?.faceLandmarks?.[0] as LmPt[] | undefined;

      // TTL + smoothing
      if (lm && lm.length) {
        lm = this.lastLm ? smoothLm(this.lastLm, lm, this.SMOOTH_W) : lm;
        this.lastLm = lm;
        this.lastLmTs = now;
      } else if (this.lastLm && (now - this.lastLmTs) < this.LOST_TTL) {
        lm = this.lastLm;
      } else {
        this.lastLm = null;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Alignez votre visage face à la caméra…', 12, 22);
        return;
      }

      // mapping object-fit: cover
      const vw = video.videoWidth, vh = video.videoHeight;
      const fit = fitCover(vw, vh, rect.width, rect.height);

      // viewport points + face size
      const ptsViewport: LmPt[] = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of lm!) {
        const q = mapToViewport(p, vw, vh, fit);
        ptsViewport.push(q);
        if (q.x < minX) minX = q.x;
        if (q.y < minY) minY = q.y;
        if (q.x > maxX) maxX = q.x;
        if (q.y > maxY) maxY = q.y;
      }
      const faceSize = Math.max(maxX - minX, maxY - minY);

      // draw overlay (mesh + points)
      this.drawFaceOverlay(ctx, ptsViewport, faceSize);

      // async embedding capture (non bloquant)
      if (this.capturing$() && this.count < this.targetFrames && !this.embedBusy) {
        this.embedBusy = true;
        const crop = this.makeCrop112(video, lm!, this.margin);
        this.forwardEmbedding(crop).then(emb => {
          this.accumulate(emb);
          this.progress$.set(Math.min(1, this.count / this.targetFrames));
          if (this.count >= this.targetFrames) {
            this.embedding = this.finalize();
            this.capturing$.set(false);
            this.dataIsOk$.set(true);
            this.embeddingFinalized.emit(BiometricDataUtil.makeBiometricData(this.embedding));
          }
        }).finally(() => this.embedBusy = false);
      }
    };

    // start outside Angular (perf)
    this.zone.runOutsideAngular(() => {
      if (this.useRVFC) {
        // @ts-ignore
        this.onFrameId = video.requestVideoFrameCallback(step);
      } else {
        this.onFrameId = requestAnimationFrame(step);
      }
    });
  }

  private stopLoop() {
    if (this.onFrameId != null) {
      if (this.useRVFC) {
        // @ts-ignore
        this.videoRef?.nativeElement.cancelVideoFrameCallback?.(this.onFrameId);
      } else {
        cancelAnimationFrame(this.onFrameId);
      }
      this.onFrameId = null;
    }
  }

  // ------------------ Drawing ------------------

  /** Dessine le maillage “lié” + les points (alignés au viewport). */
  /** Dessine l'overlay selon le mode choisi. */
  private drawFaceOverlay(
    ctx: CanvasRenderingContext2D,
    ptsViewport: { x: number; y: number }[],
    faceSize: number
  ) {
    // bbox utile à plusieurs modes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of ptsViewport) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const w = (maxX - minX), h = (maxY - minY);

    if ((this.frameNo++ % this.recomputeEvery) === 0) {
      this.computeMeshEdges(ptsViewport, faceSize);
    }
    if (this.meshEdges.length) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#eeeeee';
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (const [i, j] of this.meshEdges) {
        const a = ptsViewport[i], b = ptsViewport[j];
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }


  /** Construit des arêtes entre voisins proches (k-NN borné par une distance max). */
  private computeMeshEdges(points: LmPt[], faceSize: number) {
    const maxD2 = (faceSize * this.maxDistFactor) ** 2;
    const edges: [number, number][] = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const pi = points[i];
      const cand: { j: number; d2: number }[] = [];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const dx = points[j].x - pi.x, dy = points[j].y - pi.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= maxD2) cand.push({j, d2});
      }
      cand.sort((a, b) => a.d2 - b.d2);
      const k = Math.min(this.maxNeighbors, cand.length);
      for (let t = 0; t < k; t++) {
        const j = cand[t].j;
        if (i < j) edges.push([i, j]); // évite doublons
      }
    }
    this.meshEdges = edges;
  }

  // ------------------ Preproc + inference (ArcFace) ------------------

  /** Crop 112x112 autour du visage (bbox landmarks + marge). */
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
    const bw = maxX - minX, bh = maxY - minY;
    const size = Math.max(bw, bh) * (1 + marginRatio * 2);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const sx = Math.max(0, cx - size / 2), sy = Math.max(0, cy - size / 2);
    const sw = Math.min(size, vw - sx), sh = Math.min(size, vh - sy);

    this.cropCtx!.drawImage(video, sx, sy, sw, sh, 0, 0, 112, 112);
    return this.cropCtx!.getImageData(0, 0, 112, 112);
  }

  /** Inference ORT → embedding 512-D L2-normalisé. */
  private async forwardEmbedding(img: ImageData): Promise<Float32Array> {
    const ort = this.libs.ort as any;
    const session = this.libs.session as any;
    const H = 112, W = 112;

    // NHWC u8 -> NCHW f32 [-1,1]
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
    const emb = out[outName].data as Float32Array;

    // L2-normalize
    let n = 0;
    for (let i = 0; i < emb.length; i++) n += emb[i] * emb[i];
    n = Math.sqrt(n) || 1;
    const norm = new Float32Array(emb.length);
    for (let i = 0; i < emb.length; i++) norm[i] = emb[i] / n;
    return norm;
  }

  private accumulate(emb: Float32Array) {
    if (!this.sumEmb) this.sumEmb = new Float32Array(emb.length);
    for (let i = 0; i < emb.length; i++) this.sumEmb[i] += emb[i];
    this.count++;
  }

  private finalize(): Float32Array {
    const out = new Float32Array(this.sumEmb!.length);
    for (let i = 0; i < out.length; i++) out[i] = this.sumEmb![i] / this.count;
    let n = 0;
    for (let i = 0; i < out.length; i++) n += out[i] * out[i];
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < out.length; i++) out[i] /= n;
    return out;
  }

  // ------------------ Cleanup ------------------

  ngOnDestroy() {
    this.closeCamera();
  }

  /** Convex hull (monotone chain) – renvoie la liste de points du pourtour. */
  private convexHull(pts: { x: number; y: number }[]): { x: number; y: number }[] {
    if (pts.length <= 3) return pts.slice();
    const p = pts.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const cross = (o: any, a: any, b: any) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower: any[] = [];
    for (const pt of p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
      lower.push(pt);
    }
    const upper: any[] = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const pt = p[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
      upper.push(pt);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  /** Ramer–Douglas–Peucker (simplifie un polygone fermé). */
  private rdpSimplify(pts: { x: number; y: number }[], eps: number): { x: number; y: number }[] {
    if (pts.length <= 3) return pts;
    // ferme le polygone pour simplifier, puis rouvre
    const closed = pts.concat([pts[0]]);
    const simplified = this.rdp(closed, eps);
    simplified.pop(); // retire le point dupliqué
    return simplified;
  }

  private rdp(pts: { x: number; y: number }[], eps: number): { x: number; y: number }[] {
    let dmax = 0, idx = 0;
    const end = pts.length - 1;
    const dist = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
      const A = p.x - a.x, B = p.y - a.y, C = b.x - a.x, D = b.y - a.y;
      const dot = A * C + B * D, lenSq = C * C + D * D;
      let t = lenSq ? dot / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const x = a.x + t * C, y = a.y + t * D;
      const dx = p.x - x, dy = p.y - y;
      return Math.hypot(dx, dy);
    };
    for (let i = 1; i < end; i++) {
      const d = dist(pts[i], pts[0], pts[end]);
      if (d > dmax) {
        idx = i;
        dmax = d;
      }
    }
    if (dmax > eps) {
      const rec1 = this.rdp(pts.slice(0, idx + 1), eps);
      const rec2 = this.rdp(pts.slice(idx, end + 1), eps);
      return rec1.slice(0, -1).concat(rec2);
    } else {
      return [pts[0], pts[end]];
    }
  }

  private showCameraAndStartCapturing(status: FaceRecognitionLibraryStatus): void {
    if (status === FaceRecognitionLibraryStatus.READY && !this.camReady$()) {
      this.onToggleCamera().then(() => {
          delay(6000);
          this.capturing$.set(true);
        }
      )
    }
  }
}
