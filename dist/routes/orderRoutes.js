"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        product_id: zod_1.z.number().int().positive('Product ID must be a positive integer'),
        amount: zod_1.z.number().int().positive('Amount must be a positive integer').optional(),
        machine_id: zod_1.z.string().min(3, 'Machine ID is required')
    })
});
const updateStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'PAID', 'PREPARING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    })
});
router.post('/create', auth_1.authenticateJWT, (0, validate_1.validateRequest)(createOrderSchema), orderController_1.createOrder);
router.get('/', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), orderController_1.getOrders);
router.get('/:id', auth_1.authenticateJWT, orderController_1.getOrderById);
router.put('/:id/status', auth_1.authenticateJWT, (0, validate_1.validateRequest)(updateStatusSchema), orderController_1.updateOrderStatus);
exports.default = router;
