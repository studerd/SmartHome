// local-face-db.service.ts
import {Injectable} from '@angular/core';
import {
  Observable, Subject, defer, map, switchMap, catchError, throwError, of, shareReplay, tap
} from 'rxjs';
import {BiometricData, LocalFaceUser} from '../data';

@Injectable({providedIn: 'root'})
export class LocalFaceDbService {
  /** Ouverture de la DB en Observable (memoisée) */
  private db$ = this.openDb$().pipe(shareReplay(1));

  /** Événements de modification (add/update/remove/clear) */
  readonly changes$ = new Subject<void>();

  constructor() {
    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB non disponible dans ce navigateur.');
    }
    // Option: demander du stockage persistant
    (navigator as any).storage?.persist?.().catch(() => void 0);
  }

  // ------------------------------------------------------------------
  // API publique (Observable-based)
  // ------------------------------------------------------------------

  /** Ajoute ou met à jour un utilisateur local. */
  addOrUpdate(username: string, biometric: BiometricData): Observable<void> {
    return this.db$.pipe(
      switchMap(db => defer(() => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');

        // ArrayBuffer "pur" (compatible IDB/Blob), à partir de number[]
        const buffer = this.toPlainArrayBuffer(biometric.vector);

        const rec: LocalFaceUser = {
          username,
          buffer,
          dim: biometric.dim,
          created: Date.now()
        };

        const put$ = this.idbRequest$<IDBValidKey>(store.put(rec)).pipe(map(() => void 0));
        const done$ = this.txComplete$(tx);

        return put$.pipe(
          switchMap(() => done$),
          tap(() => this.changes$.next())
        );
      })),
      catchError(err => throwError(() => err))
    );
  }

  /** Récupère l’empreinte locale d’un utilisateur (ou null). */
  get(username: string): Observable<Float32Array | null> {
    return this.db$.pipe(
      switchMap(db => defer(() => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const get$ = this.idbRequest$<LocalFaceUser | undefined>(store.get(username));
        const done$ = this.txComplete$(tx);
        return get$.pipe(
          map(rec => (rec ? new Float32Array(rec.buffer as ArrayBufferLike) : null)),
          switchMap(val => done$.pipe(map(() => val)))
        );
      }))
    );
  }

  /** Liste tous les enregistrements. */
  allUsers(): Observable<LocalFaceUser[]> {
    return this.db$.pipe(
      switchMap(db => defer(() => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const all$ = this.idbRequest$<LocalFaceUser[]>(store.getAll());
        const done$ = this.txComplete$(tx);
        return all$.pipe(
          switchMap(rows => done$.pipe(map(() => rows || [])))
        );
      }))
    );
  }

  /** Supprime un utilisateur local. */
  remove(username: string): Observable<void> {
    return this.db$.pipe(
      switchMap(db => defer(() => {
        const tx = db.transaction('users', 'readwrite');
        tx.objectStore('users').delete(username);
        return this.txComplete$(tx).pipe(tap(() => this.changes$.next()));
      }))
    );
  }

  /** Vide la base. */
  clear(): Observable<void> {
    return this.db$.pipe(
      switchMap(db => defer(() => {
        const tx = db.transaction('users', 'readwrite');
        tx.objectStore('users').clear();
        return this.txComplete$(tx).pipe(tap(() => this.changes$.next()));
      }))
    );
  }

  /**
   * Identification locale par similarité cosinus.
   * Renvoie { username, sim } ou null si pas assez proche / ambigu.
   */
  identify(
    query: number[],
    opts?: { threshold?: number; margin?: number }
  ): Observable<LocalFaceUser | null> {
    const threshold = opts?.threshold ?? 0.42; // à calibrer (0.35–0.50)
    const margin = opts?.margin ?? 0.05;

    const q = new Float32Array(query);

    return this.allUsers().pipe(
      map(rows => {
        let best: { user: LocalFaceUser; sim: number } | null = null;
        let second: { user: LocalFaceUser; sim: number } | null = null;

        for (const u of rows) {
          const v = new Float32Array(u.buffer as ArrayBufferLike);
          const sim = this.cosine(q, v);
          if (!best || sim > best.sim) {
            second = best;
            best = {user: u, sim};
          } else if (!second || sim > second.sim) {
            second = {user: u, sim};
          }
        }

        if (!best) return null;
        if (best.sim < threshold) return null;
        if (second && (best.sim - second.sim) < margin) return null;
        return best.user;
      })
    );
  }

  // ------------------------------------------------------------------
  // Helpers IndexedDB (Observable wrappers)
  // ------------------------------------------------------------------

  private openDb$(): Observable<IDBDatabase> {
    return defer(() => new Observable<IDBDatabase>((sub) => {
      const req = indexedDB.open('face-db', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', {keyPath: 'username'});
          store.createIndex('by_username', 'username', {unique: true});
        }
      };
      req.onsuccess = () => {
        sub.next(req.result);
        sub.complete();
      };
      req.onerror = () => {
        sub.error(req.error);
      };
    }));
  }

  private idbRequest$<T>(req: IDBRequest<T>): Observable<T> {
    return new Observable<T>((sub) => {
      req.onsuccess = () => {
        sub.next(req.result as T);
        sub.complete();
      };
      req.onerror = () => {
        sub.error(req.error);
      };
    });
  }

  private txComplete$(tx: IDBTransaction): Observable<void> {
    return new Observable<void>((sub) => {
      tx.oncomplete = () => {
        sub.next();
        sub.complete();
      };
      tx.onerror = () => {
        sub.error(tx.error);
      };
      tx.onabort = () => {
        sub.error(tx.error);
      };
    });
  }

  // ------------------------------------------------------------------
  // Utils
  // ------------------------------------------------------------------

  /** Copie en ArrayBuffer “pur” (compat IDB/Blob), à partir de Float32Array | number[] */
  private toPlainArrayBuffer(src: Float32Array | number[]): ArrayBuffer {
    if (src instanceof Float32Array) {
      const u8 = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
      return u8.slice().buffer; // copie -> ArrayBuffer garanti
    }
    return new Float32Array(src).buffer;
  }

  /** Similarité cosinus — vecteurs idéalement L2-normalisés. */
  private cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
    let dot = 0, na = 0, nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const x = a[i], y = b[i];
      dot += x * y;
      na += x * x;
      nb += y * y;
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }
}
