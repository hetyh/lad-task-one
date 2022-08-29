import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import { parseDocument } from 'htmlparser2';
import { innerText } from 'domutils';
import fetch from 'node-fetch';
import { uniq, words, lowerCase } from 'lodash';
import pdfCreate from '../pdf-create.js'

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
                        sites: Joi.array().items(Joi.string().required().pattern(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/m)),
                    })
                }
            }
        })
    }
}

async function sitesParse(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
        const sites: Array<string> = request.query.sites;
        let sitesWordsArray:
        {
            siteName: string,
            wordsTop: string[]
        }[] = [];
        for await (let site of sites) {

            // If URL does not contain http(s)://, add it 
            if (!site.includes('http')) {
                site = 'https://'.concat(site)
            }

            const fetchResponse = await fetch(site);

            const fetchHtml = await fetchResponse.text();

            // Finds tag <body> in fetched HTML
            const bodyOpenIndex = fetchHtml.indexOf('body') - 1;
            const bodyCloseIndex = fetchHtml.lastIndexOf('body') + 5;
            // If not present, throws an error
            if (bodyOpenIndex === -1 || bodyCloseIndex === -1) {
                throw 'Tag <body> is missing or incomplete';
            }
            // Slices it in a new string
            const bodyText = fetchHtml.slice(bodyOpenIndex, bodyCloseIndex);

            // Parses tag <body>
            const body = parseDocument(bodyText);
            // Extracts an array of words from it
            const siteWordsArray = uniq(words(lowerCase(innerText(body.children[0])), /[^ \n\r\t]{4,}/g));
            siteWordsArray.splice(3);

            sitesWordsArray.push({
                siteName: site,
                wordsTop: siteWordsArray,
            });
        }
        console.log(sitesWordsArray);
        const pdfResult = await pdfCreate(sitesWordsArray);
        return h.response(pdfResult).code(200).encoding('base64').type('application/pdf').header('Content-Disposition', 'inline; filename="result.pdf"');
    } catch (err) {
        console.error(err);
        process.exit(1)
    }
}

export default parsePlugin;