"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let isOperational = false;
    if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    // Log error using Winston
    if (statusCode === 500) {
        logger_1.default.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    }
    else {
        logger_1.default.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`);
    }
    // Send JSON response
    res.status(statusCode).json({
        status: 'error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && !isOperational ? { stack: err.stack } : {})
    });
};
exports.errorHandler = errorHandler;
