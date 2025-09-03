import {FormControl, FormGroup} from '@angular/forms';
import {DestroyRef, WritableSignal} from '@angular/core';
export enum FormType{
  CREATE='CREATE',
  UPDATE='UPDATE'
}
export enum InputType{
  TEXT='text',
  PASSWORD='password'
}
export interface FormControlSimpleConfig {
  label: string;
  formControl: FormControl,
  input: string;
  inputType:InputType;
}

export interface FormError {
  control: string;
  value: any;
  error: string;
}
export type HandleValueChangeFn = (form: FormGroup, signal: WritableSignal<FormError[]>, destroyRef?: DestroyRef) => void;
export type GetAllFormErrorsFn = (form: FormGroup) => FormError[];
export type ConfigToFormGroupFn = (config: FormControlSimpleConfig[]) => FormGroup;
