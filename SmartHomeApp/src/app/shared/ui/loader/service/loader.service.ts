import {Injectable, signal, WritableSignal} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    showLoader$: WritableSignal<boolean> = signal(false);
    text$: WritableSignal<string> = signal('common.loader.message');

    constructor() {
    }
}
