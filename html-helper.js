const config = require('./config');
const proxyUrl = config.proxyUrl;
const aliasOfRootPath = config.aliasOfRootPath;

class HtmlHelper {

	static getAbsolutePath(currentUrl) {
		return currentUrl.replace(/^\/?(.*\/)([^/]*)$/g, '$1');
	}

	static isRelativeLink (link) {
		return !/^(\/\/|https?:\/\/)/.test(link);
	}

	static isStaticLink(link) {
		const statics = ['.js', '.css', '.less', '.sass', '.jpeg', '.jpg', '.png', '.xml', '.gif', '.jsonp', '.svg'];
		for (let key in statics) {
			let ext = statics[key];
			if (link.includes(ext)) {
				return true;
			}
		}
		return false;
	}

	static getBaseUrl(url) {
		return `${config.proxyUrl}${url}`;
	}

	static getProtocol(siteAbsoluteUrl) {
		return siteAbsoluteUrl.replace(/^(https?):\/\/.*$/, '$1');
	}

	static appendToHeaderResources(html) {
		const scripts = `
			<script src="${proxyUrl}proxy-static/inject-header.js"></script>
			<link href="${proxyUrl}proxy-static/default.css" type="text/css" rel="stylesheet" />`;
		return html.replace(/<\s*head\s*>/gi, `<head>${scripts}`);
	}

	static removeLinkTarget(html) {
		const targetPattern = /target=('|")[^"']+('|")/gi;
		return html.replace(targetPattern, '');
	}

	static appendBaseTag(html, siteAbsoluteUrl) {
		return html.replace(/<\s*head\s*>/gi, `<head><base href="${siteAbsoluteUrl}" />`);
	}

	static parseHtml(html, siteAbsoluteUrl, url) {
		html = HtmlHelper._replaceAbsoluteUrl(html, HtmlHelper.getProtocol(siteAbsoluteUrl));
		html = HtmlHelper.appendBaseTag(html, siteAbsoluteUrl);
		html = HtmlHelper.appendToHeaderResources(html);
		html = HtmlHelper._replaceLinks(html, url);
		html = HtmlHelper._replaceForms(html, url);
		html = HtmlHelper.removeLinkTarget(html);
		return html;
	}

	static _replaceAbsoluteUrl(html, protocol) {
		const baseUrl = HtmlHelper.getBaseUrl('');
		html = html.replace(/('|")(https?:\/\/|\/\/)([^'"]+)('|")/gi, (find, quoteFirst, p, link, quiteLast) => {
			if (HtmlHelper.isStaticLink(link)) {
				return find;
			}
			return `${quoteFirst}${baseUrl}${protocol}://${link}${quoteFirst}`;
		});
		return html
	}

	static _replaceLinks(html, url) {
		const baseUrl = HtmlHelper.getBaseUrl('');
		const absolutePath = HtmlHelper.getAbsolutePath(url);
		const linkPattern = /(<\s*a\s+[^>]*href=)('|")([^>'"]*)('|")([^>]*>)/ig
		html = html.replace(linkPattern, (find, a, quoteFirst, link, quiteLast, attributes) => {
			if (HtmlHelper.isStaticLink(link)) {
				return find;
			}
			if (HtmlHelper.isRelativeLink(link)) {
				link = `${baseUrl}${absolutePath}${link}`;
			}
			return `${a}${quoteFirst}${link}${quiteLast}${attributes}`;
		});
		return html
	}


	static _replaceForms(html, url) {
		const baseUrl = HtmlHelper.getBaseUrl('');
		const absolutePath = HtmlHelper.getAbsolutePath(url);
		const linkPattern = /(<\s*form\s+[^>]*action=)('|")([^>'"]*)('|")([^>]*>)/ig
		html = html.replace(linkPattern, (find, a, quoteFirst, link, quiteLast, attributes) => {
			if (HtmlHelper.isStaticLink(link)) {
				return find;
			}
			if (HtmlHelper.isRelativeLink(link)) {
				link = `${baseUrl}${absolutePath}${link}`;
			}
			return `${a}${quoteFirst}${link}${quiteLast}${attributes}`;
		});
		return html
	}
}

module.exports = HtmlHelper;