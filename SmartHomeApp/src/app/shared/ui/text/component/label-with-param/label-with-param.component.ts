import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-label-with-param',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './label-with-param.component.html',
  styleUrls: ['./label-with-param.component.scss']
})
export class LabelWithParamComponent {
  @Input({required: true}) label!: string;
  @Input() params?: any;
}
