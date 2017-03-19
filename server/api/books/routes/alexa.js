'use strict';

const alexaVerifier = require('alexa-verifier');
const Boom = require('boom');
const BooksService = require('../BooksService');

function requestVerifier(request, reply) {
    alexaVerifier(
        request.headers.signaturecertchainurl,
        request.headers.signature,
        request.payload,
        function verificationCallback(err) {
            if (err) {
                reply(Boom.unauthorized('Verification Failure'));
            } else {
                reply.continue();
            }
        }
    );
}

module.exports = {
    method: 'POST',
    path: '/api/alexa',
    config: {
        pre: [
            requestVerifier
        ],
        payload: {
            output: 'data',
            parse: false
        },
        description: 'Return last book to alexa',
        tags: ['api'],
        handler: async (request, reply) => {
            let service = new BooksService();
            let book = await service.getLastBook();
            let message = `The free book of the day is titled ${book.title}`;
            reply({
                "version": "1.0",
                "sessionAttributes": {},
                "response": {
                    "shouldEndSession": true,
                    "outputSpeech": {
                        "type": "SSML",
                        "ssml": `<speak>${message}</speak>`
                    },
                }
            });
        }
    }
}