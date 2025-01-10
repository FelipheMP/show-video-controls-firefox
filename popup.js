document.getElementById('domainForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const domainInput = document.getElementById('domainInput');
    const domainTrim = domainInput.value.trim(); // Trim whitespace
    const domain = domainTrim.toLowerCase();

    if (domain === '' || isValidDomain(domain) === false) {
        showAlert('Error: Enter a valid domain.');
        return;
    }

    browser.storage.local.get('excludedDomains', function (data) {
        let domains = data.excludedDomains || [];
        if (!domains.includes(domain)) {
            domains.push(domain);
            browser.storage.local.set({ excludedDomains: domains });
            updateDomainList();
        } else {
            showAlert("Error: This domain is already in the list.")
        }

        domainInput.value = ''; // Input field cleaner.
    });
});

function isValidDomain(domain) {
    // Regex to validate domain names (e.g., "example.com")
    // - (?!:\/\/): Disallows protocols like "http://"
    // - ([a-zA-Z0-9-_]+\.): Matches subdomains and the main domain part
    // - [a-zA-Z]{2,}: Ensures the top-level domain (TLD) is at least 2 letters long (e.g., ".com", ".br")
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

function updateDomainList() {
    browser.storage.local.get('excludedDomains', function (data) {
        let domains = data.excludedDomains || [];
        // Sort domains in ascending alphabetical order
        domains.sort((a, b) => {
            // Check if both domains start with "www.", then sort normally
            if (a.startsWith('www.') && b.startsWith('www.')) {
                return a.localeCompare(b);
            }
            // If one domain starts with "www." and the other doesn't,
            // the one without "www." comes first unless it's alphabetically after "www."
            if (a.startsWith('www.') && !b.startsWith('www.')) {
                return 1; // a comes after b
            }
            if (!a.startsWith('www.') && b.startsWith('www.')) {
                return -1; // a comes before b
            }
            // If neither or both start with "www.", sort normally
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
}

function removeDomain(domain, domainInput) {
    browser.storage.local.get('excludedDomains', function (data) {
        let domains = data.excludedDomains || [];
        const index = domains.indexOf(domain);
        if (index > -1) {
            domains.splice(index, 1);
            browser.storage.local.set({ excludedDomains: domains });
            updateDomainList();
        }

        domainInput.value = ''; // Input field cleaner.
    });
}

function showAlert(message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertContainer.style.display = 'flex';

    // Hiding alert after a while
    setTimeout(function () {
        alertContainer.style.display = 'none';
    }, 5000); // Hide after 5 seconds
}

updateDomainList();
