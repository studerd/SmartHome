export interface AccountDataPayload {
  id?: string;
  username: string;
  password: string;
  mail: string;
  biometricData?: Float32Array
}
