import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly adapterHost;
    constructor(adapterHost: HttpAdapterHost);
    catch(exception: HttpException, host: ArgumentsHost): void;
}
