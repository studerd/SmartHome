import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {ApiResponse, ApiService, ApiURI} from '@api';
import {Room} from '../data';
import {map, tap} from 'rxjs';
import {RoomBusinessUtil} from '../util/room-business.util';
import {RoomDto} from '../data/model/room.dto';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly api: ApiService = inject(ApiService);
  public rooms$: WritableSignal<Room[]> = signal([]);

  constructor() {
  }

  public list(roomsPlan:Room[]): void {
    this.api.get(ApiURI.GET_ROOMS).pipe(
      map((response: ApiResponse) =>
        response.result ?
          response.data.map((dto: RoomDto) => RoomBusinessUtil.associate(roomsPlan,RoomBusinessUtil.fromDto(dto)))
          : []),
      tap((room: Room[]) => this.rooms$.set(room))
    ).subscribe();
  }
}
