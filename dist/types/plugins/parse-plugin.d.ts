import { Server } from '@hapi/hapi';
declare const parsePlugin: {
    name: string;
    register: (server: Server) => Promise<void>;
};
export default parsePlugin;
