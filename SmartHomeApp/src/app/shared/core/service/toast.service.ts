import {Injectable, signal, WritableSignal} from '@angular/core';
import {Toast, ToastAction, ToastType} from '@core';
import {ulid} from 'ulid';


@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toast$: WritableSignal<Toast[]> = signal([]);

  addToast(type: ToastType, body: string, delay: number, actions: ToastAction[]) {
    const toasts: Toast[] = this.toast$();
    toasts.push({id:ulid(), type, body, delay, actions});
    this.toast$.set(toasts)
  }

  remove(id: string) {
    this.toast$.set(this.toast$().filter( t => t.id !== id));
  }
}
