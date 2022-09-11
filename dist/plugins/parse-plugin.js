"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = require("@hapi/boom");
const Joi = require("joi");
const htmlparser2_1 = require("htmlparser2");
const domutils_1 = require("domutils");
const lodash_1 = require("lodash");
const pdf_create_js_1 = require("../pdf-create.js");
const parsePlugin = {
    name: 'app/parse',
    register: async (server) => {
        server.route({
            method: 'GET',
            path: '/api/parse',
            handler: sitesParse,
            options: {
                validate: {
                    query: Joi.object({
                        sites: Joi.array().required().items(Joi.string().required().uri()),
                    }),
                },
            },
        });
    },
};
async function sitesParse(request, h) {
    // Fetches the site and returns response in text form.
    // Returns an Boom object if fetch is failed or if URL hasn't specified HTTP(S) protocol.
    async function siteFetch(siteURL) {
        // If protocol is not HTTP(s), returns an Boom object
        if (!siteURL.protocol.match(/https?:/)) {
            return (0, boom_1.badRequest)(`Site ${siteURL.toString()} has an invalid protocol`);
        }
        try {
            const fetchResponse = await fetch(siteURL.origin + siteURL.pathname);
            const fetchText = await fetchResponse.text();
            return fetchText;
        }
        catch (error) {
            console.error(error);
            return (0, boom_1.badGateway)(`Site ${siteURL.toString()} is not responding properly`);
        }
    }
    try {
        const sites = request.query.sites;
        let sitesWordsArray = [];
        for (let site of sites) {
            site = new URL(site);
            const fetchResponse = await siteFetch(site);
            if ((0, boom_1.isBoom)(fetchResponse)) {
                return h
                    .response(JSON.parse(`{
                "error":"${fetchResponse.output.payload.error}",
                "message":"${fetchResponse.message}",
                "statusCode":"${fetchResponse.output.statusCode}"
              }`))
                    .code(fetchResponse.output.statusCode);
            }
            // Finds tag <body> in fetched HTML
            const bodyOpenIndex = fetchResponse.indexOf('<body');
            const bodyCloseIndex = fetchResponse.lastIndexOf('body>') + 5;
            // If not present, logs an error, discards site and moves to next one
            if (bodyOpenIndex === -1 || bodyCloseIndex === -1) {
                console.error(`${site}: tag <body> is missing or incomplete`);
                sitesWordsArray.push({
                    siteName: site.toString(),
                    wordsTop: ["Site's structure is broken", '-', '-'],
                });
                continue;
            }
            // Slices it in a new string
            const bodyText = fetchResponse.slice(bodyOpenIndex, bodyCloseIndex);
            // Parses tag <body>
            const body = (0, htmlparser2_1.parseDocument)(bodyText);
            // Extracts an array of words from it
            const siteWordsArray = (0, lodash_1.uniq)((0, lodash_1.words)((0, lodash_1.lowerCase)((0, domutils_1.innerText)(body.children[0])), /[^ \n\r\t]{4,}/g));
            siteWordsArray.splice(3);
            sitesWordsArray.push({
                siteName: site.toString(),
                wordsTop: siteWordsArray,
            });
        }
        const pdfResult = await (0, pdf_create_js_1.default)(sitesWordsArray);
        return h
            .response(pdfResult)
            .code(200)
            .encoding('base64')
            .type('application/pdf')
            .header('Content-Disposition', 'inline; filename="result.pdf"');
    }
    catch (err) {
        console.error(err);
    }
}
exports.default = parsePlugin;
