'use strict';

const Datastore = require('@google-cloud/datastore');
const moment = require('moment');

// Instantiates a client
const datastore = Datastore({
  projectId: 'iot-bootcamp-158521'
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

  getSlug(book) {
    let slug = book.link.split('/');
    slug = slug[slug.length - 1];
    return slug;
  }

  getLastBook() {
    const query = datastore
      .createQuery(kind)
      .order('date', { descending: true })
      .limit(1);
    return datastore.runQuery(query).then(results => {
      return results[0][0];
    });
  }

  all() {
    const query = datastore
      .createQuery(kind)
      .order('date', { descending: true });
    return datastore.runQuery(query).then(results => {
      return results[0];
    });
  }

  exists(slug) {
    const bookKey = datastore.key([kind, slug]);
    return datastore.get(bookKey).then(results => {
      console.log('Exists', results);
      let book = results[0];
      if (book) {
        let book = results[0];
        let now = moment();
        let lastBookDay = moment(book['date']);
        let isMoreThanTwoDays = now.diff(lastBookDay, 'd') > 2;
        console.log('Exists', book, now, lastBookDay, isMoreThanTwoDays);
        return !isMoreThanTwoDays;
      }
      return false;
    });
  }

  save(book) {
    let slug = this.getSlug(book);
    book.slug = slug;
    const bookKey = datastore.key([kind, slug]);
    let bookEntity = {
      key: bookKey,
      data: book
    };
    return datastore.save(bookEntity);
  }
}

module.exports = BookService;
