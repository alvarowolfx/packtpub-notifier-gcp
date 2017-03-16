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
                const crawler = new PackPubCrawler();
                let books = await crawler.fetchBooksFromPacktPub();
                const service = new BooksService();

                console.log('OldBooks');
                await books.oldBooks.forEach(async (book) => {
                    console.log(book.link);
                    await service.save(book);
                });
                console.log('CurrentBook');
                await service.save(books.currentBook);

                reply({ books });
            } catch (e) {
                reply(Boom.badGateway('Xablau', e))
            }
        }
    }
}