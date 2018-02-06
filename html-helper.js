const config = require('./config');
const sites = require('./sites');

const proxyUrl = config.proxyUrl;

class HtmlHelper {

	static _getAbsolutePath(currentUrl) {
		return currentUrl.replace(/^\/?(.*\/)([^/]*)$/g, '$1');
	}

	static _isAbsoluteLink (link) {
		return /^(\/\/|https?:\/\/)/.test(link);
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

	static parseHtml(html, siteAbsoluteUrl, url) {
        html = HtmlHelper._replaceRelativeToAbsoluteLinks(html, url);
		html = HtmlHelper._replaceAbsoluteUrl(html, HtmlHelper.getProtocol(siteAbsoluteUrl), url);
		html = HtmlHelper._replaceForms(html, url);
        html = HtmlHelper.appendToHeaderResources(html, siteAbsoluteUrl);
		html = HtmlHelper.removeLinkTarget(html);
		html = HtmlHelper.replaceSiteSpecified(html, url);
		return html;
	}

	static _replaceAbsoluteUrl(html, protocol, url) {
		html = html.replace(/('|")(https?:\/\/)([^'"]+)('|")/gi, (find, quoteFirst, p, link, quiteLast) => {
			if (HtmlHelper._isStaticLink(link)) {
				return find;
			}
			return `${quoteFirst}/${protocol}://${link}${quoteFirst}`;
		});
        const absolutePath = HtmlHelper._getAbsolutePath(url);
        html = html.replace(/('|")(\/\/)([^'"]+)('|")/gi, (find, quoteFirst, p, link, quiteLast) => {
            if (HtmlHelper._isStaticLink(link)) {
                return find;
            }
            return `${quoteFirst}/${absolutePath}${link}${quoteFirst}`;
        });
		return html
	}

	static _replaceRelativeToAbsoluteLinks(html, url) {
		const absolutePath = HtmlHelper._getAbsolutePath(url);
		const linkPattern = /(<\s*a\s+[^>]*href=)('|")([^>'"]*)('|")([^>]*>)/ig
		html = html.replace(linkPattern, (find, a, quoteFirst, link, quiteLast, attributes) => {
			if (HtmlHelper._isStaticLink(link)) {
				return find;
			}
			if (HtmlHelper._isAbsoluteLink(link)) {
				return find;
			}
            link = `/${absolutePath}${link}`;
            link = link.replace(/([^:])\/\//g, '$1/');
			return `${a}${quoteFirst}${link}${quiteLast}${attributes}`;
		});
		return html
	}


	static _replaceForms(html, url) {
		const baseUrl = HtmlHelper.getBaseUrl('');
		const absolutePath = HtmlHelper._getAbsolutePath(url);
		const linkPattern = /(<\s*form\s+[^>]*action=)('|")([^>'"]*)('|")([^>]*>)/ig
		html = html.replace(linkPattern, (find, a, quoteFirst, link, quiteLast, attributes) => {
			if (HtmlHelper._isStaticLink(link)) {
				return find;
			}
			if (HtmlHelper._isAbsoluteLink(link)) {
				return find;
			}
			link = `/${absolutePath}${link}`;
			link = link.replace(/([^:])\/\//g, '$1/');
			return `${a}${quoteFirst}${link}${quiteLast}${attributes}`;
		});
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