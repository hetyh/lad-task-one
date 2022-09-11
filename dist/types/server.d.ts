import * as Hapi from '@hapi/hapi';
export declare function createServer(): Promise<Hapi.Server>;
export declare function startServer(server: Hapi.Server): Promise<Hapi.Server>;
