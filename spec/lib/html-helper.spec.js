const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const HtmlHelper = require('../../html-helper');
let html = fs.readFileSync(path.resolve(__dirname + '/torrent.site.org.html')).toString();

describe("HtmlHelper", () => {
    let resultHtml;

    beforeEach(() => {
        resultHtml = HtmlHelper.parseHtml(html, 'http://torrent.site.org', 'http://torrent.site.org/main.html');
    });

	it("_replaceRelativeToAbsoluteLinks", function() {
		let html = `
			<a target="_blank" href="/about.html" id="about">about.html</a>
			<a target="_blank" href="contact.html" id="contact">contact.html</a>
			<a target="_blank" href="//people.html" id="people">people.html</a>
		`;
		let resultHtml = HtmlHelper._replaceRelativeToAbsoluteLinks(html, "http://example.com.ua/");
		expect(resultHtml).toContain('<a target="_blank" href="http://example.com.ua/about.html" id="about">about.html</a>');
		expect(resultHtml).toContain('<a target="_blank" href="http://example.com.ua/contact.html" id="contact">contact.html</a>');
		expect(resultHtml).toContain('<a target="_blank" href="http://example.com.ua/people.html" id="people">people.html</a>');
	});

	it("replaceLinks", function() {
		let html = `
			<a target="_blank" href="/about.html" id="about">about.html</a>
			<a target="_blank" href="contact.html" id="contact">contact.html</a>
			<a target="_blank" href="//people.html" id="people">people.html</a>
			<a target="_blank" href="http://google.com.ua/about.html" id="google">google.html</a>
		`;
		let resultHtml = HtmlHelper.replaceLinks(html, "http://example.com.ua/");
		expect(resultHtml).toContain('<a target="_blank" href="http://localhost:3000/http://example.com.ua/about.html" id="about">about.html</a>');
		expect(resultHtml).toContain('<a target="_blank" href="http://localhost:3000/http://example.com.ua/contact.html" id="contact">contact.html</a>');
		expect(resultHtml).toContain('<a target="_blank" href="http://localhost:3000/http://example.com.ua/people.html" id="people">people.html</a>');
		expect(resultHtml).toContain('<a target="_blank" href="http://localhost:3000/http://google.com.ua/about.html" id="google">google.html</a>');
	});

    it("parseHtml statics links", function() {
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.js">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.css">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.jpg">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.jpeg">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.png">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.gif">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.svg">static </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/link.jsonp">static </a>');
    });

	it("parseHtml relative links", function() {
		expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/">relative link </a>');
		expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/about.html">relative link </a>');
		expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/relative.html">relative link </a>');
	});

    it("parseHtml absolute links", function() {
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://google.com.ua/about.html">google link </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://google.com.ua/">google link </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://google.com.ua">google link </a>');
        expect(resultHtml).toContain('<a href="http://localhost:3000/http://torrent.site.org/contact.html">absolute link </a>');
    });


    it("parseHtml added base tags", function() {
        const style = `<link href="http://localhost:3000/proxy-static/default.css" type="text/css" rel="stylesheet" />`;
        expect(resultHtml).toContain('<base href="http://torrent.site.org" />');
        expect(resultHtml).toContain('<script src="http://localhost:3000/proxy-static/inject-header.js"></script>');
        expect(resultHtml).toContain(style);
    });


    it("parseHtml replace action in forms", function() {
	    const $ = cheerio.load(resultHtml);
        expect($('form#do').attr('action')).toBe('http://localhost:3000/http://torrent.site.org/do.php');
        expect($('form#work').attr('action')).toBe('http://localhost:3000/http://torrent.site.org/work.php');
    });
});