import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

@Component({
    selector: 'app-floating-label-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './floating-label-input.component.html',
    styleUrls: ['./floating-label-input.component.scss']
})
export class FloatingLabelInputComponent {
    @Input({required: true}) label!: string;
    @Input({required: true}) control!: FormControl<any>;
    @Input() type: string = 'text';
    @Input() css:string='';
    inputFocus: boolean = false;
}
