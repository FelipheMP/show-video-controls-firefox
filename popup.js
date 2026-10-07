// =============================
// Popup logic for domain lists
// =============================
// This file powers the popup UI: it lets the user switch between two modes
// (exclude vs include-only) and manage separate domain lists for each mode.
// All data is persisted using storage.local so choices survive reloads.
// Language and theme are UI preferences; existing mode/list keys are unchanged.

// Firefox exposes the promise-based `browser` namespace; Chrome, Edge and other
// Chromium browsers expose `chrome`, which also returns promises in Manifest V3.
const api = globalThis.browser ?? globalThis.chrome;

const state = {
	mode: 'exclude',
	language: 'en',
	theme: 'system',
	excludedDomains: [],
	includedDomains: []
};

let feedback = null;
let saving = false;

// Translate static labels and dynamic feedback from the same dictionary.
function translate(key, values = {}) {
	let message = popupTranslations[state.language][key] || popupTranslations.en[key];
	for (const [name, value] of Object.entries(values)) {
		message = message.replace(`{${name}}`, value);
	}
	return message;
}

function getActiveListKey(mode) {
	return mode === 'include' ? 'includedDomains' : 'excludedDomains';
}

// Extract domain (hostname) from a full URL.
function extractDomain(url) {
	try {
		return new URL(url).hostname;
	} catch (error) {
		return '';
	}
}

// Prefill the domain input field with the current page's domain.
async function prefillCurrentDomain() {
	try {
		const tabs = await api.tabs.query({ active: true, currentWindow: true });
		const domain = extractDomain(tabs[0]?.url);
		const input = document.getElementById('domainInput');

		// Only prefill if domain is valid and not protected/local.
		if (domain && isValidDomain(domain)) {
			input.value = domain;
			document.getElementById('domainHint').dataset.i18n = 'prefilledHint';
		} else if (domain) {
			// Show why the domain couldn't be prefilled.
			showAlert('protectedDomain');
		}
	} catch (error) {
		// An inaccessible tab should not prevent manual domain management.
	}
}

// Applying translations never resets the user's partially entered domain.
function applyPreferences() {
	document.documentElement.lang = state.language === 'en' ? 'en-US' : 'pt-BR';
	document.documentElement.dataset.theme = state.theme;
	document.title = translate('pageTitle');
	document.getElementById('themeSelect').value = state.theme;

	document.querySelectorAll('[data-i18n]').forEach(element => {
		element.textContent = translate(element.dataset.i18n);
	});

	// Keep the existing "en" storage key for compatibility with saved preferences.
	// Visible locale codes and flags never change with the interface translation.
	document.getElementById('languageCode').textContent = state.language === 'en' ? 'en-US' : 'pt-BR';
	document.getElementById('languageFlag').textContent = state.language === 'en' ? '🇺🇸' : '🇧🇷';
	document.querySelectorAll('[data-language]').forEach(button => {
		button.setAttribute('aria-checked', String(button.dataset.language === state.language));
	});

	document.getElementById('domainInput').placeholder = translate('domainPlaceholder');
	updateDomainList();
	renderFeedback();
}

// The menu supports touch, outside clicks, Escape, and standard arrow-key navigation.
function setLanguageMenuOpen(open, returnFocus = false) {
	const trigger = document.getElementById('languageToggle');
	const menu = document.getElementById('languageMenu');
	menu.hidden = !open;
	trigger.setAttribute('aria-expanded', String(open));

	if (open) {
		menu.querySelector('[aria-checked="true"]').focus();
	} else if (returnFocus) {
		trigger.focus();
	}
}

