
const admin = require("firebase-admin");

let credential;
if (process.env.NODE_ENV === 'production') {
    credential = admin.credential.applicationDefault();
} else {
    const serviceAccount = require("../../serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
    credential,
    databaseURL: "https://iot-bootcamp-158521.firebaseio.com"
});

const messaging = admin.messaging();

const TOPIC_NAME = 'receive_book_notification';

class BookNotificationService {

    async notifyAllClients(book) {
        var payload = {
            notification: {
                title: `${book.title} is free today!`,
                body: `Open the app to claim this book.`
            }
        };
        return messaging.sendToTopic(TOPIC_NAME, payload);
    }
}


module.exports = BookNotificationService;
