#!/usr/bin/env node
// =============================================================================
// Upload the Chromium package to Microsoft Edge Add-ons and publish it.
// =============================================================================
// Uses the Edge Add-ons "Update REST API" v1.1 (API key authentication):
// https://learn.microsoft.com/microsoft-edge/extensions/update/api/using-addons-api
//
// Steps: upload the zip as the product's draft, wait for the upload to be
// processed, submit the draft for review (publish), wait for the answer.
// The first submission of a product, and its store texts and images, are managed
// in Partner Center: this API only updates the package of an existing product.
//
// Credentials are read from the environment (never from arguments) so they stay
// out of shell history and process listings. In CI they come from GitHub secrets:
//   EDGE_CLIENT_ID    Client ID shown on Partner Center > Publish API
//   EDGE_API_KEY      API key created on the same page (it expires; renew it there)
//   EDGE_PRODUCT_ID   Product ID (a GUID) of the extension in Partner Center
//
// Usage:   node scripts/publish-edge.mjs <package.zip> [--dry-run] [--notes "text"]
//   --dry-run   check the inputs and the zip, make no network request
//   --notes     notes for the certification team (default: a short automatic text)
// No dependencies: needs Node.js 18 or later (built-in fetch).

import { readFileSync, statSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

// ---------- Configuration ----------

// The only host this script talks to. Fixed on purpose: the API key must never
// be sent anywhere else, so the address is not configurable.
const API_ROOT = 'https://api.addons.microsoftedge.microsoft.com';

// Polling: check every few seconds, give up after POLL_ATTEMPTS checks.
const POLL_INTERVAL_MS = 5000;
const POLL_ATTEMPTS = 60;

// Abort a single request that hangs (the upload is the slowest one).
const REQUEST_TIMEOUT_MS = 120000;

// Refuse unexpectedly large files (Edge accepts far less); a wrong path should fail fast.
const MAX_PACKAGE_BYTES = 50 * 1024 * 1024;

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPERATION_ID = /^[A-Za-z0-9._-]+$/;

// ---------- Helpers ----------

function fail(message) {
	console.error(`error: ${message}`);
	process.exit(1);
}

function parseArgs(argv) {
	const args = { zip: null, dryRun: false, notes: null };
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--dry-run') args.dryRun = true;
		else if (argv[i] === '--notes') args.notes = argv[++i] ?? fail('--notes needs a value');
		else if (argv[i].startsWith('--')) fail(`unknown option ${argv[i]}`);
		else if (args.zip === null) args.zip = argv[i];
		else fail('only one package file can be given');
	}
	if (args.zip === null) fail('usage: node scripts/publish-edge.mjs <package.zip> [--dry-run] [--notes "text"]');
	return args;
}

function readCredentials() {
	const { EDGE_CLIENT_ID: clientId, EDGE_API_KEY: apiKey, EDGE_PRODUCT_ID: productId } = process.env;
	const missing = ['EDGE_CLIENT_ID', 'EDGE_API_KEY', 'EDGE_PRODUCT_ID'].filter(name => !process.env[name]);
	if (missing.length > 0) fail(`missing environment variable(s): ${missing.join(', ')}`);
	// The product ID goes into the URL path: only accept the GUID shape.
	if (!GUID.test(productId)) fail('EDGE_PRODUCT_ID must be the GUID shown in Partner Center');
	return { clientId, apiKey, productId };
}

// One authenticated request. The headers (and so the key) are never printed.
async function call(credentials, method, path, { body, contentType } = {}) {
	const headers = { Authorization: `ApiKey ${credentials.apiKey}`, 'X-ClientID': credentials.clientId };
	if (contentType) headers['Content-Type'] = contentType;
	const response = await fetch(`${API_ROOT}${path}`, {
		method,
		headers,
		body,
		redirect: 'error', // a redirect could carry the key to another host
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
	});
	const text = await response.text();
	let json = null;
	try { json = JSON.parse(text); } catch { /* the body is not always JSON */ }
	return { response, text, json };
}

// The operation ID comes back in the Location header (a bare ID, or a URL ending in it).
function operationIdFrom(response, step) {
	const location = response.headers.get('location') ?? '';
	const id = location.split('/').filter(Boolean).pop() ?? '';
	if (!OPERATION_ID.test(id)) fail(`${step}: the response had no usable operation ID`);
	return id;
}

// Polls an operation until it is no longer "InProgress" and returns its final state.
async function waitFor(credentials, path, step) {
	for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
		const { response, json, text } = await call(credentials, 'GET', path);
		if (!response.ok) fail(`${step}: status check answered HTTP ${response.status}: ${text.slice(0, 300)}`);
		if (json?.status && json.status !== 'InProgress') return json;
		await sleep(POLL_INTERVAL_MS);
	}
	return fail(`${step}: still in progress after ${(POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds`);
}

function describe(result) {
	const details = Array.isArray(result.errors) && result.errors.length > 0 ? ` ${JSON.stringify(result.errors)}` : '';
	return `${result.status}${result.errorCode ? ` (${result.errorCode})` : ''}: ${result.message ?? ''}${details}`;
}

// ---------- Main ----------

const args = parseArgs(process.argv.slice(2));

let size;
try {
	size = statSync(args.zip).size;
} catch {
	fail(`cannot read ${args.zip}`);
}
if (size === 0 || size > MAX_PACKAGE_BYTES) fail(`${args.zip} has an unexpected size (${size} bytes)`);

const credentials = readCredentials();
const notes = args.notes ?? 'Automated release from GitHub Actions. No change to permissions or data handling.';

if (args.dryRun) {
	console.log(`dry run: would upload ${args.zip} (${size} bytes) and publish it. No request was made.`);
	process.exit(0);
}

const base = `/v1/products/${credentials.productId}/submissions`;

// 1. Upload the package as the draft.
console.log('Uploading the package...');
const upload = await call(credentials, 'POST', `${base}/draft/package`, {
	body: readFileSync(args.zip),
	contentType: 'application/zip'
});
if (upload.response.status !== 202) {
	fail(`upload answered HTTP ${upload.response.status}: ${upload.text.slice(0, 300)}`);
}
const uploadId = operationIdFrom(upload.response, 'upload');
const uploaded = await waitFor(credentials, `${base}/draft/package/operations/${uploadId}`, 'upload');
if (uploaded.status !== 'Succeeded') fail(`upload ${describe(uploaded)}`);
console.log('Package uploaded.');

// 2. Submit the draft for review.
console.log('Submitting for review...');
const publish = await call(credentials, 'POST', base, { body: notes, contentType: 'text/plain' });
if (publish.response.status !== 202) {
	fail(`publish answered HTTP ${publish.response.status}: ${publish.text.slice(0, 300)}`);
}
const publishId = operationIdFrom(publish.response, 'publish');
const published = await waitFor(credentials, `${base}/operations/${publishId}`, 'publish');
if (published.status !== 'Succeeded') fail(`publish ${describe(published)}`);
console.log('Submitted. Edge reviews the update before it goes live.');
