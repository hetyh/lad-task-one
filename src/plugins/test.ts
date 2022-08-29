import * as Hapi from '@hapi/hapi';
import pdfCreate from '../pdf-create.js';

const testPlugin = {
    name: 'app/test',
    register: async function (server: Hapi.Server) {
        server.route({
            method: 'GET',
            path: '/',
            handler: async function (request, h, response) {
                try {
                    const sitesTest = [
                        {
                            siteName: 'https://ya.ru',
                            wordsTop: ['поиск', 'почта', 'яндекс'],
                        },
                        {
                            siteName: 'https://nntc.nnov.ru',
                            wordsTop: ['нртк', 'колледж', 'обучение']
                        },
                    ]
                    const pdfResult = await pdfCreate(sitesTest);

                    return h
                        .response(pdfResult)
                        .code(200)
                        .type('application/pdf')
                        .encoding('base64')
                        .header('Content-Disposition', 'inline; filename="result.pdf"')
                } catch (err) {
                    console.log(err);
                    process.exit(1);
                }
            }
        });
    }
}

export default testPlugin;