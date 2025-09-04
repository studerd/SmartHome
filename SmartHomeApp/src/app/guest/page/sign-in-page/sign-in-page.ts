import {Component, effect, signal, WritableSignal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {SignInPin} from '../../data';
import {SignInUtil} from '../../util';

@Component({
  selector: 'app-sign-in-page',
  imports: [
    TranslatePipe
  ],
  templateUrl: './sign-in-page.html',
  standalone: true,
  styleUrl: './sign-in-page.scss'
})
export class SignInPage {
  pins$: WritableSignal<SignInPin[]> = signal(SignInUtil.genPins());
  readonly alphabets: string[] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
  ];
  readonly numbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  private pinsEffect$ = effect(() => {
    if(SignInUtil.findLastOccupiedIndex(this.pins$()) === 5){
      console.log('on doit signin');
    }
  });
  constructor() {
  }

  addToPin(char: string): void {
    this.pins$.set(SignInUtil.addNewValue(this.pins$(), char));
  }
}
