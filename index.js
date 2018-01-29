const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const Transform = require('stream').Transform;

const proxyUrl = 'http://proxy.dev.test:3000/';

const replace = require('buffer-replace');

function getTarget(clietRequest) {
	const url = clietRequest.url;
	const targetPattern = /.*\/(https?:\/\/[^/]+\/?).*/i;
	if (targetPattern.test(url)) {
		return url.replace(targetPattern, "$1");
	}
	const referer = clietRequest.headers.referer;
	return referer.replace(targetPattern, "$1");
}

app.use(express.static('static'));

app.get(/.*(\.css|\.js|\.png|\.jpg|\.jpeg|\.gif)$/, (clientRequest, clientResponse) => {
	console.log(`RESOURCES EMPTY`);
	clientResponse.end('not found');
});

app.get(/^\/https?:/, (clientRequest, clientResponse) => {
	delete  clientRequest.headers['accept-encoding'];

	const proxy = httpProxy.createProxyServer({});

	proxy.on('proxyRes', function(proxyRes, req, res) {
		if (proxyRes.headers) {
			proxyRes.headers['content-security-policy'] = 'frame-ancestors http://localhost:4000';
			proxyRes.headers['x-frame-options'] = 'ALLOW-FROM http://localhost:4000';
			proxyRes.headers['Access-Control-Allow-Origin'] = '*';
		}
		const location = proxyRes.headers['location'];
		if (location) {
			proxyRes.headers['location'] = `${proxyUrl}${location}`;
			console.log(`MOVE TO LOCATION --> ${proxyUrl}${location}`);
		}

		const cookies = proxyRes.headers['set-cookie'];
		for (let i = 0; i < cookies.length; i++) {
			let cookie = cookies[i];
			cookie = cookie.replace(/^(.*domain=)([^;]+)(;?.*)$/, '$1proxy.dev.test$3');
			cookie = cookie.replace(/secure;?/, '');
			cookies[i] = cookie;
		}

		proxyRes.headers['set-cookie'] = cookies;

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
		changeOrigin: true,
		resTransformStream: new Transform({
			transform(chunk, encoding, callback) {
				let replaced = replace(chunk, '<head>', `<head><base href="${proxyUrl}${target}" /><script src="${proxyUrl}inject.js" />`);
				replaced = replace(replaced, '="/', `="${target}/`);
				replaced = replace(replaced, "='/", `='${target}/`);
				replaced = replace(replaced, 'action="', `action="${proxyUrl}`);
				replaced = replace(replaced, "action='", `action='${proxyUrl}`);
				callback(null, replaced);
			}
		})
	});
});

app.post(/^\/https?:/, (clientRequest, clientResponse) => {

	const proxy = httpProxy.createProxyServer({});

	proxy.on('proxyRes', function(proxyRes, req, res) {
		if (proxyRes.headers) {
			proxyRes.headers['Content-Security-Policy'] = 'frame-ancestors self http://localhost:4000';
		}
		const location = proxyRes.headers['location'];
		if (location) {
			proxyRes.headers['location'] = `${proxyUrl}${location}`;
			console.log(`MOVE TO LOCATION --> ${proxyUrl}${location}`);
		}
		delete proxyRes.headers['content-length'];
	});

	const target = getTarget(clientRequest);
	clientRequest.url = clientRequest.url.replace(target, "");
	proxy.web(clientRequest, clientResponse, {
		target: target,
		secure: false,
		changeOrigin: true,
	});
});

app.listen(3000, 'proxy.dev.test');