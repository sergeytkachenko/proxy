class HtmlProxy {

	static getBaseUrl(url) {
		return `http://localhost:3000/${url}`;
	}

	static appendBaseTag(html, siteAbsoluteUrl) {
		return html.replace(/<head>/gi, `<head><base href="${siteAbsoluteUrl}" />`);
	}

	static parseHtml(html, siteAbsoluteUrl) {
		let string = HtmlProxy._replaceAbsoluteUrl(html, siteAbsoluteUrl);
		string = HtmlProxy._replaceRelativeUrl(string, siteAbsoluteUrl);
		return string;
	}

	static _replaceAbsoluteUrl(html, siteAbsoluteUrl) {
		return html.replace(new RegExp(siteAbsoluteUrl, 'g'), HtmlProxy.getBaseUrl(siteAbsoluteUrl));
	}

	static _replaceRelativeUrl(html, siteAbsoluteUrl) {
		return html.replace(new RegExp('([^/])(\'|")\/', 'g'), `$1$2${HtmlProxy.getBaseUrl(siteAbsoluteUrl)}/`);
	}
}

module.exports = HtmlProxy;