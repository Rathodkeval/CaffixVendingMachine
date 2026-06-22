"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMachineStatus = exports.refillMachineInventory = exports.getInventoryByMachine = exports.updateMachineStatus = exports.registerMachine = exports.getMachines = void 0;
const db_1 = require("../config/db");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const getMachines = async (req, res, next) => {
    const db = (0, db_1.getDB)();
    try {
        const machines = await db.all('SELECT * FROM machines');
        res.status(200).json({
            status: 'success',
            data: machines
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMachines = getMachines;
const registerMachine = async (req, res, next) => {
    const { id, machine_name, location } = req.body;
    const db = (0, db_1.getDB)();
    try {
        const existing = await db.get('SELECT id FROM machines WHERE id = ?', [id]);
        if (existing) {
            return next(new errors_1.BadRequestError(`Machine with ID ${id} already registered`));
        }
        const now = new Date().toISOString();
        await db.run('INSERT INTO machines (id, machine_name, location, status, last_seen) VALUES (?, ?, ?, ?, ?)', [id, machine_name, location, 'online', now]);
        // Create default full inventory for this machine
        await db.run('INSERT INTO inventory (machine_id, milk_level, coffee_level, vanilla_level, hazelnut_level, water_level) VALUES (?, 100, 100, 100, 100, 100)', [id]);
        logger_1.default.info(`New machine registered: ${machine_name} (${id})`);
        res.status(201).json({
            status: 'success',
            message: 'Machine and default inventory registered successfully',
            data: { id, machine_name, location, status: 'online', last_seen: now }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerMachine = registerMachine;
const updateMachineStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = (0, db_1.getDB)();
    try {
        const machine = await db.get('SELECT id FROM machines WHERE id = ?', [id]);
        if (!machine) {
            return next(new errors_1.NotFoundError(`Machine with ID ${id} not found`));
        }
        const now = new Date().toISOString();
        await db.run('UPDATE machines SET status = ?, last_seen = ? WHERE id = ?', [status, now, id]);
        logger_1.default.info(`Machine ${id} status updated to ${status}`);
        res.status(200).json({
            status: 'success',
            data: { id, status, last_seen: now }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMachineStatus = updateMachineStatus;
const getInventoryByMachine = async (req, res, next) => {
    const { machine_id } = req.params;
    const db = (0, db_1.getDB)();
    try {
        const inv = await db.get('SELECT * FROM inventory WHERE machine_id = ?', [machine_id]);
        if (!inv) {
            return next(new errors_1.NotFoundError(`Inventory for machine ID ${machine_id} not found`));
        }
        res.status(200).json({
            status: 'success',
            data: inv
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInventoryByMachine = getInventoryByMachine;
const refillMachineInventory = async (req, res, next) => {
    const { machine_id } = req.params;
    const { ingredient } = req.body; // e.g. "milk", "coffee", "water", "vanilla", "hazelnut", "ALL"
    const db = (0, db_1.getDB)();
    try {
        const inv = await db.get('SELECT id FROM inventory WHERE machine_id = ?', [machine_id]);
        if (!inv) {
            return next(new errors_1.NotFoundError(`Inventory for machine ID ${machine_id} not found`));
        }
        if (ingredient === 'ALL') {
            await db.run('UPDATE inventory SET milk_level = 100, coffee_level = 100, vanilla_level = 100, hazelnut_level = 100, water_level = 100 WHERE machine_id = ?', [machine_id]);
        }
        else {
            const field = `${ingredient}_level`;
            // Protect against SQL injection by verifying column whitelist
            const validIngredients = ['milk', 'coffee', 'vanilla', 'hazelnut', 'water'];
            if (!validIngredients.includes(ingredient)) {
                return next(new errors_1.BadRequestError(`Invalid ingredient name: ${ingredient}`));
            }
            await db.run(`UPDATE inventory SET ${field} = 100 WHERE machine_id = ?`, [machine_id]);
        }
        logger_1.default.info(`Refilled ${ingredient} for machine ID ${machine_id}`);
        const updatedInv = await db.get('SELECT * FROM inventory WHERE machine_id = ?', [machine_id]);
        res.status(200).json({
            status: 'success',
            message: `Successfully refilled ${ingredient}`,
            data: updatedInv
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refillMachineInventory = refillMachineInventory;
const getMachineStatus = async (req, res, next) => {
    const db = (0, db_1.getDB)();
    try {
        const machineId = 'CFX-MC-01';
        const machine = await db.get('SELECT * FROM machines WHERE id = ?', [machineId]);
        if (!machine) {
            return next(new errors_1.NotFoundError(`Machine with ID ${machineId} not found`));
        }
        const inventory = await db.get('SELECT * FROM inventory WHERE machine_id = ?', [machineId]);
        if (!inventory) {
            return next(new errors_1.NotFoundError(`Inventory for machine ID ${machineId} not found`));
        }
        res.status(200).json({
            status: 'success',
            data: {
                machine_id: machine.id,
                name: machine.machine_name,
                location: machine.location,
                status: machine.status,
                last_seen: machine.last_seen,
                inventory: {
                    milk: inventory.milk_level,
                    coffee: inventory.coffee_level,
                    vanilla: inventory.vanilla_level,
                    hazelnut: inventory.hazelnut_level,
                    water: inventory.water_level
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMachineStatus = getMachineStatus;
