import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LoaderService} from '../../service';
import {TranslateModule} from '@ngx-translate/core';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
    readonly loaderService: LoaderService = inject(LoaderService);
}
