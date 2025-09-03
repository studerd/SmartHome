import { Credential, RefreshPayload, SignInPayload, SignUpPayload, Token } from '../data';
import { Repository } from 'typeorm';
import { TokenService } from './token.service';
export declare class SecurityService {
    private readonly repository;
    private readonly tokenService;
    constructor(repository: Repository<Credential>, tokenService: TokenService);
    detail(id: string): Promise<Credential>;
    signIn(payload: SignInPayload): Promise<Token>;
    signup(payload: SignUpPayload): Promise<Credential>;
    refresh(payload: RefreshPayload): Promise<Token | null>;
    delete(id: any): Promise<void>;
}
