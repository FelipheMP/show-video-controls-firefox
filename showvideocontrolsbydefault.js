// =============================
// Content script: show controls
// =============================
// This script runs on webpages (as a content script). It:
// 1) Optionally removes site-specific overlays (e.g., Instagram, 9GAG) that block clicks.
// 2) Enables HTML <video> controls automatically when allowed by user settings.
// 3) Reacts to dynamic DOM changes via a MutationObserver.
//
// Behavior is controlled by two lists stored in browser.storage.local:
// - excludedDomains: when in Exclude mode (default allow), these sites are disabled.
// - includedDomains: when in Include-only mode (default block), only these sites are enabled.
//
// We first check whether the extension should act on the current domain (shouldEnableOnThisDomain)
// and only then we remove overlays and enable controls.

let observer;

// Observe DOM changes to handle dynamically inserted videos/overlays.
function setupObserver() {
	// Configuration of the observer
	const config = { childList: true, subtree: true };

	// Callback function to execute when mutations are observed
    // Run for any added/removed nodes in the subtree (new videos/overlays)
	const callback = function (mutationsList, observer) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				shouldEnableOnThisDomain(function (shouldEnable) {
					// Site-specific overlay removals only when enabled for this domain
					if (shouldEnable) {
						if (window.location.hostname.includes("9gag.com")) {
							removeOverlays9gag();
						}

						if (window.location.hostname.includes("instagram.com")) {
							removeOverlaysInstagram();
							adjustInstagramVideoOverlayButtonsMargins();
						}
					}
					// Then apply (or skip) video controls based on mode/lists
					videoPlayerShowControls();
				});
			}
		}
	};

	// Create an observer instance linked to the callback function
	observer = new MutationObserver(callback);

	// Start observing the document with the configured parameters
	observer.observe(document.body, config);
}

// Scan all <video> elements and enable controls when allowed for this domain.
function videoPlayerShowControls() {
    const currentDomain = window.location.hostname.toLowerCase();
    const keys = ['mode', 'excludedDomains', 'includedDomains'];
    browser.storage.local.get(keys, function (data) {
        const mode = data.mode === 'include' ? 'include' : 'exclude';
        const excluded = (data.excludedDomains || []).map(d => (d || '').toLowerCase());
        const included = (data.includedDomains || []).map(d => (d || '').toLowerCase());

        let vidAtribs = document.getElementsByTagName("video");
        for (const element of vidAtribs) {
            let changeAtribs = false;
            if (element.getAttribute("controls") === null || element.getAttribute("controls") === "false") {
                changeAtribs = true;
            }
            if (element.hasAttribute("src")) {
                if (!element.getAttribute("src")) {
                    changeAtribs = false;
                }
            }
            if (!changeAtribs) continue;

            let shouldEnable = false;
            if (mode === 'include') {
                // Only enable if domain is explicitly included (matches base or any subdomain)
                shouldEnable = listMatchesDomain(included, currentDomain);
            } else {
                // Default allow unless explicitly excluded
                shouldEnable = !listMatchesDomain(excluded, currentDomain);
            }

            if (shouldEnable) {
                element.setAttribute("controls", "true");
            }
        }
    });
}

// Returns true if any entry in list matches hostname exactly or as a suffix (subdomain)
// Example: 'instagram.com' matches 'instagram.com', 'www.instagram.com', 'm.instagram.com'.
function listMatchesDomain(list, hostname) {
    const h = (hostname || '').toLowerCase();
    return (list || []).some((entry) => {
        const e = (entry || '').toLowerCase().replace(/^www\./, '');
        if (!e) return false;
        return h === e || h.endsWith('.' + e);
    });
}

// Decide whether the extension should act on this domain based on mode and lists.
// - Include-only mode: only enabled for domains in 'includedDomains'.
// - Exclude mode: enabled for all domains except those in 'excludedDomains'.
function shouldEnableOnThisDomain(callback) {
    const current = window.location.hostname.toLowerCase();
    const keys = ['mode', 'excludedDomains', 'includedDomains'];
    browser.storage.local.get(keys, function (data) {
        const mode = data.mode === 'include' ? 'include' : 'exclude';
        const excluded = (data.excludedDomains || []).map(d => (d || '').toLowerCase());
        const included = (data.includedDomains || []).map(d => (d || '').toLowerCase());

        let shouldEnable = false;
        if (mode === 'include') {
            shouldEnable = listMatchesDomain(included, current);
        } else {
            shouldEnable = !listMatchesDomain(excluded, current);
        }
        callback(shouldEnable);
    });
}

// Remove 9GAG overlay UI that may block clicks.
function removeOverlays9gag() {
    document.querySelectorAll(".sound-toggle, .length, .presenting").forEach(element => {
        element.remove(); // element.style.display = "none"; <- just hiding it instead option
    });
}

// On Instagram, block the generic overlay layers from intercepting clicks.
// We skip elements with empty class attribute (class="") to keep wrappers clickable.
function removeOverlaysInstagram() {
    // Skip elements that have an explicitly empty class attribute: class=""
    const selector = 'div[data-visualcompletion="ignore"]:not([class=""])';
    document.querySelectorAll(selector).forEach(element => {
        // Disable event capturing and mark as processed.
        element.style.pointerEvents = 'none';
        element.setAttribute('data-igblock', 'true');
    });
}

// On Instagram, shift overlay buttons up a bit so native controls are easier to access.
function adjustInstagramVideoOverlayButtonsMargins() {
    // Get all elements with the classes "_aswp", "_aswq", "_aswu", "_asw_", and "_asx2".
    const nodes = document.querySelectorAll('button._aswp._aswq._aswu._asw_._asx2');
    nodes.forEach(element => {
        // Check if the element's margin-bottom style is not set to 40px.
        if (element.style.marginBottom !== '40px') {
            // Set the margin-bottom style to 40px.
            element.style.marginBottom = '40px';
            // Mark the element as processed.
            element.setAttribute('data-igmarginfix', 'true');
        }
    });
}

// Initial run: remove overlays only when enabled for this domain, then apply controls.
shouldEnableOnThisDomain(function (shouldEnable) {
    if (shouldEnable) {
        if (window.location.hostname.includes("9gag.com")) {
            removeOverlays9gag();
        }
        if (window.location.hostname.includes("instagram.com")) {
            removeOverlaysInstagram();
            adjustInstagramVideoOverlayButtonsMargins();
        }
    }
    videoPlayerShowControls();
});

// Setup the observer to monitor for changes in the DOM
setupObserver();