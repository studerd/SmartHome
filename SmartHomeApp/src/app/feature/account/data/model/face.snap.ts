import {FaceDirection,FaceEmotion} from '../enum';
import {FaceEnrollmentPayload} from './face-enrollment-sample.model';

export interface FaceSnap {
  position: FaceDirection;
  emotion: FaceEmotion
  value: FaceEnrollmentPayload;
}
