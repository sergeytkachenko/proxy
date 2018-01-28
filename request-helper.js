const http = require('http');
const https = require('https');
const iconv = require('iconv-lite');
const Headers = require('./headers');
const HtmlParser = require('./html-parser');

class RequestHelper {

	static proxy(clientRequest, clientResponse, proxyUrl) {
		// const proxyUrl = clientRequest.query.url;
		const pattern = /^(https?:)\/\/([^/]+)(.*)$/;
		const protocol = proxyUrl.replace(pattern, '$1');
		const host = proxyUrl.replace(pattern, '$2');
		const path = proxyUrl.replace(pattern, '$3');

		const originHeaders = Headers.toLowwer(clientRequest.headers);
		originHeaders['host'] = host;
		originHeaders['cache-control'] = 'no-cache';
		originHeaders['if-none-match'] = 'no-match-for-this';
		delete originHeaders['accept-encoding'];
		delete originHeaders['x-powered-by'];
		const options = {
			protocol: protocol,
			host: host,
			method: 'GET',
			headers: originHeaders,
			encoding: null
		};
		if (path) {
			options.path = path;
		}
		const requestProvider = protocol === 'https:' ? https : http;
		const serverRequest = requestProvider.request(options, serverResponse => {
			// TODO if status redirect need redirect
			console.log(``);
			console.log(`URL: ${options.protocol}//${options.host}${options.path || ""}`);
			console.log(`STATUS: ${serverResponse.statusCode}`);
			console.log(`HEADERS: ${JSON.stringify(serverResponse.headers)}`);

			let chunks = [];

			serverResponse.on('data', chunk => {
				chunks.push(chunk);
			});

			serverResponse.on('end', () => {
				const responseHeaders = Headers.toLowwer(serverResponse.headers);
				const contentType = responseHeaders['content-type'];
				const location = responseHeaders['location'];
				const encoding = contentType && contentType.includes('charset=')
					&& contentType.replace(/^(.*charset=)([a-z0-9-]+)$/i, '$2') || 'utf-8';
				if (contentType) {
					serverResponse.headers['content-type'] = contentType.replace(/^(.*charset=)([a-z0-9-]+)$/i, '$1utf-8');
					console.log(`CHANGE Content-Type: ${contentType} --> ${serverResponse.headers['content-type']}`);
				}
				if (location) {
					console.log(`MOVE TO LOCATION --> ${location}`);
					clientRequest.query.url = `${location}`;
					RequestHelper.proxy(clientRequest, clientResponse);
					return;
				}
				let body = iconv.decode(Buffer.concat(chunks), encoding);
				console.log(`ENCODING --> ${encoding}`);

				if (proxyUrl.endsWith('.js') || proxyUrl.endsWith('.css')
					|| proxyUrl.endsWith('.png') || proxyUrl.endsWith('.jpg') || proxyUrl.endsWith('.jpeg')
					|| proxyUrl.endsWith('.ico') || proxyUrl.endsWith('.gif')) {
					let file = iconv.decode(Buffer.concat(chunks), encoding);
					file = HtmlParser.parseHtml(file, proxyUrl);
					delete serverResponse.headers['content-length'];
					clientResponse.writeHeader(200, serverResponse.headers);
					clientResponse.end(file);
				} else {
					body = HtmlParser.parseHtml(body, proxyUrl);
					body = HtmlParser.appendBaseTag(body, proxyUrl);
					serverResponse.headers['content-length'] = body.length;
					clientResponse.writeHeader(200, serverResponse.headers);
					clientResponse.end(body, 'binary');
				}
			});
		});

		serverRequest.on('error', e => {
			console.error(`problem with request: ${e.message}`);
		});


		serverRequest.end();
	}
}

module.exports = RequestHelper;
