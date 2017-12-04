'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const i18n = require('@manekinekko/actions-on-google-i18n');
admin.initializeApp(functions.config().firebase);

const BooksService = require('./service/BooksService');
const BookNotificationService = require('./service/BookNotificationService');
const PacktPubCrawler = require('./service/PacktPubCrawler');

exports.books = functions.https.onRequest((req, res) => {
  let service = new BooksService();
  service.all().then(books => {
    res.json({ books });
  });
});

function bookTodayHandler(app) {
  const service = new BooksService();
  const hasScreen = app.hasSurfaceCapability(
    app.SurfaceCapabilities.SCREEN_OUTPUT
  );

  service.getLastBook().then(book => {
    let message = app.__('BOOK_DAY', { title: book.title });
    if (hasScreen) {
      let richMessage = app
        .buildRichResponse()
        .addSimpleResponse(message)
        .addBasicCard(
          app
            .buildBasicCard(book.description)
            .setTitle(book.title)
            .addButton(app.__('CLAIM_BOOK'), book.claimLink)
            .setImage(book.img, app.__('IMAGE_DESC'))
        );

      app.tell(richMessage);
    } else {
      app.tell(message);
    }
  });
}

exports.googleassistant = functions.https.onRequest((req, res) => {
  const app = new DialogflowApp({ request: req, response: res });

  i18n
    .configure({
      directory: `${__dirname}/locales`,
      defaultLocale: 'en-US',
      defaultExtension: 'json'
    })
    .use(app);

  const actionMap = new Map();
  actionMap.set('input.welcome', bookTodayHandler);
  actionMap.set('free_book', bookTodayHandler);
  actionMap.set('null', bookTodayHandler);

  app.handleRequest(actionMap);
});

exports.notify_slack = functions.https.onRequest((req, res) => {
  const notificationService = new BookNotificationService();
  const service = new BooksService();
  service
    .getLastBook()
    .then(book => {
      return notificationService.notifySlack(book);
    })
    .then(() => {
      res.json({ message: 'notification sent' });
    })
    .catch(e => {
      res.json({ error: e });
    });
});

exports.fetch_books = functions.https.onRequest((req, res) => {
  const crawler = new PacktPubCrawler();
  const service = new BooksService();

  console.log('Running Fetch Books');
  let books;
  crawler
    .fetchBooksFromPacktPub()
    .then(fetchedBooks => {
      books = fetchedBooks;
      let slug = service.getSlug(books.currentBook);
      return service.exists(slug);
    })
    .then(exists => {
      if (!exists) {
        // Save new book
        let notificationService = new BookNotificationService();
        return service
          .save(books.currentBook)
          .then(() => {
            // Notify clients that subscribed to this
            console.log('Notify all');
            return notificationService.notifyAllClients(books.currentBook);
          })
          .then(() => {
            console.log('Notify slack');
            return notificationService.notifySlack(books.currentBook);
          });
      }
      return exists;
    })
    .then(() => {
      res.json({ books });
    })
    .catch(e => {
      console.log('Error Fetch Books', e);
      res.json({ error: e });
    });
});
