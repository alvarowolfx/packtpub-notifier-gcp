'use strict';

const admin = require("firebase-admin");
const messaging = admin.messaging();

const TOPIC_NAME = 'receive_book_notification';

class BookNotificationService {

    notifyAllClients(book) {
        var payload = {
            notification: {
                title: `${book.title} is free today!`,
                body: `Open the app to claim this book.`,
                icon: 'ic_stat'
            }
        };
        return messaging.sendToTopic(TOPIC_NAME, payload);
    }
}


module.exports = BookNotificationService;
