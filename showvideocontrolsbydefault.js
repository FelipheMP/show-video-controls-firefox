let observer;

function setupObserver() {
	// Configuration of the observer
	const config = { childList: true, subtree: true };

	// Callback function to execute when mutations are observed
	const callback = function (mutationsList, observer) {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
                // Site-specific overlay removals first
                if (window.location.hostname.includes("9gag.com")) {
                    removeOverlays9gag();
                }
                if (window.location.hostname.includes("instagram.com")) {
                    removeOverlaysInstagram();
                    adjustInstagramVideoOverlayButtonsMargins();
                }

                // Then apply video controls
				videoPlayerShowControls();
			}
		}
	};

	// Create an observer instance linked to the callback function
	observer = new MutationObserver(callback);

	// Start observing the document with the configured parameters
	observer.observe(document.body, config);
}

function videoPlayerShowControls() {
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
		if (changeAtribs) {
			browser.storage.local.get('excludedDomains', function (data) {
				const domains = data.excludedDomains || [];
				const currentDomain = window.location.hostname;
				// Check if the current domain is not in the excluded domains list
				if (!domains.includes(currentDomain)) {
					element.setAttribute("controls", "true");
				}
			});
		}
	}
}

function removeOverlays9gag() {
    document.querySelectorAll(".sound-toggle, .length, .presenting").forEach(element => {
        element.remove(); // element.style.display = "none"; <- just hiding it instead option
    });
}

function removeOverlaysInstagram() {
    const selector = 'div[data-visualcompletion="ignore"]';
    document.querySelectorAll(selector).forEach(element => {
        // Disable event capturing and mark as processed
        element.style.pointerEvents = 'none';
        element.setAttribute('data-igblock', 'true');
    });
}

function adjustInstagramVideoOverlayButtonsMargins() {
    const nodes = document.querySelectorAll('button._aswp._aswq._aswu._asw_._asx2');
    nodes.forEach(element => {
        if (element.style.marginBottom !== '35px') {
            element.style.marginBottom = '35px';
            element.setAttribute('data-igmarginfix', 'true');
        }
    });
}

// Remove overlays first for known sites, then apply controls
if (window.location.hostname.includes("9gag.com")) {
    removeOverlays9gag();
}
if (window.location.hostname.includes("instagram.com")) {
    removeOverlaysInstagram();
    adjustInstagramVideoOverlayButtonsMargins();
}
videoPlayerShowControls();

// Setup the observer to monitor for changes in the DOM
setupObserver();