// Settings for Mozilla's web-ext (lint, build, sign) when run from the repo root.
// They keep files that are not part of the add-on out of the Firefox package:
// smaller download, nothing unrelated shipped to users, and a cleaner review.
// The Chromium package is built separately by scripts/build-chromium.mjs.
module.exports = {
	ignoreFiles: [
		'.github',
		'.idea',
		'docs',
		'ko-fi',
		'scripts',
		'store',
		'dist',
		'README.md',
		'PRIVACY.md',
		'web-ext-config.cjs'
	]
};
