"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logFormat = winston_1.default.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }), logFormat),
    transports: [
        // Output error logs to separate file
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, '../../logs/error.log'),
            level: 'error'
        }),
        // Output combined logs to combined file
        new winston_1.default.transports.File({
            filename: path_1.default.join(__dirname, '../../logs/combined.log')
        })
    ]
});
// If not in production, also print to the console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), logFormat)
    }));
}
exports.default = logger;