function setupLanguageMenu() {
	const picker = document.getElementById('languagePicker');
	const trigger = document.getElementById('languageToggle');
	const menu = document.getElementById('languageMenu');
	const options = [...menu.querySelectorAll('[data-language]')];

	trigger.addEventListener('click', () => setLanguageMenuOpen(menu.hidden));
	options.forEach(button => {
		button.addEventListener('click', () => {
			// Return focus before saving disables controls; never focus a hidden option.
			setLanguageMenuOpen(false, true);
			if (button.dataset.language !== state.language) {
				saveSettings({ language: button.dataset.language });
			}
		});
	});

	picker.addEventListener('keydown', event => {
		if (event.key === 'Escape' && !menu.hidden) {
			event.preventDefault();
			event.stopPropagation();
			setLanguageMenuOpen(false, true);
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const wasClosed = menu.hidden;
		if (wasClosed) setLanguageMenuOpen(true);

		let index = options.indexOf(document.activeElement);
		if (event.key === 'Home' || (wasClosed && event.key === 'ArrowDown')) {
			index = 0;
		} else if (event.key === 'End' || (wasClosed && event.key === 'ArrowUp')) {
			index = options.length - 1;
		} else {
			const direction = event.key === 'ArrowDown' ? 1 : -1;
			index = (index + direction + options.length) % options.length;
		}
		options[index].focus();
	});

	// Tab moves to the next ordinary control; leaving the picker dismisses the menu.
	picker.addEventListener('focusout', event => {
		if (!picker.contains(event.relatedTarget)) setLanguageMenuOpen(false);
	});
	document.addEventListener('pointerdown', event => {
		if (!picker.contains(event.target)) setLanguageMenuOpen(false);
	});
}

// Disable changes while a storage write is pending to avoid overlapping updates.
function setBusy(busy) {
	saving = busy;
	document.querySelectorAll('button, input, select').forEach(element => {
		element.disabled = busy;
	});
	document.getElementById('domainForm').setAttribute('aria-busy', String(busy));
}

// Commit to storage before rendering success. Failed writes leave data intact.
async function saveSettings(changes) {
	if (saving) return false;
	const focusedElement = document.activeElement;
	setBusy(true);
	try {
		await api.storage.local.set(changes);
		Object.assign(state, changes);
		return true;
	} catch (error) {
		showAlert('saveError');
		return false;
	} finally {
		setBusy(false);
		// Revert native radio/select changes if storage rejected the write.
		applyPreferences();
		if (focusedElement?.isConnected) focusedElement.focus();
	}
}

// Form submission to add domain to the active list.
// When the user clicks "Add site", we validate the input and push it
// into the storage list that corresponds to the current mode.
async function addDomain(event) {
	event.preventDefault();
	if (saving) return;
	const input = document.getElementById('domainInput');
	const domain = input.value.trim().toLowerCase(); // Trim whitespace.

	if (!isValidDomain(domain)) {
		showAlert('invalidDomain');
		input.setAttribute('aria-invalid', 'true');
		input.setAttribute('aria-describedby', 'domainHint alertMessage');
		input.focus();
		return;
	}

	const key = getActiveListKey(state.mode);
	if (state[key].includes(domain)) {
		showAlert('duplicateDomain');
		input.focus();
		return;
	}

	if (await saveSettings({ [key]: [...state[key], domain] })) {
		input.value = '';
		resetDomainHint();
		showAlert('addedDomain', 'info');
		input.focus();
	}
}

// Once edited or cleared, the field no longer claims to be the current domain.
function resetDomainHint() {
	const hint = document.getElementById('domainHint');
	hint.dataset.i18n = 'domainHint';
	hint.textContent = translate('domainHint');
	const input = document.getElementById('domainInput');
	input.removeAttribute('aria-invalid');
	input.setAttribute('aria-describedby', 'domainHint');
}

function isValidDomain(domain) {
	// Reject empty, protected, or local domains
	if (!domain) return false;

	// Reject protected URLs
	if (domain.includes('about:') || domain.includes('chrome-extension://') ||
		domain.includes('moz-extension://') || domain.includes('file://') ||
		domain.includes('data:')) {
		return false;
	}

	// Reject localhost and local IPs
	if (domain === 'localhost' || domain.startsWith('127.') ||
		domain.startsWith('::1') || domain === '[::1]') {
		return false;
	}

	// Reject private IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
	const ipMatch = domain.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
	if (ipMatch) {
		const [, a, b, c, d] = ipMatch.map(Number);
		// Check for private IP ranges
		if ((a === 192 && b === 168) || (a === 10) || (a === 172 && b >= 16 && b <= 31)) {
			return false;
		}
		// Any IP address (public or not) is rejected
		return false;
	}

	// Regex to validate domain names (e.g., "example.com").
	// - (?!:\/\/): Disallows protocols like "http://".
	// - ([a-zA-Z0-9-_]+\.): Matches subdomains and the main domain part.
	// - [a-zA-Z]{2,}: Ensures the top-level domain (TLD) is at least 2 letters long.
	const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
	return domainRegex.test(domain);
}

function updateDomainList() {
	// Reads current mode, updates the title, then renders the appropriate list
	// (included vs excluded) sorted. Neither saved list is overwritten on a switch.
	const key = getActiveListKey(state.mode);
	const domains = [...state[key]];
	const title = state.mode === 'include' ? 'includedTitle' : 'excludedTitle';
	document.getElementById('pageTitle').textContent = translate(title);
	document.getElementById('domainCount').textContent = domains.length;
	document.querySelectorAll('input[name="mode"]').forEach(input => {
		input.checked = input.value === state.mode;
	});

	// Sort domains in ascending alphabetical order, keeping www entries last.
	domains.sort((a, b) => {
		if (a.startsWith('www.') === b.startsWith('www.')) {
			return a.localeCompare(b);
		}
		return a.startsWith('www.') ? 1 : -1;
	});

	const emptyList = document.getElementById('emptyList');
	emptyList.hidden = domains.length > 0;
	emptyList.textContent = translate(state.mode === 'include' ? 'emptyInclude' : 'emptyExclude');

	const list = document.getElementById('domainList');
	list.replaceChildren();
	domains.forEach(domain => {
		const li = document.createElement('li');
		const name = document.createElement('span');
		name.className = 'domain-name';
		name.textContent = domain;

		const deleteButton = document.createElement('button');
		deleteButton.type = 'button';
		deleteButton.className = 'remove-button';
		// Icon and text are built with DOM methods (no innerHTML); the icon is
		// decorative, so the accessible name still comes from the aria-label below.
		const label = document.createElement('span');
		label.textContent = translate('removeDomain');
		deleteButton.append(createTrashIcon(), label);
		deleteButton.setAttribute('aria-label', translate('removeDomainLabel', { domain }));
		deleteButton.addEventListener('click', () => removeDomain(domain));
		li.append(name, deleteButton);
		list.append(li);
	});
}

// Small trash icon for the Remove buttons, drawn like the other popup icons
// (thin stroke that follows the text color, so it changes with hover and theme).
function createTrashIcon() {
	const svgNamespace = 'http://www.w3.org/2000/svg';
	const icon = document.createElementNS(svgNamespace, 'svg');
	icon.setAttribute('viewBox', '0 0 24 24');
	icon.setAttribute('fill', 'none');
	icon.setAttribute('stroke', 'currentColor');
	icon.setAttribute('stroke-width', '1.7');
	icon.setAttribute('stroke-linecap', 'round');
	icon.setAttribute('stroke-linejoin', 'round');
	icon.setAttribute('aria-hidden', 'true');
	icon.setAttribute('focusable', 'false');
	const path = document.createElementNS(svgNamespace, 'path');
	path.setAttribute('d', 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5');
	icon.append(path);
	return icon;
}

async function removeDomain(domain) {
	// Removes a domain from the list corresponding to the current mode.
	if (saving) return;
	const key = getActiveListKey(state.mode);
	const remaining = state[key].filter(entry => entry !== domain);
	if (await saveSettings({ [key]: remaining })) {
		showAlert('removedDomain', 'info');
		// The removed button no longer exists; return focus to a stable control.
		document.getElementById('domainInput').focus();
	}
}

// Unified popup notifications, translated again when the language changes.
// Separate live regions distinguish errors from informational updates.
function showAlert(key, type = 'error') {
	feedback = { key, type };
	renderFeedback();
}

function renderFeedback() {
	const error = document.getElementById('alertMessage');
	const status = document.getElementById('statusMessage');
	error.textContent = feedback?.type === 'error' ? translate(feedback.key) : '';
	status.textContent = feedback?.type === 'info' ? translate(feedback.key) : '';
}

// Initialize UI based on stored mode, lists, language and appearance.
// Missing preferences use English and the system theme; existing lists are kept.
async function initializePopup() {
	setBusy(true);
	try {
		const data = await api.storage.local.get(Object.keys(state));
		state.mode = data.mode === 'include' ? 'include' : 'exclude';
		state.language = data.language === 'pt-BR' ? 'pt-BR' : 'en';
		state.theme = ['light', 'dark'].includes(data.theme) ? data.theme : 'system';
		for (const key of ['excludedDomains', 'includedDomains']) {
			state[key] = Array.isArray(data[key])
				? data[key].filter(domain => typeof domain === 'string')
				: [];
		}

		await prefillCurrentDomain();
		applyPreferences();
		setBusy(false);
	} catch (error) {
		// Do not enable edits after a failed read: that could replace saved lists.
		showAlert('loadError');
		return;
	}

	document.getElementById('domainForm').addEventListener('submit', addDomain);
	document.getElementById('domainInput').addEventListener('input', resetDomainHint);
	document.querySelectorAll('input[name="mode"]').forEach(input => {
		input.addEventListener('change', async () => {
			if (await saveSettings({ mode: input.value })) {
				// Announce mode change and prompt refresh.
				showAlert('modeChanged', 'info');
			}
		});
	});
	document.getElementById('themeSelect').addEventListener('change', event => {
		saveSettings({ theme: event.target.value });
	});
	setupLanguageMenu();
}

initializePopup();
