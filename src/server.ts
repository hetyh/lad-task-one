import * as Hapi from '@hapi/hapi';
import * as dotenv from 'dotenv';
import parsePlugin from './plugins/parse.js';
import { parse } from 'qs';

dotenv.config()

const server: Hapi.Server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    query: {
        parser: (query) => parse(query)
    }
});

export async function createServer(): Promise<Hapi.Server> {
    await server.register([
        parsePlugin
    ]);

    await server.initialize();

    return server;
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
    await server.start();
    server.log('info', `Server running on ${server.info.uri}`);
    console.log(`Server running on ${server.info.uri}`);
    return server;
}

process.on('uncaughtException', (err) => {
    console.log(err);
    process.exit(1);
})