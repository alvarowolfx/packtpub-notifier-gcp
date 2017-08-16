'use strict';

const admin = require('firebase-admin');
const messaging = admin.messaging();
const fetch = require('node-fetch');
const TOPIC_NAME = 'receive_book_notification';

const slackWebhook =
  'https://hooks.slack.com/services/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';

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
