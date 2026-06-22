"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const machineController_1 = require("../controllers/machineController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerMachineSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.string().min(3, 'Machine ID is required (min 3 chars)'),
        machine_name: zod_1.z.string().min(2, 'Machine name must be at least 2 chars'),
        location: zod_1.z.string().min(2, 'Location is required')
    })
});
const updateStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['online', 'offline', 'maintenance'])
    })
});
const refillSchema = zod_1.z.object({
    params: zod_1.z.object({
        machine_id: zod_1.z.string()
    }),
    body: zod_1.z.object({
        ingredient: zod_1.z.enum(['milk', 'coffee', 'vanilla', 'hazelnut', 'water', 'ALL'])
    })
});
router.get('/', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), machineController_1.getMachines);
router.post('/register', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), (0, validate_1.validateRequest)(registerMachineSchema), machineController_1.registerMachine);
router.patch('/:id/status', auth_1.authenticateJWT, (0, validate_1.validateRequest)(updateStatusSchema), machineController_1.updateMachineStatus);
router.get('/:machine_id/inventory', auth_1.authenticateJWT, machineController_1.getInventoryByMachine);
router.post('/:machine_id/refill', auth_1.authenticateJWT, (0, auth_1.requireRole)(['admin']), (0, validate_1.validateRequest)(refillSchema), machineController_1.refillMachineInventory);
exports.default = router;
