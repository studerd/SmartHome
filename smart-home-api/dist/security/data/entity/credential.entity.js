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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = void 0;
const typeorm_1 = require("typeorm");
const ulid_1 = require("ulid");
let Credential = class Credential {
    credential_id;
    username;
    password;
    mail;
    isAdmin;
    active;
    created;
    updated;
    generateId() {
        if (!this.credential_id) {
            this.credential_id = (0, ulid_1.ulid)();
        }
    }
};
exports.Credential = Credential;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar', { length: 26 }),
    __metadata("design:type", String)
], Credential.prototype, "credential_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, unique: true }),
    __metadata("design:type", String)
], Credential.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Credential.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, unique: true }),
    __metadata("design:type", String)
], Credential.prototype, "mail", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Credential.prototype, "isAdmin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Credential.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Credential.prototype, "created", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Credential.prototype, "updated", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Credential.prototype, "generateId", null);
exports.Credential = Credential = __decorate([
    (0, typeorm_1.Entity)()
], Credential);
//# sourceMappingURL=credential.entity.js.map