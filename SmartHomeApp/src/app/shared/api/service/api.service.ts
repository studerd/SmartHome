import {inject, Injectable} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {ApiResponse} from '../model';
import {Payload} from '../../core/type';
import {ApiURI} from '../enum';
import {ToastService} from '../../core/service/toast.service';
import {ToastType} from '@core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseURL: string = environment.apiURL;
  private readonly paramIsMissingErrorCode: number = environment.PARAM_IS_MISSING;

  //dependency
  private readonly toastService: ToastService = inject(ToastService);
  private readonly http: HttpClient = inject(HttpClient);

  get(partURL: string): Observable<ApiResponse> {
    return this.handle(this.http.get(`${this.baseURL}${partURL}`));
  }

  getWithURL(partURL: string): Observable<ApiResponse> {
    return this.handle(this.http.get(partURL));
  }

  post(partURL: string, payload: Payload, needToast: boolean = false): Observable<ApiResponse> {
    return this.handle(this.http.post(`${this.baseURL}${partURL}`, payload), needToast);
  }

  put(partURL: ApiURI, payload: Payload, needToast: boolean = false): Observable<ApiResponse> {
    return this.handle(this.http.put(`${this.baseURL}${partURL}`, payload), needToast);
  }

  delete(partURL: string, needToast: boolean = false): Observable<ApiResponse> {
    return this.handle(this.http.delete(`${this.baseURL}${partURL}`), needToast);
  }

  private handle(obs: Observable<any>, needToast: boolean = false): Observable<ApiResponse> {
    return obs.pipe(
      map((response: Object) => this.successHandler(response)),
      tap((response: ApiResponse) => this.showToaster(response, needToast)),
      catchError((error: HttpErrorResponse) => of(this.errorHandler(error))));
  }

  private errorHandler(httpError: HttpErrorResponse): ApiResponse {
    return {...httpError.error, paramError: (httpError.status === this.paramIsMissingErrorCode)}
  }

  private successHandler(response: Object): ApiResponse {
    return {...response as ApiResponse, paramError: false}
  }

  private showToaster(response: ApiResponse, needToast: boolean): void {
    if (needToast) {
      this.toastService.addToast(response.result ? ToastType.SUCCESS : ToastType.ERROR, response.code, 8000, []);
    }

  }
}
