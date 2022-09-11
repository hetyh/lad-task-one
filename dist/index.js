"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
(0, server_js_1.createServer)()
    .then(server_js_1.startServer)
    .catch((err) => {
    console.log(err);
});
