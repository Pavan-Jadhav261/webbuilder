"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = async (req, res, next) => {
    const token = req.headers["token"];
    const decode = jsonwebtoken_1.default.verify(token, "antigravity");
    if (decode) {
        req.userId = decode.userId;
        next();
    }
    else {
        res.json({
            msg: "you are not authorized",
        });
    }
};
exports.auth = auth;
//# sourceMappingURL=middleware.js.map