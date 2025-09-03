import {inject, Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'labelWithParam',
    standalone: true
})
export class LabelWithParamPipe implements PipeTransform {
    readonly translate: TranslateService = inject(TranslateService);

    transform(label: string, params?: Object): string {
        return this.translate.instant(label, params);
    }

}
