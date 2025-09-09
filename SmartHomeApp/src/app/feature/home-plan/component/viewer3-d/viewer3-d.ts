import {
  Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NgZone } from '@angular/core';

interface LampEntity {
  id: string;                 // ex: "Chambre:Plafonnier1"
  mesh: THREE.Object3D;
  light: THREE.PointLight;
  roomId: string;             // ex: "Chambre"
  isOn: boolean;
}

interface RoomEntity {
  id: string;                 // ex: "Chambre"
  group: THREE.Object3D;
  lamps: LampEntity[];
  isOn: boolean;
}

@Component({
  selector: 'app-viewer3-d',
  imports: [],
  templateUrl: './viewer3-d.html',
  standalone: true,
  styleUrl: './viewer3-d.scss'
})
export class Viewer3D implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('container', { static: true }) private containerRef!: ElementRef<HTMLDivElement>;

  private ngZone = inject(NgZone);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId: number | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  private rooms = new Map<string, RoomEntity>();
  private lamps = new Map<string, LampEntity>();

  // === Public API (tu peux les appeler depuis ailleurs) ===
  setRoomState = (roomId: string, on?: boolean) => this._setRoomState(roomId, on);
  setLampState = (lampId: string, on?: boolean) => this._setLampState(lampId, on);

  ngOnInit(): void {
    this.initThree();
    this.loadModel('assets/models/maison.glb'); // <- adapte le chemin si besoin
    this.attachPointerHandlers();

    // Option pratique pour tester via la console:
    // (window as any).viewer = this;
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.controls?.dispose();
    this.disposeScene(this.scene);
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

  // ===== Init / Render loop =====
  private containerSize() {
    const el = this.containerRef.nativeElement;
    return { width: el.clientWidth || 800, height: el.clientHeight || 600 };
  }

  private initThree() {
    const { width, height } = this.containerSize();

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    this.camera.position.set(3, 2, 5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x3b3b3b, 0.7);
    hemi.position.set(0, 1, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7.5);
    this.scene.add(dir);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1, 0);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    this.animate();
  }

  private animate = () => {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  };

  // ===== Load & index entities =====
  private loadModel(path: string) {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const root = gltf.scene;
        this.scene.add(root);
        this.indexEntities(root);
        this.fitCameraToObject(root);
      },
      undefined,
      (err) => console.error('Erreur de chargement du modèle:', err)
    );
  }

  private indexEntities(root: THREE.Object3D) {
    root.traverse(obj => {
      if (!obj.name) return;

      if (obj.name.startsWith('Room:')) {
        const id = obj.name.split(':')[1]?.trim();
        if (!id) return;
        if (!this.rooms.has(id)) {
          this.rooms.set(id, { id, group: obj, lamps: [], isOn: false });
        }
      }

      if (obj.name.startsWith('Lamp:')) {
        // Lamp:<roomId>:<lampId>
        const parts = obj.name.split(':');
        const roomId = parts[1]?.trim();
        const lampSubId = parts.slice(2).join(':').trim() || 'Lamp';
        if (!roomId) return;

        if (!this.rooms.has(roomId)) {
          this.rooms.set(roomId, { id: roomId, group: this.scene, lamps: [], isOn: false });
        }

        const center = this.getWorldCenter(obj);
        const light = new THREE.PointLight(0xfff2cc, 0.0, 8, 1.5); // OFF au départ
        light.position.copy(center);
        this.scene.add(light);

        const lampId = `${roomId}:${lampSubId}`;
        const lamp: LampEntity = { id: lampId, mesh: obj, light, roomId, isOn: false };
        this.lamps.set(lampId, lamp);

        const room = this.rooms.get(roomId)!;
        room.lamps.push(lamp);

        this.markBulbForEmissive(obj);
      }
    });
  }

  private getWorldCenter(obj: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(obj);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }

  private fitCameraToObject(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    this.controls.target.copy(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = (maxDim / 2) / Math.tan(fov / 2);
    cameraZ *= 1.4;

    this.camera.position.set(center.x + cameraZ * 0.2, center.y + maxDim * 0.5, center.z + cameraZ);
    this.camera.near = Math.max(maxDim / 1000, 0.1);
    this.camera.far = Math.min(maxDim * 100, 5000);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  // ===== Picking (clic) =====
  private attachPointerHandlers() {
    const el = this.renderer?.domElement;
    if (!el) return;

    const toNDC = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    el.addEventListener('pointerdown', (e) => {
      toNDC(e);
      this.pickAtPointer();
    });
  }

  private pickAtPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (!intersects.length) return;

    const first = intersects[0].object as THREE.Object3D;

    const lampObj = this.findAncestorByName(first, n => n.startsWith('Lamp:'));
    if (lampObj) {
      const lampId = this.getLampIdFromName(lampObj.name);
      if (lampId) this._setLampState(lampId, undefined); // toggle
      return;
    }

    const roomObj = this.findAncestorByName(first, n => n.startsWith('Room:'));
    if (roomObj) {
      const roomId = roomObj.name.split(':')[1]?.trim();
      if (roomId) this._setRoomState(roomId, undefined); // toggle
    }
  }

  private findAncestorByName(obj: THREE.Object3D, predicate: (name: string) => boolean): THREE.Object3D | null {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (cur.name && predicate(cur.name)) return cur;
      cur = cur.parent;
    }
    return null;
  }

  private getLampIdFromName(name: string): string | null {
    if (!name.startsWith('Lamp:')) return null;
    const parts = name.split(':');
    const roomId = parts[1]?.trim();
    const lampSubId = parts.slice(2).join(':').trim() || 'Lamp';
    return roomId ? `${roomId}:${lampSubId}` : null;
  }

  // ===== State / visuals =====
  private _setLampState(lampId: string, on?: boolean) {
    const lamp = this.lamps.get(lampId);
    if (!lamp) return;
    const target = (on === undefined) ? !lamp.isOn : on;
    lamp.isOn = target;

    lamp.light.intensity = target ? 1.3 : 0.0;
    this.setBulbEmissive(lamp.mesh, target);

    const room = this.rooms.get(lamp.roomId);
    if (!room) return;
    const anyOn = room.lamps.some(l => l.isOn);
    this.applyRoomLit(room, anyOn);
  }

  private _setRoomState(roomId: string, on?: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const target = (on === undefined) ? !room.isOn : on;

    room.lamps.forEach(l => {
      l.isOn = target;
      l.light.intensity = target ? 1.3 : 0.0;
      this.setBulbEmissive(l.mesh, target);
    });

    this.applyRoomLit(room, target);
  }

  private markBulbForEmissive(obj: THREE.Object3D) {
    obj.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__origEmissive === undefined) {
            m.userData.__origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
            m.userData.__origEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
        });
      }
    });
  }

  private setBulbEmissive(obj: THREE.Object3D, on: boolean) {
    obj.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__origEmissive === undefined) {
            m.userData.__origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
          }
          if (m.userData.__origEmissiveIntensity === undefined) {
            m.userData.__origEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
          if (m.emissive) {
            if (on) {
              m.emissive.set(0xffd88a);
              m.emissiveIntensity = 1.2;
            } else {
              m.emissive.copy(m.userData.__origEmissive);
              m.emissiveIntensity = m.userData.__origEmissiveIntensity ?? 0;
            }
            m.needsUpdate = true;
          }
        });
      }
    });
  }

  private applyRoomLit(room: RoomEntity, lit: boolean) {
    room.isOn = lit;
    room.group.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__roomOrigEmissive === undefined) {
            m.userData.__roomOrigEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
            m.userData.__roomOrigEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
          if (m.emissive) {
            if (lit) {
              const base = m.userData.__roomOrigEmissive as THREE.Color;
              m.emissive.copy(base).add(new THREE.Color(0x151515));
              m.emissiveIntensity = Math.max(m.userData.__roomOrigEmissiveIntensity ?? 0, 0.15);
            } else {
              m.emissive.copy(m.userData.__roomOrigEmissive);
              m.emissiveIntensity = m.userData.__roomOrigEmissiveIntensity ?? 0;
            }
            m.needsUpdate = true;
          }
        });
      }
    });
  }

  private disposeScene(root: THREE.Object3D) {
    if (!root) return;
    root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh) {
        (mesh.geometry as THREE.BufferGeometry)?.dispose?.();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(m => {
          // @ts-ignore
          if (m && m.isMaterial) {
            Object.values(m).forEach((v: any) => { if (v && v.isTexture) v.dispose(); });
            // @ts-ignore
            m.dispose?.();
          }
        });
      }
      // @ts-ignore
      if (obj.isPointLight) (obj as THREE.PointLight).dispose?.();
    });
  }
}
