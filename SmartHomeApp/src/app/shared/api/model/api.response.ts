import {ApiCodeResponse} from '../enum';

export interface ApiResponse {
  result: boolean;
  code: ApiCodeResponse;
  data: any;
  paramError: boolean;
}
