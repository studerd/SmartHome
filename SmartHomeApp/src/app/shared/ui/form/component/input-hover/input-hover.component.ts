import {Component, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

@Component({
  selector: 'app-input-hover',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './input-hover.component.html',
  styleUrls: ['./input-hover.component.scss']
})
export class InputHoverComponent {
  @Input({required: true}) label!: string;
  @Input({required: true}) control!: FormControl<any>;
  @Input() type: string = 'text';
  @Input() readonly: boolean = false;
  @Input() css:string = 'floating-input';
  inputFocus: boolean = false;
}
