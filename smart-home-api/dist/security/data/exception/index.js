"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenGenerationException = exports.UserAlreadyExistException = exports.CredentialDeleteException = exports.SignupException = exports.TokenExpiredException = exports.UserNotFoundException = exports.NoTokenFoundedException = void 0;
const _common_1 = require("../../../common");
class NoTokenFoundedException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.NO_TOKEN_FOUNDED, 401);
    }
}
exports.NoTokenFoundedException = NoTokenFoundedException;
class UserNotFoundException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.USER_NOT_FOUND, 200);
    }
}
exports.UserNotFoundException = UserNotFoundException;
class TokenExpiredException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.TOKEN_EXPIRED, 401);
    }
}
exports.TokenExpiredException = TokenExpiredException;
class SignupException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.SIGNUP_ERROR, 200);
    }
}
exports.SignupException = SignupException;
class CredentialDeleteException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.CREDENTIAL_DELETE_ERROR, 200);
    }
}
exports.CredentialDeleteException = CredentialDeleteException;
class UserAlreadyExistException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.USER_ALREADY_EXIST, 200);
    }
}
exports.UserAlreadyExistException = UserAlreadyExistException;
class TokenGenerationException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.TOKEN_GEN_ERROR, 500);
    }
}
exports.TokenGenerationException = TokenGenerationException;
//# sourceMappingURL=index.js.map