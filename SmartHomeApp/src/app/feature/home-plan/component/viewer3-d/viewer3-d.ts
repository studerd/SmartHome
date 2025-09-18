// src/app/feature/viewer3d/component/viewer3-d.ts
import {Component, effect, ElementRef, HostListener, inject, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';

import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {View3DService} from '../../service/view-3-d.service';
import {CameraFitUtil, PickingUtil, RoomUtil, ScreenUtil, ThemeUtil} from '../../util';
import {Room, RoomClickData} from '../../data';
import {RoomService} from '../../service/room.service';
import {
  Box3,
  ColorRepresentation, Mesh,
  NoToneMapping,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';

@Component({
  selector: 'app-viewer3-d',
  standalone: true,
  imports: [],
  templateUrl: './viewer3-d.html',
  styleUrls: ['./viewer3-d.scss']
})
export class Viewer3D implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) private containerRef!: ElementRef<HTMLDivElement>;
  private readonly roomService: RoomService = inject(RoomService);
  private effectRoomPlan = effect(() => this.handleRoomFromPlan(this.svc.rooms$()));
  private effectRoomService = effect(() => this.handleRoomFromService(this.roomService.rooms$()));
  private ngZone = inject(NgZone);
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  private removePicking?: () => void;

  private isRunning = true; // rendu en cours ou non
  private svc: View3DService = inject(View3DService);

  /** Racine du modèle GLB pour thème/edges */
  private modelRoot?: Object3D;
  ngOnInit(): void {
    this.initThree();
    this.loadModel('assets/models/maison.glb');
    this.attachPicking();
    // Raccourci debug pour tester vite dans la console
    (window as any).viewer = this;
  }

  ngOnDestroy(): void {
    this.isRunning = false;
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.controls?.dispose();
    this.removePicking?.();
    if (this.modelRoot) ThemeUtil.removeEdgesOverlay(this.modelRoot);
    ScreenUtil.disposeScene(this.scene);
    this.renderer?.dispose();
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.camera || !this.renderer) return;
    const { width, height } = this.containerSize();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    const hidden = document.hidden;
    this.isRunning = !hidden;
  }
  // ===== Three init / loop ===================================================
  private containerSize() {
    const el = this.containerRef.nativeElement;
    return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
  }

  private initThree() {
    const { width, height } = this.containerSize();

    // Scene "unlit"
    this.scene = new Scene();
    this.scene.background = null;     // transparent
    this.scene.environment = null;    // pas d'IBL

    // Camera
    this.camera = new PerspectiveCamera(45, width / height, 0.1, 5000);
    this.camera.position.set(3, 2, 5);

    // Renderer (alpha, unlit, sans tone-mapping)
    this.renderer = new WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping; // couleur constante
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = false;
    // Optionnel: garantir la transparence
    this.renderer.setClearColor(0x000000, 0);

    // AUCUNE LUMIÈRE AJOUTÉE ICI ✅

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1, 0);
    this.controls.autoRotate = false;        // pas de rotation auto
    this.controls.autoRotateSpeed = 0.5;

    // Interactions + boucle render
    this.attachControlsInteractivity();
    this.animate();

    // Ajuste le viewport si besoin
    this.onResize();
  }

  private animate = () => {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        if (!this.isRunning) {
          this.animationId = null;
          return;
        }
        this.animationId = requestAnimationFrame(loop);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  };

  private attachControlsInteractivity() {
    const stop = () => {
      this.controls.autoRotate = false;
    };
    const resume = (() => {
      let t: any;
      return () => {
        clearTimeout(t);
        t = setTimeout(() => (this.controls.autoRotate = false), 3000);
      };
    })();
    this.controls.addEventListener('start', stop);
    this.controls.addEventListener('end', resume);
  }

  // ===== GLB loading =========================================================
  // --- remplace ta méthode loadModel par celle-ci ---
  // Retire toutes les lights d'une scène / d'un subtree (y compris celles du GLB)
  private removeAllLights(root: Object3D | Scene) {
    const toRemove: Object3D[] = [];
    root.traverse(obj => {
      // @ts-ignore
      if (obj.isLight) toRemove.push(obj);
    });
    toRemove.forEach(l => l.parent?.remove(l));
  }

  private loadModel(path: string) {
    const loader = new GLTFLoader();

    loader.load(
      path,
      (gltf: GLTF) => {
        const root = gltf.scene;
        this.modelRoot = root;

        // 1) Nettoyage du contenu GLB : pas de lights, pas d’envmap, pas d’ombres
        this.removeAllLights(root);
        root.traverse(obj => {
          const mesh = obj as Mesh;
          // @ts-ignore
          if (mesh?.isMesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              // @ts-ignore
              if ('envMap' in m && m.envMap) (m as any).envMap = null;
              m.needsUpdate = true;
            }
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        // 2) Ajout à la scène et purge globale
        this.scene.add(root);
        this.scene.environment = null;   // aucune IBL
        this.scene.background  = null;   // fond transparent si renderer alpha
        this.removeAllLights(this.scene);

        // 3) Thème "flat/unlit" + edges
        ThemeUtil.forceUnlitBasic(root, 0x6b737d);
        ThemeUtil.forceTranslucentBasic(root, '#273549', 0.35);
        ThemeUtil.rebuildEdgesOverlay(root, '#9fb3c8', 1, () => true, true, 1.0, true);

        // 4) Indexation + init + cadrage caméra
        this.svc.indexEntities(root, this.scene);
        this.svc.init(root, this.scene);
        CameraFitUtil.fitCameraToObject(this.camera, this.controls, root);

        this.onResize();
      },
      undefined,
      (err: any) => {
        console.error('Erreur de chargement du modèle:', err);
      }
    );
  }

  private handleRoomClick(data: RoomClickData): void {
    console.log('[ROOM CLICK]', {
      roomId: data.roomId,
      roomName: data.roomName,
      center: {x: data.center.x, y: data.center.y, z: data.center.z},
      bbox: data.bbox
    });
  }

  // ===== Picking ==============================================================
  private attachPicking() {
    const el: HTMLElement = this.renderer?.domElement as HTMLElement;
    if (!el) return;

    this.removePicking = PickingUtil.setupPicking(el, this.camera, this.scene, (obj) => {
      const lampObj = PickingUtil.findAncestorByName(obj, n => RoomUtil.isLamp(n));
      if (lampObj) {
        const meta = RoomUtil.parseLampId(lampObj.name);
        if (meta) this.svc.setLampState(`${meta.roomId}:${meta.subId}`);
        return;
      }
      const roomObj = PickingUtil.findAncestorByName(obj, n => RoomUtil.isRoom(n));
      console.log('roomObj', roomObj);
      if (roomObj) {
        const id = RoomUtil.getRoomId(roomObj.name);
        // construit les infos utiles
        const bbox = new Box3().setFromObject(roomObj);
        const center = bbox.getCenter(new Vector3());
        // log via handler
        this.handleRoomClick({
          roomId: id ?? null,
          roomName: roomObj.name,
          object: roomObj,
          bbox,
          center
        });
        if (id) this.svc.setRoomState(id);
      }
    });
  }


  private handleRoomFromPlan(roomFromPlan: Room[]): void {
    this.roomService.list(roomFromPlan);
  }

  private handleRoomFromService(rooms: Room[]): void {
    if (rooms.length > 0) {
      for (const room of rooms) {
        this.setRoomLightOnOrNot(room);
      }
    }
  }

  private setRoomLightOnOrNot(room: Room, color: ColorRepresentation = '#FFE08A', opacity = 0.4): void {
    if (!room?.node) return;
    if (room.isOn) RoomUtil.applyLightOverlay(room.node, color, opacity);
    else RoomUtil.clearLightOverlay(room.node);
  }
}
