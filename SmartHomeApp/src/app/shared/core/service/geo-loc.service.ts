import {effect, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {ApiService} from '@api';
import {LatLong} from '../type';
import {isNil} from 'lodash';

@Injectable({
    providedIn: 'root'
})
export class GeoLocService {
    latLong$: WritableSignal<LatLong> = signal({lat: 0, long: 0});
    town$: WritableSignal<string> = signal('');
    private readonly api: ApiService = inject(ApiService);
    private readonly latLongHandler = effect(() => this.getTown(this.latLong$()), {allowSignalWrites: true})

    getLocalisationLatLong(): void {
        if ('geolocation' in navigator) {

            navigator.geolocation.getCurrentPosition((position: GeolocationPosition): void => {
                this.latLong$.set({lat: position.coords.latitude, long: position.coords.longitude});
            });
        }
    }

    getTown(latLong: LatLong): void {
        this.api.getWithURL(`https://geocode.maps.co/reverse?lat=${latLong.lat}&lon=${latLong.long}&api_key=658ae4b1870f5884795065cgm77713c`).subscribe((result: any) => {
            if (!isNil(result.address.country)) {
                this.town$.set(result.address.country);
            }
        })
    }

    setTown(value: string) {
        this.town$.set(value);

    }
}
