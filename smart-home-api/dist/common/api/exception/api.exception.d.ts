import { HttpException } from '@nestjs/common';
import { ApiCodeResponse } from '../enum/';
export declare class ApiException extends HttpException {
    constructor(code: ApiCodeResponse, status: number);
}
