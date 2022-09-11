"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.createServer = void 0;
const Hapi = require("@hapi/hapi");
const dotenv_1 = require("dotenv");
const parse_plugin_js_1 = require("./plugins/parse-plugin.js");
const qs_1 = require("qs");
(0, dotenv_1.config)();
const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    query: {
        parser: (query) => (0, qs_1.parse)(query),
    },
});
async function createServer() {
    await server.register([parse_plugin_js_1.default]);
    await server.initialize();
    return server;
}
exports.createServer = createServer;
async function startServer(server) {
    await server.start();
    server.log('info', `Server running on ${server.info.uri}`);
    console.log(`Server running on ${server.info.uri}`);
    return server;
}
exports.startServer = startServer;
process.on('uncaughtException', (err) => {
    console.log(err);
    process.exit(1);
});
