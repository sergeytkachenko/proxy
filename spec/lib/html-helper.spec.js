const fs = require('fs');
const path = require('path');
const HtmlHelper = require('../../html-helper');
let html = fs.readFileSync(path.resolve(__dirname + '/torrent.site.org.html')).toString();

describe("HtmlHelper", () => {
    let resultHtml;

    beforeEach(() => {
        resultHtml = HtmlHelper.parseHtml(html, 'http://torrent.site.org', 'http://torrent.site.org/main.html');
    });

    it("parseHtml statics links", function() {
        expect(resultHtml).toContain('<a href="link.js">static </a>');
        expect(resultHtml).toContain('<a href="/link.css">static </a>');
        expect(resultHtml).toContain('<a href="/link.jpg">static </a>');
        expect(resultHtml).toContain('<a href="/link.jpeg">static </a>');
        expect(resultHtml).toContain('<a href="/link.png">static </a>');
        expect(resultHtml).toContain('<a href="/link.gif">static </a>');
        expect(resultHtml).toContain('<a href="/link.svg">static </a>');
        expect(resultHtml).toContain('<a href="/link.jsonp">static </a>');
    });

	it("parseHtml relative links", function() {
		expect(resultHtml).toContain('<a href="/http://torrent.site.org/">relative link </a>');
		expect(resultHtml).toContain('<a href="/http://torrent.site.org/about.html">relative link </a>');
		expect(resultHtml).toContain('<a href="/http://torrent.site.org/relative.html">relative link </a>');
	});

    it("parseHtml absolute links", function() {
        expect(resultHtml).toContain('<a href="/http://google.com.ua/about.html">google link </a>');
        expect(resultHtml).toContain('<a href="/http://google.com.ua/">google link </a>');
        expect(resultHtml).toContain('<a href="/http://google.com.ua">google link </a>');
        expect(resultHtml).toContain('<a href="/http://torrent.site.org/contact.html">absolute link </a>');
    });


    it("parseHtml added base tags", function() {
        const style = `<link href="http://localhost:3000/proxy-static/default.css" type="text/css" rel="stylesheet" />`;
        expect(resultHtml).toContain('<base href="http://torrent.site.org" />');
        expect(resultHtml).toContain('<script src="http://localhost:3000/proxy-static/inject-header.js"></script>');
        expect(resultHtml).toContain(style);
    });


    it("parseHtml replace action in forms", function() {
        expect(resultHtml).toContain('<form action="http://torrent.site.org/do.php"></form>');
        expect(resultHtml).toContain('<form action="http://torrent.site.org/work.php"></form>');
    });
});