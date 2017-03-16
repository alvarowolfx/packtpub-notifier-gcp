'use strict';

const BooksService = require('../BooksService');

module.exports = {
    method: 'GET',
    path: '/api/books',
    config: {
        description: 'Return current month books',
        notes: 'Return a list of books',
        tags: ['api'],
        handler: async (request, reply) => {
            let service = new BooksService();
            let books = await service.all();
            reply({ books });
        }
    }
}