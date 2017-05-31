'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
admin.initializeApp(functions.config().firebase);

const BooksService = require('./service/BooksService');
const BookNotificationService = require('./service/BookNotificationService')
const PacktPubCrawler = require('./service/PacktPubCrawler');

exports.books = functions.https.onRequest((req, res) => {
    let service = new BooksService();
    service.all().then(books => {
        res.json({ books });
    });
});

exports.googleassistant = functions.https.onRequest((req, res) => {
    const app = new ActionsSdkApp({request: req, response: res});    
    const service = new BooksService();
    const hasScreen = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
    service.getLastBook()
        .then(book => {
            let message = `The free book of the day is titled ${book.title}`;
            if(hasScreen){
                let richMessage = app.buildRichResponse()
                    .addSimpleResponse(message)
                    .addBasicCard(
                        app.buildBasicCard(book.description)
                            .setTitle(book.title)
                            .addButton('Claim book', book.claimLink)
                            .setImage(book.img, 'Book image')
                    );

                app.tell(richMessage);                
            }else{
                app.tell(message);
            }
        });
});

exports.fetch_books = functions.https.onRequest((req, res) => {

    const crawler = new PacktPubCrawler();
    const service = new BooksService();

    console.log('Running Fetch Books');
    let books;
    crawler.fetchBooksFromPacktPub()
        .then(fetchedBooks => {
            books = fetchedBooks;
            let slug = service.getSlug(books.currentBook);
            return service.exists(slug);
        })
        .then(exists => {
            if (!exists) {
                // Save new book
                return service.save(books.currentBook)
                    .then(() => {
                        // Notify clients that subscribed to this
                        console.log('Notify all');
                        let notificationService = new BookNotificationService();
                        return notificationService.notifyAllClients(books.currentBook);
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
