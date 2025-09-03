import { Credential, Token } from '../data';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RefreshPayload } from '../data/payload/refresh.payload';
export declare class TokenService {
    private readonly credentialRepository;
    private jwtService;
    private readonly logger;
    constructor(credentialRepository: Repository<Credential>, jwtService: JwtService);
    getTokens(credential: Credential): Promise<Token>;
    refresh(payload: RefreshPayload): Promise<Token>;
}
