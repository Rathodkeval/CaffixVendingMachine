"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/verify', auth_1.authenticateJWT, paymentController_1.verifyPaymentSignature);
router.post('/webhook', paymentController_1.handleRazorpayWebhook);
exports.default = router;
