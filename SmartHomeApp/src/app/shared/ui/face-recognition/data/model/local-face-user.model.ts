
export interface LocalFaceUser {
  username: string;       // clé
  buffer: ArrayBufferLike;    // Float32Array (512 * 4 octets)
  dim: 512;            // 512
  created: number;        // timestamp
}
