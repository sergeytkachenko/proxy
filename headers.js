class Headers {

	static toLowwer(headers) {
		const lowerHeaders = {};
		for (let key in headers) {
			if (headers.hasOwnProperty(key)) {
				lowerHeaders[key.toLowerCase()] = headers[key];
			}
		}
		return lowerHeaders;
	}

}

module.exports = Headers;
