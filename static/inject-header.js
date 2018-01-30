var scraperFn = XMLHttpRequest.prototype.open.toString();
var siteRealUrl = location.pathname.replace(/^\/(https?:\/\/?)([^/]+).*$/, '$1/$2');

if (scraperFn.toString().indexOf('checkNeedPrototype') === -1) {
	XMLHttpRequest.prototype.open = function(method, path, p) {
		var checkNeedPrototype;
		// var isStatic = path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.jpg') || path.endsWith('.png');
		// if (/^\//.test(path) && !isStatic) {
		// 	path = location.origin + '/' + siteRealUrl + path;
		// }
		//
		// if (/^\//.test(path) && isStatic) {
		// 	path = siteRealUrl + path;
		// }
		// console.log(path);
		eval(scraperFn)(method, `/${path}`, p);
		// scraperFn.call(this, method, `/${path}`, p);
	};
}

window.onbeforeunload = function() {
	return 'Are you sure you want to leave?';
};

window.onload = function() {
	// var aList = document.querySelectorAll('a');
	// aList.forEach(a => setTimeout(() => {
	// 	if (a.href.startsWith(siteRealUrl)) {
	// 		a.setAttribute('href', a.href.replace())
	// 		console.log('/' + a.href);
	// 	}
	// }));
	document.body.style.pointerEvents = 'auto';
}