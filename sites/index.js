module.exports = {
	'rutracker.org': {
		replace(html) {
			return html.replace('top != self && !self.location.hostname.match(BB.allowed_translator_hosts)', 'false');
		}
	}
};