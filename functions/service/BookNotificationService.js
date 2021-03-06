'use strict';

const admin = require('firebase-admin');
const messaging = admin.messaging();
const fetch = require('node-fetch');
const TOPIC_NAME = 'receive_book_notification';

const slackWebhook = '[your-slack-url-here]';

class BookNotificationService {
  notifyAllClients(book) {
    var payload = {
      notification: {
        title: `${book.title} is free today!`,
        body: `Open the app to claim this book.`,
        icon: 'ic_stat',
        color: '#e9662e'
      }
    };
    return messaging.sendToTopic(TOPIC_NAME, payload);
  }

  notifySlack(book) {
    var payload = {
      channel: '#random',
      text: `${book.title} is free today! <${book.claimLink}|Claim book>.`
    };
    return fetch(slackWebhook, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

module.exports = BookNotificationService;
