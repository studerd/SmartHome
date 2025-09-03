import { SecurityService } from './service';
import { Credential, RefreshPayload, SignInPayload, SignUpPayload } from './data';
export declare class SecurityController {
    private readonly service;
    constructor(service: SecurityService);
    signIn(payload: SignInPayload): Promise<import("./data").Token>;
    signUp(payload: SignUpPayload): Promise<Credential>;
    refresh(payload: RefreshPayload): Promise<import("./data").Token | null>;
    me(user: Credential): Credential;
    delete(id: string): Promise<void>;
}
