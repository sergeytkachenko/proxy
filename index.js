const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const Transform = require('stream').Transform;
const proxy = httpProxy.createProxyServer({});
const replace = require('buffer-replace');

proxy.on('proxyRes', function(proxyRes, req, res) {
	if (proxyRes.headers) {
		// proxyRes.headers['x-frame-options'] = 'ALLOW-FROM http://localhost:4000/';
		proxyRes.headers['Content-Security-Policy'] = 'frame-ancestors self http://localhost:4000';
	}
	const location = proxyRes.headers['location'];
	if (location) {
		console.log(`MOVE TO LOCATION --> ${location}`);
	}
});

function getTarget(clietRequest) {
	const url = clietRequest.url;
	const targetPattern = /.*\/(https?:\/\/[^/]+\/?).*/i;
	if (targetPattern.test(url)) {
		return url.replace(targetPattern, "$1");
	}
	const referer = clietRequest.headers.referer;
	return referer.replace(targetPattern, "$1");
}

app.get(/.*(\.css|\.js|\.png|\.jpg|\.jpeg|\.gif)$/, (clientRequest, clientResponse) => {
	clientResponse.end('not found');
});

app.get(/.*/, (clientRequest, clientResponse) => {
	const target = getTarget(clientRequest);
	console.log(`TARGET -> ${target}`);

	clientRequest.url = clientRequest.url.replace(target, "");
	console.log(`URL -> ${clientRequest.url}`);
	proxy.web(clientRequest, clientResponse, {
		target: target,
		secure: false,
		changeOrigin: true,
		resTransformStream: new Transform({
			transform(chunk, encoding, callback) {
				const replaced = replace(chunk, '="/', `="${target}/`);
				callback(null, replaced);
			}
		})
	});
});

app.post(/.*/, (clientRequest, clientResponse) => {
	const target = getTarget(clientRequest);
	clientRequest.url = clientRequest.url.replace(target, "");
	proxy.web(clientRequest, clientResponse, {
		target: target,
		secure: false,
		changeOrigin: true
	});
});

app.listen(3000);