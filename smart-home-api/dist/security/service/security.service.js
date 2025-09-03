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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const data_1 = require("../data");
const typeorm_2 = require("typeorm");
const token_service_1 = require("./token.service");
const lodash_1 = require("lodash");
const _common_1 = require("../../common");
const builder_pattern_1 = require("builder-pattern");
let SecurityService = class SecurityService {
    repository;
    tokenService;
    constructor(repository, tokenService) {
        this.repository = repository;
        this.tokenService = tokenService;
    }
    async detail(id) {
        const result = await this.repository.findOneBy({ credential_id: id });
        if (!((0, lodash_1.isNil)(result))) {
            return result;
        }
        throw new data_1.UserNotFoundException();
    }
    async signIn(payload) {
        let result = await this.repository.findOneBy({ username: payload.username });
        if (!(0, lodash_1.isNil)(result) && await (0, _common_1.comparePassword)(payload.password, result.password)) {
            return this.tokenService.getTokens(result);
        }
        throw new data_1.UserNotFoundException();
    }
    async signup(payload) {
        const result = await this.repository.findOneBy({ username: payload.username });
        if (!(0, lodash_1.isNil)(result)) {
            throw new data_1.UserAlreadyExistException();
        }
        try {
            const encryptedPassword = await (0, _common_1.encryptPassword)(payload.password);
            const newCredential = (0, builder_pattern_1.Builder)()
                .username(payload.username)
                .password(encryptedPassword)
                .mail(payload.mail).build();
            return this.repository.save(newCredential);
        }
        catch (e) {
            throw new data_1.SignupException();
        }
    }
    async refresh(payload) {
        return this.tokenService.refresh(payload);
    }
    async delete(id) {
        try {
            const detail = await this.detail(id);
            await this.repository.remove(detail);
        }
        catch (e) {
            throw new data_1.CredentialDeleteException();
        }
    }
};
exports.SecurityService = SecurityService;
exports.SecurityService = SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(data_1.Credential)),
    __metadata("design:paramtypes", [typeorm_2.Repository, token_service_1.TokenService])
], SecurityService);
//# sourceMappingURL=security.service.js.map