import {Component, ElementRef, ViewChild, inject, OnDestroy, OnInit, signal, WritableSignal} from '@angular/core';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-wasm';
import {SecurityService} from '../../service';
import {ApiResponse} from '@api';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-sign-in-face',
  standalone: true,
  templateUrl: './sign-in-face.html',
  styleUrls: ['./sign-in-face.scss']
})
export class SignInFace implements OnInit, OnDestroy {
  @ViewChild('video', {static: true}) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', {static: true}) canvasRef!: ElementRef<HTMLCanvasElement>;
  private securityService = inject(SecurityService);
  private MODELS_URL = 'assets/face-detector-model/';
  private stream?: MediaStream;
  private samplingTimer?: number;
  private captured = false;
  private readonly inputSize = 512;
  private readonly sampleMs = 220;
  private readonly requiredStable = 4;
  private readonly minFaceRatio = 0.30;
  private readonly timeoutMs = 15000;

  loading$: WritableSignal<boolean> = signal(false);      // lib / modèles en cours de chargement
  recognition$: WritableSignal<boolean> = signal(false);

  ngOnInit(): void {
    this.start(); // lancement auto
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async start() {
    this.loading$.set(true);  // début init
    await this.setBestBackend();
    await this.loadModels();
    this.loading$.set(false); // fin init

    try {
      this.recognition$.set(true);
      await this.openCamera();
      this.captured = false;
      await this.detectOnceWhenStable();
    } catch (e) {
      this.recognition$.set(false);
      console.error('Erreur caméra ou modèles', e);
      this.loading$.set(false);
    }
  }

  private stop() {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = undefined;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = undefined;
    }
    const video = this.videoRef?.nativeElement;
    if (video) video.srcObject = null;
  }

  private async setBestBackend() {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
    } catch {
      await tf.setBackend('wasm');
      await tf.ready();
    }
    console.log('TFJS backend =', tf.getBackend());
  }

  private async loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(this.MODELS_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(this.MODELS_URL);
  }

  private async openCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}},
      audio: false,
    });
    const video = this.videoRef.nativeElement;
    video.srcObject = this.stream;
    await video.play();
  }

  private drawScaled(size = this.inputSize) {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const {videoWidth: w, videoHeight: h} = video;
    const scale = size / Math.max(w, h);
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);
    canvas.width = tw;
    canvas.height = th;
    ctx.drawImage(video, 0, 0, tw, th);
  }

  private async detectOnceWhenStable() {
    // Warm-up
    this.drawScaled(this.inputSize);
    await faceapi.detectSingleFace(this.canvasRef.nativeElement)
      .withFaceLandmarks()
      .withFaceDescriptor();

    let stable = 0;
    const startTs = Date.now();

    this.samplingTimer = window.setInterval(async () => {
      if (this.captured) return;
      if (Date.now() - startTs > this.timeoutMs) {
        console.warn('Timeout détection');
        this.stop();
        return;
      }

      this.drawScaled(this.inputSize);

      const res = await faceapi
        .detectSingleFace(this.canvasRef.nativeElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!res) {
        stable = 0;
        return;
      }

      const {box} = res.detection;
      const minSide = Math.min(this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
      if (Math.min(box.width, box.height) < minSide * this.minFaceRatio) {
        stable = 0;
        return;
      }

      if (++stable >= this.requiredStable) {
        this.captured = true;
        clearInterval(this.samplingTimer);
        this.samplingTimer = undefined;

        const descriptor = Array.from(res.descriptor);
        await this.verify(descriptor);
      }
    }, this.sampleMs);
  }

  private async verify(descriptor: number[]) {
    // début recognition
    try {
      const resp: ApiResponse = await firstValueFrom(
        this.securityService.signInFace(descriptor)
      );
      if (resp?.result) {
        console.log('Connecté ✅');
      } else {
        console.log('Visage non reconnu ❌');
      }
    } catch (e) {
      console.error('Erreur serveur', e);
    } finally {
      this.recognition$.set(false); // fin recognition
      this.stop();
    }
  }
}
