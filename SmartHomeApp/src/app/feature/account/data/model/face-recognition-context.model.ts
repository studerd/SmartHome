import {signal} from '@angular/core';
import {FaceEmotion} from '../enum/face-emotion.enum';

export interface FaceRecognitionContext{
  yaw:number;
  roll:number;
  pitch:number;
  age:number;
  gender:string;
  expression:FaceEmotion;
}
