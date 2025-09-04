import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ApiCodeResponse, ApiResponse} from '@api';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {

  signInFace(descriptor: number[]): Observable<ApiResponse> {
    console.log('je passe ici', descriptor)
    return of({
      result: true,
      code: ApiCodeResponse.TEST,
      data: '',
      paramError: false
    })
  }
}
