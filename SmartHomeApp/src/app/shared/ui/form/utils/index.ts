import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {
  ConfigToFormGroupFn,
  FormControlSimpleConfig,
  FormError,
  GetAllFormErrorsFn,
  HandleValueChangeFn
} from '../type';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DestroyRef, WritableSignal} from '@angular/core';
import {map, tap} from 'rxjs';

// !!!!!! YOU NEED TO CALL THIS IN CONSTRUCTOR COMPONENT !!!!!!!!! BECAUSE OF TAKEUNTILDESTROYED
// https://indepth.dev/posts/1518/takeuntildestroy-in-angular-v16
export const handleFormError: HandleValueChangeFn = (form: FormGroup, signal: WritableSignal<FormError[]>, destroyRef?: DestroyRef): void => {
  form.valueChanges
    .pipe(
      // that's mean kill this observer when component is destroyed
      takeUntilDestroyed(destroyRef),
      // transform the value to FormError array
      map(() => getFormValidationErrors(form)),
      // send signal with new errors
      tap((errors: FormError[]) => signal.set(errors)))
    .subscribe();
}

// Adaptations of this code :
// https://gist.github.com/JohannesHoppe/e8d07d63fc345a5fdfdf4fc4989ef2e4
export const getFormValidationErrors: GetAllFormErrorsFn = (form: FormGroup): FormError[] => {
  const result: FormError[] = [];
  Object.keys(form.controls).forEach(key => {

    const controlErrors: ValidationErrors | null = form.get(key)!.errors;
    if (controlErrors) {
      Object.keys(controlErrors).forEach(keyError => {
        result.push({
          control: key,
          error: keyError,
          value: controlErrors[keyError]
        });
      });
    }
  });
  return result;
}

export const getConfigToFormGroup: ConfigToFormGroupFn = (configs:FormControlSimpleConfig[]):FormGroup=>{
  const dynGroup: any = {};
  configs.forEach((config: FormControlSimpleConfig) => {
    dynGroup[config.input] = config.formControl;
  })
 return new FormGroup<any>(dynGroup);
}

export const matchValidator = (matchTo: string,reverse?: boolean) => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.parent && reverse) {
      const c = (control.parent?.controls as any)[matchTo] as AbstractControl;
      if (c) {
        c.updateValueAndValidity();
      }
      return null;
    }
    return !!control.parent &&
    !!control.parent.value &&
    control.value ===
    (control.parent?.controls as any)[matchTo].value
      ? null
      : { matching: true };
  };
}
