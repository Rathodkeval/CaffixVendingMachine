"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const JWT_SECRET = process.env.JWT_SECRET || 'caffix_vending_secret_key_2026_xyz';
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errors_1.UnauthorizedError('Missing or invalid Authorization header'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new errors_1.UnauthorizedError('Authentication token is invalid or expired'));
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('User authentication details not found'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError('You do not have access permission for this resource'));
        }
        next();
    };
};
exports.requireRole = requireRole;
