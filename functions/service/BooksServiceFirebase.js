'use strict';

const admin = require('firebase-admin');
const db = admin.database();
const booksRef = db.ref("books");

class BookService {

    toArray(obj) {
        return Object.keys(obj).map(k => obj[k]);
    }

    getSlug(book) {
        let slug = book.link.split('/');
        slug = slug[slug.length - 1];
        return slug;
    }

    getLastBook() {
        return new Promise((resolve, reject) => {
            booksRef.orderByChild('date')
                .limitToFirst(1)
                .once('value')
                .then(snap => {
                    if (snap.numChildren === 1) {
                        let books = this.toArray(snap.exportVal())
                        resolve(books[0]);
                    } else {
                        reject(new Error("Sem livros cadastrados"));
                    }
                });
        });
    }

    all() {
        return new Promise((resolve, reject) => {
            booksRef.orderByChild('date')
                .once('value')
                .then(snap => {
                    let books = this.toArray(snap.exportVal())
                    resolve(books);
                });
        });
    }

    exists(slug) {
        return new Promise((resolve, reject) => {
            booksRef.child(slug)
                .once('value')
                .then(snap => {
                    resolve(snap.exists());
                });
        });
    }

    save(book) {
        let slug = this.getSlug(book);
        book.slug = slug;
        return booksRef.child(slug).set(book);
    }
}


module.exports = BookService;
