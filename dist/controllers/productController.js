"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductPrice = exports.createProduct = exports.getProducts = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const getProducts = async (req, res, next) => {
    const db = (0, db_1.getDB)();
    try {
        const products = await db.all('SELECT * FROM products');
        res.status(200).json({
            status: 'success',
            data: products
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res, next) => {
    const { name, price, description, image } = req.body;
    const db = (0, db_1.getDB)();
    try {
        const result = await db.run('INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)', [name, price, description, image || '/assets/classic_coffee.png']);
        logger_1.default.info(`New product created: ${name} (₹${price})`);
        res.status(201).json({
            status: 'success',
            data: {
                id: result.lastID,
                name,
                price,
                description,
                image
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const updateProductPrice = async (req, res, next) => {
    const idStr = String(req.params.id);
    const { price } = req.body;
    const db = (0, db_1.getDB)();
    try {
        const product = await db.get('SELECT id FROM products WHERE id = ?', [idStr]);
        if (!product) {
            return next(new errors_1.NotFoundError(`Product with ID ${idStr} not found`));
        }
        await db.run('UPDATE products SET price = ? WHERE id = ?', [price, idStr]);
        logger_1.default.info(`Product ID ${idStr} price updated to ₹${price}`);
        res.status(200).json({
            status: 'success',
            message: 'Product price updated successfully',
            data: { id: parseInt(idStr, 10), price }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProductPrice = updateProductPrice;
