import { ApiException , ApiCodeResponse } from '@common';


export class TestException extends ApiException {
  constructor() {
    super(ApiCodeResponse.COMMON, 200);
  }
}