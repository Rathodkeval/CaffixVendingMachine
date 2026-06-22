"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const yamljs_1 = __importDefault(require("yamljs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Load environment variables
dotenv_1.default.config();
const db_1 = require("./config/db");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS and JSON parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Custom request logging middleware
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.originalUrl}`);
    next();
});
// Load and mount Swagger documentation
try {
    const swaggerDocument = yamljs_1.default.load(path_1.default.resolve(__dirname, '../swagger.yaml'));
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
    logger_1.default.info('Swagger API docs mounted on /api-docs');
}
catch (error) {
    logger_1.default.error('Failed to load Swagger YAML definition file:', error);
}
// Mount REST API routes
app.use('/api', routes_1.default);
app.use('/', routes_1.default);
// Root route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to CAFFIX Vending REST API Server',
        docs: '/api-docs',
        env: process.env.NODE_ENV
    });
});
// Central Error Handler (must be registered last)
app.use(errorHandler_1.errorHandler);
// Bootstrap Server
async function startServer() {
    try {
        await (0, db_1.initDB)();
        logger_1.default.info('SQLite database schema parsed and seeded successfully');
        app.listen(PORT, () => {
            logger_1.default.info(`CAFFIX Vending server running on http://localhost:${PORT}`);
            logger_1.default.info(`Swagger interactive docs: http://localhost:${PORT}/api-docs`);
        });
    }
    catch (error) {
        logger_1.default.error('Server failed to bootstrap:', error);
        process.exit(1);
    }
}
startServer();
