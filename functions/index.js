'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const BooksService = require('./service/BooksService');
const BookNotificationService = require('./service/BookNotificationService')
const alexaVerifier = require('alexa-verifier');
const PacktPubCrawler = require('./service/PacktPubCrawler');

exports.books = functions.https.onRequest((req, res) => {
    let service = new BooksService();
    service.all().then(books => {
        res.json({ books });
    });
});

exports.alexa = functions.https.onRequest((req, res) => {
    let certUrl = req.headers.signaturecertchainurl;
    let signature = req.headers.signature;
    let body = JSON.stringify(req.body);
    alexaVerifier(
        certUrl,
        signature,
        body,
        function verificationCallback(err) {
            if (err) {
                res.json({ error: err })
            } else {
                const service = new BooksService();
                service.getLastBook()
                    .then(book => {
                        let message = `The free book of the day is titled ${book.title}`;
                        res.json({
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
                    });
            }
        }
    );
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

