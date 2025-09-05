import {EnrollmentBuildResult} from '../model';

export interface AccountDataPayload {
  username: string;
  password: string;
  mail: string;
  biometricData?: EnrollmentBuildResult
}
