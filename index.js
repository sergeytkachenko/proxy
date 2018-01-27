const express = require('express')
const http = require('http');
const https = require('https');
const app = express();
const iconv = require('iconv-lite');

// check ssl is disabled
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.get('/', function (req, response) {
	const proxyUrl = req.query.url;
	const pattern = /^(https?:)\/\/([^/]+)(.*)$/;
	const protocol = proxyUrl.replace(pattern, '$1');
	const host = proxyUrl.replace(pattern, '$2');
	const path = proxyUrl.replace(pattern, '$3');
	delete req.headers['accept-encoding'];
	req.headers['Host'] = host;
	const originHeaders = req.headers;
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
	const request = requestProvider.request(options, res => {
		// TODO if status redirect need redirect
		console.log(``);
		console.log(`URL: ${options.protocol}//${options.host}${options.path || ""}`);
		console.log(`STATUS: ${res.statusCode}`);
		console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

		let chunks = [];

		res.on('data', chunk => {
			chunks.push(chunk);

		});

		res.on('end', () => {
			const contentType = res.headers['Content-Type'] || res.headers['content-type'];
			const encoding = contentType && contentType.includes('charset=')
				&& contentType.replace(/^(.*charset=)([a-z0-9-]+)$/i, '$2') || 'utf-8';
			if (contentType) {
				delete res.headers['content-type'];
				res.headers['Content-Type'] = contentType.replace(/^(.*charset=)([a-z0-9-]+)$/i, '$1utf-8');
				console.log(`CHANGE Content-Type: ${contentType} --> ${res.headers['Content-Type']}`);
			}
			response.writeHeader(200, res.headers);
			let body = iconv.decode(Buffer.concat(chunks), encoding);
			response.end(body);
		});
	});

	request.on('error', e => {
		console.error(`problem with request: ${e.message}`);
	});


	request.end();
});

app.listen(3000);