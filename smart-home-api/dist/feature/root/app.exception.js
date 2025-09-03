"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestException = void 0;
const _common_1 = require("../../common");
class TestException extends _common_1.ApiException {
    constructor() {
        super(_common_1.ApiCodeResponse.COMMON, 200);
    }
}
exports.TestException = TestException;
//# sourceMappingURL=app.exception.js.map