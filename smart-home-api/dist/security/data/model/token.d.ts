import { Credential } from '../entity';
export interface Token {
    token: string;
    refreshToken: string;
    credential: Credential;
}
