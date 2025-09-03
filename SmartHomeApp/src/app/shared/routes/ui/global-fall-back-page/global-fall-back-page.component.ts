import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-global-fall-back-page',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './global-fall-back-page.component.html',
  styleUrls: ['./global-fall-back-page.component.scss']
})
export class GlobalFallBackPageComponent {

}
