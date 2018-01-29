var scraperFn = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, path, p) {
	var siteRealUrl = location.pathname.replace(/^\/(https?:\/\/[^/]+).*$/, '$1');
	var isStatic = path.indexOf('.js') !== -1 || path.indexOf('.css') !== -1 || path.indexOf('.jpg') !== -1 || path.indexOf('.png') !== -1;
	if (/^\//.test(path) && !isStatic) {
		path = location.origin + '/' + siteRealUrl + path;
	}
	if (/^\//.test(path) && isStatic) {
		path = siteRealUrl + path;
	}
	console.log(path);
	scraperFn.call(this, method, path, p);
};

window.onbeforeunload = function() {
	return 'Are you sure you want to leave?';
};