"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRazorpayWebhook = exports.verifyPaymentSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const orderController_1 = require("./orderController");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const getSecrets = () => ({
    razorpayKeySecret: (process.env.RAZORPAY_KEY_SECRET || 'mockSecret987654321').trim(),
    webhookSecret: (process.env.RAZORPAY_WEBHOOK_SECRET || 'mockWebhookSecret112233').trim()
});
const verifyPaymentSignature = async (req, res, next) => {
    const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const db = (0, db_1.getDB)();
    const { razorpayKeySecret } = getSecrets();
    try {
        // 1. Check if the order exists locally
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            return next(new errors_1.NotFoundError(`Local order ID ${order_id} not found`));
        }
        // 2. Perform verification
        const isMockOrder = razorpay_order_id.startsWith('order_mock_') || razorpayKeySecret.includes('mock');
        if (isMockOrder) {
            logger_1.default.info(`Verifying mock Razorpay signature for order ${order_id}`);
        }
        else {
            // Cryptographic signature check for production
            const text = razorpay_order_id + '|' + razorpay_payment_id;
            const generated_signature = crypto_1.default
                .createHmac('sha256', razorpayKeySecret)
                .update(text)
                .digest('hex');
            if (generated_signature !== razorpay_signature) {
                logger_1.default.warn(`Signature verification failed for order ${order_id}`);
                return next(new errors_1.BadRequestError('Cryptographic payment signature mismatch'));
            }
        }
        // 3. Update order in SQLite to store Razorpay tokens
        await db.run(`UPDATE orders SET 
        razorpay_payment_id = ?, 
        razorpay_signature = ?
       WHERE id = ?`, [razorpay_payment_id, razorpay_signature, order_id]);
        // 4. Update status to PAID (which triggers db-level ingredient deductions)
        const updatedOrder = await (0, orderController_1.executeOrderStatusUpdate)(order_id, 'PAID');
        logger_1.default.info(`Successfully verified payment for order ${order_id}. Marked as PAID.`);
        res.status(200).json({
            status: 'success',
            data: updatedOrder
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyPaymentSignature = verifyPaymentSignature;
const handleRazorpayWebhook = async (req, res, next) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = JSON.stringify(req.body);
    const db = (0, db_1.getDB)();
    const { webhookSecret } = getSecrets();
    try {
        const isMockWebhook = !signature || signature === 'mock' || webhookSecret.includes('mock');
        if (!isMockWebhook) {
            // Validate webhook authenticity
            const expectedSignature = crypto_1.default
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            if (expectedSignature !== signature) {
                logger_1.default.warn('Razorpay webhook signature verification failed');
                res.status(400).json({ status: 'error', message: 'Webhook signature verification failed' });
                return;
            }
        }
        // Process event
        const event = req.body.event;
        logger_1.default.info(`Processing Razorpay webhook event: ${event}`);
        if (event === 'order.paid' || event === 'payment.captured') {
            const payload = req.body.payload;
            const paymentEntity = payload.payment ? payload.payment.entity : null;
            const rpOrderId = paymentEntity ? paymentEntity.order_id : null;
            const rpPaymentId = paymentEntity ? paymentEntity.id : null;
            const rpSignature = signature || 'webhook_signature';
            if (rpOrderId) {
                // Find matching local order by razorpay_order_id
                const order = await db.get('SELECT * FROM orders WHERE razorpay_order_id = ?', [rpOrderId]);
                if (order) {
                    if (order.status === 'PENDING') {
                        await db.run(`UPDATE orders SET 
                razorpay_payment_id = ?, 
                razorpay_signature = ?
               WHERE id = ?`, [rpPaymentId, rpSignature, order.id]);
                        await (0, orderController_1.executeOrderStatusUpdate)(order.id, 'PAID');
                        logger_1.default.info(`Webhook updated order ${order.id} status to PAID`);
                    }
                    else {
                        logger_1.default.info(`Order ${order.id} status is already ${order.status}. Webhook bypass.`);
                    }
                }
                else {
                    logger_1.default.warn(`No local order found for Razorpay order ID ${rpOrderId}`);
                }
            }
        }
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        next(error);
    }
};
exports.handleRazorpayWebhook = handleRazorpayWebhook;
