'use strict';

const Boom = require('boom');

const PackPubCrawler = require('../PacktPubCrawler');
const BooksService = require('../../books/BooksService');

module.exports = {
    method: 'GET',
    path: '/api/tasks/fetch-books',
    config: {
        description: 'Return current month books',
        notes: 'Return a list of books',
        tags: ['api'],
        handler: async (request, reply) => {
            try {
                console.log('Running Fetch Books');

                const crawler = new PackPubCrawler();
                let books = await crawler.fetchBooksFromPacktPub();
                const service = new BooksService();

                let slug = service.getSlug(books.currentBook);
                let exists = await service.exists(slug);
                if (!exists) {
                    await service.save(books.currentBook);
                    // TODO: Notify all
                }
                console.log('Success Fetch Books');

                reply({ books });

            } catch (e) {
                console.log('Error Fetch Books', e);
                reply(Boom.badGateway('Xablau', e))
            }
        }
    }
}