import {environment} from '../../../environments/environment';
import {Token} from '@api';
import {EffectRef, Injectable, signal, WritableSignal} from '@angular/core';
import {isNil} from 'lodash';

const effect = (param: () => void) => {
  return undefined;
};

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  token$: WritableSignal<Token> = signal(this.getToken());

  constructor() {
    effect(() => {
      this.handleTokenChange(this.token$());
    });
  }

  public logOut(): void {
    this.setToken({isEmpty: true, token: '', refreshToken: ''});
  }

  public setToken(token: Token): void {
    if (!token.isEmpty) {
      this.token$.set(token);
    } else {
      this.token$.set(this.getEmpty());
      localStorage.removeItem(environment.TOKEN_KEY);
    }
  }

  private handleTokenChange(token: Token): void {
    if (!token.isEmpty) {
      localStorage.setItem(environment.TOKEN_KEY, JSON.stringify(token));
    } else {
      localStorage.removeItem(environment.TOKEN_KEY);
    }
  }

  private getToken(): Token {
    const str = localStorage.getItem(environment.TOKEN_KEY);
    return !isNil(str) ? JSON.parse(str) as Token : this.getEmpty();
  }

  private getEmpty(): Token {
    return {token: '', refreshToken: '', isEmpty: true};
  }
}
