
const Datastore = require('@google-cloud/datastore');
const config = require('../../config');

// Instantiates a client
const datastore = Datastore({
    projectId: config.projectId
});

// The kind for the new entity
const kind = 'Book';

class BookService {

    toDatastore(obj) {
        const results = [];
        Object.keys(obj).forEach(k => {
            if (obj[k] === undefined) {
                return;
            }

            results.push({
                name: k,
                value: obj[k]
            });
        });
        return results;
    }

    async all() {
        const query = datastore.createQuery(kind);
        let results = await datastore.runQuery(query);
        return results[0];
    }

    async save(book) {
        let slug = book.link.split('/');
        slug = slug[slug.length - 1];
        book.slug = slug;
        const bookKey = datastore.key([kind, slug]);

        let results = await datastore.get(bookKey);
        let bookEntity = {};
        if (results.length === 1) {
            // Merge
            bookEntity = {
                key: bookKey,
                data: Object.assign({}, book, results[0])
            };
        } else {
            // Prepares the new entity
            bookEntity = {
                key: bookKey,
                data: book
            };
        }
        return datastore.save(bookEntity);
    }
}


module.exports = BookService;
