"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const JWT_SECRET = process.env.JWT_SECRET || 'caffix_vending_secret_key_2026_xyz';
const register = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    const db = (0, db_1.getDB)();
    try {
        // Check if user already exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return next(new errors_1.BadRequestError('A user with this email address already exists'));
        }
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const result = await db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        logger_1.default.info(`User registered successfully: ${email} (${role})`);
        res.status(201).json({
            status: 'success',
            data: {
                id: result.lastID,
                name,
                email,
                role
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    const { email, password } = req.body;
    const db = (0, db_1.getDB)();
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return next(new errors_1.UnauthorizedError('Invalid credentials'));
        }
        const isMatch = bcryptjs_1.default.compareSync(password, user.password);
        if (!isMatch) {
            return next(new errors_1.UnauthorizedError('Invalid credentials'));
        }
        // Sign JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        logger_1.default.info(`User logged in: ${email}`);
        res.status(200).json({
            status: 'success',
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
