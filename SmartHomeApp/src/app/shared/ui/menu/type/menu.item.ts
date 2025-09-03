import {AppNode, AppRoutes} from '@shared';

export interface MenuItem{
  icon?:string;
  label:string;
  link:AppRoutes;
}
