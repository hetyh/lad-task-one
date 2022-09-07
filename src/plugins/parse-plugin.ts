import { Server, Request, ResponseToolkit } from '@hapi/hapi';
import { badGateway, badRequest, Boom, expectationFailed, isBoom } from '@hapi/boom';
import * as Joi from 'joi';
import { parseDocument } from 'htmlparser2';
import { innerText } from 'domutils';
import { uniq, words, lowerCase } from 'lodash';
import pdfCreate from '../pdf-create.js';

const parsePlugin = {
  name: 'app/parse',
  register: async (server: Server) => {
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

async function sitesParse(request: Request, h: ResponseToolkit) {
  // Fetches the site and returns response in text form.
  // Returns an Boom object if fetch is failed or if URL hasn't specified HTTP(S) protocol.
  async function siteFetch(siteURL: URL): Promise<string | Boom<any>> {
    // If protocol is not HTTP(s), returns an Boom object
    if (!siteURL.protocol.match(/https?:/)) {
      return badRequest(`Site ${siteURL.toString()} has an invalid protocol`);
    }

    try {
      const fetchResponse = await fetch(siteURL.origin + siteURL.pathname);
      const fetchText = await fetchResponse.text();
      return fetchText;
    } catch (error) {
      console.error(error);
      return badGateway(`Site ${siteURL.toString()} is not responding properly`);
    }
  }

  try {
    const sites: Array<URL> = request.query.sites;
    let sitesWordsArray: {
      siteName: string;
      wordsTop: string[];
    }[] = [];
    for (let site of sites) {
      site = new URL(site);

      const fetchResponse = await siteFetch(site);
      if (isBoom(fetchResponse)) {
        return h
          .response(
            JSON.parse(
              `{
                "error":"${fetchResponse.output.payload.error}",
                "message":"${fetchResponse.message}",
                "statusCode":"${fetchResponse.output.statusCode}"
              }`,
            ),
          )
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
    return h
      .response(pdfResult)
      .code(200)
      .encoding('base64')
      .type('application/pdf')
      .header('Content-Disposition', 'inline; filename="result.pdf"');
  } catch (err) {
    console.error(err);
  }
}

export default parsePlugin;
