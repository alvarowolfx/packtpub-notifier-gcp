'use strict';

const cheerio = require('cheerio');
const fetch = require('node-fetch');
const urlFreeLearning = 'http://www.packtpub.com/packt/offers/free-learning/';

class PackPubCrawler {

	fetchPageBody() {
		return fetch(urlFreeLearning)
			.then(res => {
				return res.text();
			});
	}

	fixRelativeLink(link) {
		return 'https://www.packtpub.com' + link;
	}

	fixImgLink(link) {
		if (link.startsWith('//')) {
			return 'https:' + link;
		}
		return link;
	}

	scrapeCurrentBook(documentSelector) {
		let title = '';
		let description = '';
		let titleElements = documentSelector('.dotd-title');
		if (titleElements.length > 0) {
			title = titleElements.text().trim();

			let descriptionElements = titleElements.siblings('div');
			if (descriptionElements.length > 0) {
				let descEl = descriptionElements.get(1);
				//console.log(descEl);
				description = documentSelector(descEl).text().trim();
			}
		}

		let img = '';
		let link = '';
		let claimLink = 'https://www.packtpub.com/packt/offers/free-learning'
		let imgElements = documentSelector('div.dotd-main-book-image img');
		if (imgElements.length > 0) {
			img = this.fixImgLink(imgElements.attr('src'));

			let linkElements = documentSelector('.dotd-main-book-image a');
			if (linkElements.length > 0) {
				link = this.fixRelativeLink(linkElements.attr('href'));
			}

			/*
			BLOCKED BY THE Website
			let claimLinkElements = documentSelector('a.twelve-days-claim');
			if (claimLinkElements.length > 0) {
				claimLink = this.fixRelativeLink(claimLinkElements.attr('href'));
			}
			*/
		}

		return {
			title,
			description,
			link,
			img,
			claimLink,
			date: new Date()
		};
	}

	scrapeOldBooks(documentSelector) {
		let oldBooks = []
		let oldBookElements = documentSelector('.section-outer.grey .section-inner > a')
		let oldBookImgElements = documentSelector('.section-outer.grey .bookimage')
		if (oldBookElements.length > 0) {
			let index = 0
			oldBookElements = oldBookElements.filter((i, el) => {
				return el['attribs']['href'] != '#';
			});
			const blankUrl = '/sites/default/files/blank.gif';
			oldBookImgElements = oldBookImgElements.filter((i, el) => {
				return el['attribs']['src'] != blankUrl
			});
			for (let i = 0; i < oldBookElements.length; i++) {
				let bookElement = oldBookElements[i];
				let link = this.fixRelativeLink(bookElement['attribs']['href'])
				let img = this.fixImgLink(oldBookImgElements[index]['attribs']['src'])
				oldBooks.push({ img, link });
				index += 1
			}
		}
		return oldBooks;
	}

	fetchBooksFromPacktPub() {
		return this.fetchPageBody()
			.then(body => {
				let documentSelector = cheerio.load(body);
				let currentBook = this.scrapeCurrentBook(documentSelector);
				let oldBooks = this.scrapeOldBooks(documentSelector);

				return {
					currentBook,
					oldBooks
				};
			});

	}
}

module.exports = PackPubCrawler;
