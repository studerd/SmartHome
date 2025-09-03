"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const data_1 = require("../data");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const _common_1 = require("../../common");
let TokenService = TokenService_1 = class TokenService {
    credentialRepository;
    jwtService;
    logger = new common_1.Logger(TokenService_1.name);
    constructor(credentialRepository, jwtService) {
        this.credentialRepository = credentialRepository;
        this.jwtService = jwtService;
    }
    async getTokens(credential) {
        try {
            const payload = { sub: credential.credential_id };
            const token = await this.jwtService.signAsync(payload, {
                secret: _common_1.configManager.getValue(_common_1.ConfigKey.JWT_TOKEN_SECRET),
                expiresIn: _common_1.configManager.getValue(_common_1.ConfigKey.JWT_TOKEN_EXPIRE_IN),
            });
            const refreshToken = await this.jwtService.signAsync(payload, {
                secret: _common_1.configManager.getValue(_common_1.ConfigKey.JWT_REFRESH_TOKEN_SECRET),
                expiresIn: _common_1.configManager.getValue(_common_1.ConfigKey.JWT_REFRESH_TOKEN_EXPIRE_IN),
            });
            return { token, refreshToken, credential };
        }
        catch (e) {
            this.logger.error(e.message);
            throw new data_1.TokenGenerationException();
        }
    }
    async refresh(payload) {
        let id;
        try {
            id = this.jwtService.verify(payload.refresh, {
                secret: _common_1.configManager.getValue(_common_1.ConfigKey.JWT_REFRESH_TOKEN_SECRET),
            }).sub;
        }
        catch (e) {
            this.logger.error(e.message);
            throw new data_1.TokenExpiredException();
        }
        const credential = await this.credentialRepository.findOneBy({ credential_id: id });
        if (!credential) {
            throw new data_1.UserNotFoundException();
        }
        return this.getTokens(credential);
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(data_1.Credential)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], TokenService);
//# sourceMappingURL=token.service.js.map