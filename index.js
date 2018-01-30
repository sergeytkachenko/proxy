const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const iconv = require('iconv-lite');

const Transform = require('stream').Transform;
const HeaderHelper = require('./headers');
const HtmlHelper = require('./html-helper');

const config = require('./config');
const proxyUrl = config.proxyUrl;
const domain = config.domain;

let refererDomain = null;
let proxyDomain = config.proxyDomain;

function errorHandler (err, req, res) {
	res.status(500);
	res.end(err.message);
}

function getTarget(request) {
	const url = request.url;
	const targetPattern = /.*\/(https?:\/\/[^/]+\/?).*/i;
	if (targetPattern.test(url)) {
		return url.replace(targetPattern, "$1");
	}
	const referer = request.headers.referer;
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

function getReferer(headers) {
	headers = HeaderHelper.toLower(headers);
	let referer = headers.referer;
	if (!referer) {
		return headers.host;
	}
	return referer.replace(/^(https?:\/\/)([^/]+).*$/, '$2');
}

function deleteHeaders(res) {
	delete res.headers['content-length'];
	delete res.headers['alt-svc'];
	delete res.headers['x-xss-protection'];
	delete res.headers['vary'];
}

function replaceCookie(res, domain) {
	const cookies = res.headers['set-cookie'];
	if (cookies && cookies.length) {
		for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i];
			cookie = cookie.replace(/^(.*domain=)([^;]+)(;?.*)$/, `$1${domain}$3`);
			cookie = cookie.replace(/secure;?/, '');
			cookies[i] = cookie;
		}
		res.headers['set-cookie'] = cookies;
	}
}

app.use('/proxy-static', express.static('static'));

app.get(/.*(\.css|\.js|\.png|\.jpg|\.jpeg|\.gif)$/, (clientRequest, clientResponse) => {
	console.log(`RESOURCES EMPTY`);
	clientResponse.end('not found');
});

app.all(/^\/https?:/, (clientRequest, clientResponse) => {
	delete clientRequest.headers['accept-encoding'];
	const proxy = httpProxy.createProxyServer({});
	let encoding = 'utf-8';
	let url = clientRequest.url;
	refererDomain = getReferer(clientRequest.headers);

	proxy.on('proxyRes', function(proxyRes) {
		if (proxyRes.headers) {
			proxyRes.headers['content-security-policy'] = `frame-ancestors ${refererDomain} ${proxyDomain}`;
			proxyRes.headers['x-frame-options'] = `ALLOW-FROM ${refererDomain} ${proxyDomain}`;
			proxyRes.headers['Access-Control-Allow-Origin'] = '*';
			proxyRes.headers['cache-control'] = 'no-cache, no-store, must-revalidate';
			encoding = getEncoding(proxyRes.headers);
		}
		const location = proxyRes.headers['location'];
		if (location) {
			proxyRes.headers['location'] = `${proxyUrl}${location}`;
			console.log(`MOVE TO LOCATION --> ${proxyUrl}${location}`);
		}
		replaceCookie(proxyRes, domain);
		deleteHeaders(proxyRes)
	});
	const target = getTarget(clientRequest);
	if (target === proxyUrl) {
		clientResponse.status(500);
		clientResponse.end(`do proxy this site not allowed ${clientRequest.url}`);
		console.log(`do proxy this site not allowed ${clientRequest.url}`);
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
