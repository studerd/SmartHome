import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './card-header.component.html',
  styleUrls: ['./card-header.component.scss']
})
export class CardHeaderComponent {
  @Input({required: true}) title!: string;
  @Input() params: any ={};
}
