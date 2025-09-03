import {ApiCodeResponse} from '../enum/api-code.response';

export interface ApiResponse {
  result: boolean;
  code: ApiCodeResponse;
  data: any;
  paramError: boolean;
}
