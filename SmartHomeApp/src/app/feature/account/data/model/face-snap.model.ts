import {FaceDirection} from '../enum';
import {FaceEmotion} from '../enum/face-emotion.enum';

export interface FaceSnapModel {
  position: FaceDirection;
  emotion: FaceEmotion
  value: any;
}
