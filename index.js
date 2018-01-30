const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const iconv = require('iconv-lite');

const Transform = require('stream').Transform;
const HeaderHelper = require('./headers');
const HtmlHelper = require('./html-helper');

const config = require('./config');
const proxyUrl = config.proxyUrl;

function errorHandler (err, req, res) {
	res.status(500);
	res.end(err.message);
}

function getTarget(clietRequest) {
	const url = clietRequest.url;
	const targetPattern = /.*\/(https?:\/\/[^/]+\/?).*/i;
	if (targetPattern.test(url)) {
		return url.replace(targetPattern, "$1");
	}
	const referer = clietRequest.headers.referer;
	return referer.replace(targetPattern, "$1");
}

function getEncoding(headers) {
	headers = HeaderHelper.toLower(headers);
	const contentType = headers['content-type'];
	if (!contentType) {
		return 'utf-8';
	}
	return contentType.includes('charset=') && contentType.replace(/^(.*charset=)([a-z0-9-]+)$/i, '$2') || 'utf-8';
}

app.use(express.static('static'));

app.get(/.*(\.css|\.js|\.png|\.jpg|\.jpeg|\.gif)$/, (clientRequest, clientResponse) => {
	console.log(`RESOURCES EMPTY`);
	clientResponse.end('not found');
});

app.all(/^\/https?:/, (clientRequest, clientResponse) => {
	delete clientRequest.headers['accept-encoding'];
	const proxy = httpProxy.createProxyServer({});
	let encoding = 'utf-8';
	let url = clientRequest.url;
	proxy.on('proxyRes', function(proxyRes) {
		if (proxyRes.headers) {
			proxyRes.headers['content-security-policy'] = 'frame-ancestors http://localhost:4000';
			proxyRes.headers['x-frame-options'] = 'ALLOW-FROM http://localhost:4000';
			proxyRes.headers['Access-Control-Allow-Origin'] = '*';
			encoding = getEncoding(proxyRes.headers);
		}
		const location = proxyRes.headers['location'];
		if (location) {
			proxyRes.headers['location'] = `${proxyUrl}${location}`;
			console.log(`MOVE TO LOCATION --> ${proxyUrl}${location}`);
		}

		const cookies = proxyRes.headers['set-cookie'];
		if (cookies && cookies.length) {
			for (let i = 0; i < cookies.length; i++) {
				let cookie = cookies[i];
				cookie = cookie.replace(/^(.*domain=)([^;]+)(;?.*)$/, '$1proxy.dev.test$3');
				cookie = cookie.replace(/secure;?/, '');
				cookies[i] = cookie;
			}
			proxyRes.headers['set-cookie'] = cookies;
		}

		delete proxyRes.headers['content-length'];
		delete proxyRes.headers['alt-svc'];
		delete proxyRes.headers['x-xss-protection'];
		delete proxyRes.headers['vary'];
	});
	const target = getTarget(clientRequest);
	if (target === proxyUrl) {
		clientResponse.end(`target fail by url ${clientRequest.url}`);
		console.log(`target fail by url ${clientRequest.url}`);
		return
	}
	console.log(`TARGET -> ${target}`);
	clientRequest.url = clientRequest.url.replace(target, "");
	console.log(`URL -> ${clientRequest.url}`);
	proxy.web(clientRequest, clientResponse, {
		target: target,
		secure: false,
		ws: false,
		changeOrigin: true,
		resTransformStream: new Transform({
			transform(chunk, en, callback) {
				let html = iconv.decode(chunk, encoding);
				html = HtmlHelper.parseHtml(html, target, url);
				let buf = iconv.encode(html, encoding);
				callback(null, buf);
			}
		})
	});
	proxy.on('error', function(err, req, res) {
		errorHandler(err, req, res);
	});
});

app.listen(3000, 'localhost');
