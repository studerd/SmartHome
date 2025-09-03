import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import {LabelWithParamDirective} from '../../text';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-simple-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './simple-button.component.html',
  styleUrls: ['./simple-button.component.scss']
})
export class SimpleButtonComponent {
  @Input() title:string='click.me';
  @Input() params:any = {};
  @Output()onClick: EventEmitter<void> = new EventEmitter<void>();
}
