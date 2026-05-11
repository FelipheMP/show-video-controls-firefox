// =============================
// Popup logic for domain lists
// =============================
// This file powers the popup UI: it lets the user switch between two modes
// (exclude vs include-only) and manage separate domain lists for each mode.
// All data is persisted using browser.storage.local so choices survive reloads.

// Helpers to read and write current mode
function getCurrentMode(callback) {
	browser.storage.local.get('mode', function (data) {
		const mode = data.mode === 'include' ? 'include' : 'exclude';
		callback(mode);
	});
}

function setCurrentMode(mode, callback) {
	const value = mode === 'include' ? 'include' : 'exclude';
	browser.storage.local.set({ mode: value }, function () {
		if (typeof callback === 'function') callback();
	});
}

function getActiveListKey(mode) {
	return mode === 'include' ? 'includedDomains' : 'excludedDomains';
}

// Extract domain (hostname) from a full URL
function extractDomain(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch (e) {
		return '';
	}
}

// Prefill the domain input field with the current page's domain
function prefillCurrentDomain() {
	browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (tabs.length > 0 && tabs[0].url) {
			const domain = extractDomain(tabs[0].url);
			// Only prefill if domain is valid and not protected/local
			if (domain && isValidDomain(domain)) {
				document.getElementById('domainInput').value = domain;
			} else if (domain) {
				// Show why the domain couldn't be prefilled
				showAlert('Cannot add this page: protected or local domain.', 'error');
			}
		}
	});
}

// Form submission to add domain to the active list
// When the user clicks "Add Domain", we validate the input and push it
// into the storage list that corresponds to the current mode.
document.getElementById('domainForm').addEventListener('submit', function (event) {
	event.preventDefault();
	const domainInput = document.getElementById('domainInput');
	const domainTrim = domainInput.value.trim(); // Trim whitespace
	const domain = domainTrim.toLowerCase();

	if (domain === '' || isValidDomain(domain) === false) {
		showAlert('Error: Enter a valid domain.');
		return;
	}

	getCurrentMode(function (mode) {
		const key = getActiveListKey(mode);
		browser.storage.local.get(key, function (data) {
			let domains = data[key] || [];
			if (!domains.includes(domain)) {
				domains.push(domain);
				const update = {};
				update[key] = domains;
				browser.storage.local.set(update);
				updateDomainList();
			} else {
				showAlert('Error: This domain is already in the list.');
			}
			domainInput.value = '';
		});
	});
});

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
	// Reads current mode, updates the title and placeholder to reflect it,
	// then renders the appropriate list (included vs excluded) sorted.
	getCurrentMode(function (mode) {
		const key = getActiveListKey(mode);
		// Update title and placeholder based on mode
		const title = document.getElementById('pageTitle');
		const input = document.getElementById('domainInput');
		if (mode === 'include') {
			title.textContent = 'Included Domains Only';
			input.placeholder = 'www.example.com (included)';
		} else {
			title.textContent = 'Excluded Domains';
			input.placeholder = 'www.example.com (excluded)';
		}

		browser.storage.local.get(key, function (data) {
			let domains = data[key] || [];
			// Sort domains in ascending alphabetical order
			domains.sort((a, b) => {
				if (a.startsWith('www.') && b.startsWith('www.')) {
					return a.localeCompare(b);
				}
				if (a.startsWith('www.') && !b.startsWith('www.')) {
					return 1; // a comes after b
				}
				if (!a.startsWith('www.') && b.startsWith('www.')) {
					return -1; // a comes before b
				}
				return a.localeCompare(b);
			});

			const list = document.getElementById('domainList');
			list.innerHTML = '';
			domains.forEach(function (domain) {
				const li = document.createElement('li');
				li.textContent = domain;
				const deleteButton = document.createElement('button');
				deleteButton.textContent = 'Remove';
				deleteButton.addEventListener('click', function () {
					removeDomain(domain, document.getElementById('domainInput'));
				});
				li.appendChild(deleteButton);
				list.appendChild(li);
			});
		});
	});
}

function removeDomain(domain, domainInput) {
	// Removes a domain from the list corresponding to the current mode.
	getCurrentMode(function (mode) {
		const key = getActiveListKey(mode);
		browser.storage.local.get(key, function (data) {
			let domains = data[key] || [];
			const index = domains.indexOf(domain);
			if (index > -1) {
				domains.splice(index, 1);
				const update = {};
				update[key] = domains;
				browser.storage.local.set(update);
				updateDomainList();
			}

			domainInput.value = ''; // Input field cleaner.
		});
	});
}

// Unified popup notification area (top of popup)
// Type can be 'info' (blue-ish) or 'error' (red), styled in CSS.
function showAlert(message, type = 'error') {
	const alertContainer = document.getElementById('alertContainer');
	const alertMessage = document.getElementById('alertMessage');
	alertMessage.textContent = message;
	// apply style modifier
	alertContainer.classList.remove('is-info', 'is-error');
	if (type === 'info') {
		alertContainer.classList.add('is-info');
	} else {
		alertContainer.classList.add('is-error');
	}
	alertContainer.style.display = 'flex';

	// Hiding alert after a while
	setTimeout(function () {
		alertContainer.style.display = 'none';
	}, 5000); // Hide after 5 seconds
}

// Initialize UI based on stored mode
// - Ensures a default mode exists.
// - Sets the selector initial value.
// - Shows a brief info alert about active mode.
// - Re-renders the list and reacts to mode changes.
document.addEventListener('DOMContentLoaded', function () {
	// Ensure mode has a default
	browser.storage.local.get('mode', function (data) {
		const mode = data.mode === 'include' ? 'include' : 'exclude';
		if (!data.mode) {
			setCurrentMode('exclude');
		}
		const modeSelect = document.getElementById('modeSelect');
		if (modeSelect) {
			modeSelect.value = mode;
			// Announce current mode on load
			showModeInfo(mode);
			modeSelect.addEventListener('change', function () {
				const newMode = this.value;
				setCurrentMode(newMode, function () {
					updateDomainList();
					// Announce mode change and prompt refresh
					showModeInfo(newMode, true);
				});
			});
		} else {
			// If selector missing, still announce current mode
			showModeInfo(mode);
		}
		updateDomainList();
		prefillCurrentDomain();
	});
});

// Helper: show active mode + refresh hint
// Keeps messaging consistent and centralized.
function showModeInfo(mode, switched = false) {
	const human = mode === 'include' ? 'Include-only (default block)' : 'Exclude list (default allow)';
	const prefix = switched ? 'Mode changed: ' : 'Active mode: ';
	const hint = switched ? '\nPlease refresh affected page(s) to apply.' : '';
	showAlert(prefix + human + '.' + hint, 'info');
}
