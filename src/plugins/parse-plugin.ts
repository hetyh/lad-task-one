import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import { parseDocument } from 'htmlparser2';
import { innerText } from 'domutils';
import { uniq, words, lowerCase } from 'lodash';
import pdfCreate from '../pdf-create.js';
import { resolve } from 'dns/promises';

const parsePlugin = {
    name: 'app/parse',
    register: async (server: Hapi.Server) => {
        server.route({
            method: 'GET',
            path: '/api/parse',
            handler: sitesParse,
            options: {
                validate: {
                    query: Joi.object({
                        sites: Joi.array().required().items(Joi.string().required().uri()),
                    })
                }
            }
        })
    }
}

async function dnsResolve(site: string): Promise<boolean> {
    try {
        const resolveResult = await resolve(site);
        if (resolveResult) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error(error)
        return false;
    }
}

async function sitesParse(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
        const sites: Array<URL> = request.query.sites;
        let sitesWordsArray:
            {
                siteName: string,
                wordsTop: string[]
            }[] = [];
        for (let site of sites) {
            site = new URL(site);
            // Check №1
            // If DNS resolve failed, discards site and moves to next one
            if (! await dnsResolve(site.hostname)) {
                sitesWordsArray.push({
                    siteName: site.toString(),
                    wordsTop: ['Site does not exist','-','-'],
                });
                continue;
            }
            // Check №2
            // If protocol is not HTTP(s), discards site and moves to next one
            if (! site.protocol.match(/https?:/)) {
                sitesWordsArray.push({
                    siteName: site.toString(),
                    wordsTop: ['Protocol is not supported','-','-'],
                });
                continue;
            }
            const fetchResponse = await fetch(site.origin + site.pathname);
            const fetchHtml = await fetchResponse.text();

            // Finds tag <body> in fetched HTML
            const bodyOpenIndex = fetchHtml.indexOf('<body');
            const bodyCloseIndex = fetchHtml.lastIndexOf('body>') + 5;
            // If not present, logs an error, discards site and moves to next one
            if (bodyOpenIndex === -1 || bodyCloseIndex === -1) {
                console.error(`${site}: tag <body> is missing or incomplete`);
                sitesWordsArray.push({
                    siteName: site.toString(),
                    wordsTop: ['Site\'s structure is broken','-','-'],
                });
                continue;
            }
            // Slices it in a new string
            const bodyText = fetchHtml.slice(bodyOpenIndex, bodyCloseIndex);
            // Parses tag <body>
            const body = parseDocument(bodyText);
            // Extracts an array of words from it
            const siteWordsArray = uniq(words(lowerCase(innerText(body.children[0])), /[^ \n\r\t]{4,}/g));
            siteWordsArray.splice(3);

            sitesWordsArray.push({
                siteName: site.toString(),
                wordsTop: siteWordsArray,
            });
        }
        const pdfResult = await pdfCreate(sitesWordsArray);
        return h.response(pdfResult)
            .code(200)
            .encoding('base64')
            .type('application/pdf')
            .header('Content-Disposition', 'inline; filename="result.pdf"');
    } catch (err) {
        console.error(err);
    }
}

export default parsePlugin;