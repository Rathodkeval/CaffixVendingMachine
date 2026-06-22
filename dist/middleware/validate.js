"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
                next(new errors_1.BadRequestError(`Validation failed: ${errorMessages}`));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
