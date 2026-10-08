#!/usr/bin/env node
// =============================================================================
// Build the Chromium package (Chrome, Edge, Brave, ...) from the Firefox source.
// =============================================================================
// The repository holds ONE source tree. Firefox uses it as is. The Chromium
// package is derived from it into dist/chromium/ with these differences:
//
//   1. Firefox-only manifest keys are removed (browser_specific_settings,
//      host_permissions). Chromium does not need host_permissions for scripts
//      declared in content_scripts, and leaving them out keeps the permission
//      warning and the store review as small as possible.
//   2. minimum_chrome_version is added (the page script and popup use :has()).
//   3. The popup's "Rate extension" link, which points to Firefox Add-ons, is
//      removed (or pointed at a Chromium store page, see CHROMIUM_RATE_URL).
//
// Only files in COPY_LIST are packaged. Anything else in the repository (docs,
// store texts, donation images, CI files) never ends up in the extension.
//
// Usage:   node scripts/build-chromium.mjs
// Output:  dist/chromium/   (zip its CONTENTS, not the folder itself)
// No dependencies: runs on any Node.js 18+ on Windows, Linux and macOS.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- Configuration (edit here) ----------

// Chrome and Edge allow extension names up to 75 characters (checked below).
const MAX_NAME_LENGTH = 75;

// Oldest Chromium that supports every CSS/JS feature the extension relies on.
const MINIMUM_CHROME_VERSION = '105';

// Where the popup's "Rate extension" link goes in the Chromium package. The
// source popup links to Firefox Add-ons, which is wrong for Chrome and Edge users.
// Set to the Microsoft Edge Add-ons listing. Set it to null to remove the link
// (for example while no store page exists). Only https URLs are accepted.
const CHROMIUM_RATE_URL = 'https://microsoftedge.microsoft.com/addons/detail/konenpojbbpaghcelhkempoeamohjgjd';

// Matches the Firefox Add-ons link in popup.html, through its closing </a>.
const FIREFOX_RATE_LINK = /<a class="footer-secondary" href="https:\/\/addons\.mozilla\.org[^"]*"[\s\S]*?<\/a>\s*/;

// Manifest keys that only make sense on Firefox.
const FIREFOX_ONLY_KEYS = ['browser_specific_settings', 'host_permissions'];

// The complete list of files and folders that ship in the package.
const COPY_LIST = [
	'popup.html',
	'popup.js',
	'popup-i18n.js',
	'showvideocontrolsbydefault.js',
	'css',
	'icons',
	'_locales',
	'LICENSE'
];

// ---------- Build ----------

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist', 'chromium');

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
	// Tabs match the repository's formatting; the trailing newline is conventional.
	writeFileSync(path, JSON.stringify(value, null, '\t') + '\n');
}

// Start from an empty folder so files removed from the source cannot linger.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Fail loudly if the allowlist drifts from the repository contents.
for (const entry of COPY_LIST) {
	if (!existsSync(join(root, entry))) {
		throw new Error(`Missing file or folder listed in COPY_LIST: ${entry}`);
	}
	cpSync(join(root, entry), join(outDir, entry), { recursive: true });
}

// Popup: replace or remove the Firefox Add-ons "Rate extension" link.
const popupPath = join(outDir, 'popup.html');
const popupHtml = readFileSync(popupPath, 'utf8');
if (!FIREFOX_RATE_LINK.test(popupHtml)) {
	// The popup markup changed: stop instead of shipping a link to the wrong store.
	throw new Error('Could not find the Firefox Add-ons link in popup.html');
}
if (CHROMIUM_RATE_URL !== null && !CHROMIUM_RATE_URL.startsWith('https://')) {
	throw new Error('CHROMIUM_RATE_URL must start with https://');
}
writeFileSync(
	popupPath,
	CHROMIUM_RATE_URL === null
		? popupHtml.replace(FIREFOX_RATE_LINK, '')
		: popupHtml.replace(
			/(<a class="footer-secondary" href=")https:\/\/addons\.mozilla\.org[^"]*(")/,
			`$1${CHROMIUM_RATE_URL}$2`
		)
);

// Manifest: drop Firefox-only keys and add the Chromium ones.
const manifest = readJson(join(root, 'manifest.json'));
for (const key of FIREFOX_ONLY_KEYS) {
	delete manifest[key];
}
manifest.minimum_chrome_version = MINIMUM_CHROME_VERSION;
writeJson(join(outDir, 'manifest.json'), manifest);

// Names: the source names are used as is (one name for every browser). Fail the
// build if one is too long for the Chromium stores.
const localesDir = join(root, '_locales');
for (const locale of readdirSync(localesDir)) {
	const { extName } = readJson(join(localesDir, locale, 'messages.json'));
	if (extName.message.length > MAX_NAME_LENGTH) {
		throw new Error(`Extension name for "${locale}" is longer than ${MAX_NAME_LENGTH} characters`);
	}
}

console.log(`Chromium package ready in ${outDir}`);
console.log('Zip the CONTENTS of that folder (manifest.json must be at the zip root).');
