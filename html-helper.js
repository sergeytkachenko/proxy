const config = require('./config');
const sites = require('./sites');

const proxyUrl = config.proxyUrl;

class HtmlHelper {

	static _getAbsolutePath(currentUrl) {
		currentUrl = currentUrl.replace(/^\/?(.*\/?)([^/]*)$/g, '$1');
		if (currentUrl.endsWith('/')) {
			return currentUrl;
		}
		return `${currentUrl}/`;
	}

	static _isAbsoluteLink (link) {
		return /^(https?:\/\/)/.test(link);
	}

	static _isStaticLink(link) {
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

	static appendToHeaderResources(html, siteAbsoluteUrl) {
		const scripts = `<base href="${siteAbsoluteUrl}" />
			<script src="${proxyUrl}proxy-static/inject-header.js"></script>
			<link href="${proxyUrl}proxy-static/default.css" type="text/css" rel="stylesheet" />`;
		return html.replace(/<\s*head(\s+[^>]*)?>/gi, `<head>${scripts}`);
	}

	static removeLinkTarget(html) {
		const targetPattern = /target=('|")[^"']+('|")/gi;
		return html.replace(targetPattern, '');
	}

	static parseHtml(html, target, clientRequestUrl) {
        html = HtmlHelper._replaceRelativeToAbsoluteLinks(html, target);
		html = HtmlHelper._replaceAbsoluteUrl(html, HtmlHelper.getProtocol(target), clientRequestUrl);
        html = HtmlHelper.appendToHeaderResources(html, target);
		html = HtmlHelper.removeLinkTarget(html);
		html = HtmlHelper.replaceSiteSpecified(html, clientRequestUrl);
		return html;
	}

	static replaceLinks(html, clientRequestUrl) {
		html = HtmlHelper._replaceRelativeToAbsoluteLinks(html, clientRequestUrl);
		html = HtmlHelper._replaceAbsoluteUrl(html);
		return html;
	}

	static _replaceAbsoluteUrl(html) {
		html = html.replace(/=\s*('|")(https?:\/\/)([^'"]+)('|")/gi, (find, quote, protocol, link) => {
			return `=${quote}${proxyUrl}${protocol}${link}${quote}`;
		});
		return html
	}

	static _replaceRelativeToAbsoluteLinks(html, target) {
		const absolutePath = HtmlHelper._getAbsolutePath(target);
		const linkPattern = /(<\s*a\s+[^>]*href=)('|")([^>'"]*)('|")([^>]*>)/ig
		const formPattern = /(<\s*form\s+[^>]*action=)('|")([^>'"]*)('|")([^>]*>)/ig
		const fn = (find, a, quoteFirst, link, quiteLast, attributes) => {
			if (HtmlHelper._isAbsoluteLink(link)) {
				return find;
			}
			link = link.replace(/^\/\/?/, '');
			link = `${absolutePath}${link}`;
			return `${a}${quoteFirst}${link}${quiteLast}${attributes}`;
		};
		html = html.replace(linkPattern, fn);
		html = html.replace(formPattern, fn);
		return html
	}

	static replaceSiteSpecified(html, siteUrl) {
		const domains = Object.keys(sites);
		const domain = domains.find(domain => siteUrl.includes(domain));
		if (!domain) {
			return html;
		}
		const site = sites[domain];
		return site.replace(html);
	}
}

module.exports = HtmlHelper;