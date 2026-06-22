"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Product name must be at least 2 characters'),
        price: zod_1.z.number().int().positive('Price must be a positive integer'),
        description: zod_1.z.string().optional(),
        image: zod_1.z.string().optional()
    })
});
const updatePriceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string()
    }),
    body: zod_1.z.object({
        price: zod_1.z.number().int().positive('Price must be a positive integer')
    })
});
router.get('/', productController_1.getProducts);
router.post('/', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), (0, validate_1.validateRequest)(createProductSchema), productController_1.createProduct);
router.put('/:id/price', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), (0, validate_1.validateRequest)(updatePriceSchema), productController_1.updateProductPrice);
exports.default = router;
