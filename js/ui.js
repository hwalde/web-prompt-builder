const UI = (() => {
    const profileSelect = document.getElementById('profile-select');
    const recordsTbody = document.getElementById('records-tbody');
    const xmlRootTagInput = document.getElementById('xml-root-tag');

    let recordActionCallbacks = {}; // Store callbacks for actions

    function init(callbacks) {
        recordActionCallbacks = callbacks; // { onSelect, onEdit, onDelete }
    }

    function populateProfileSelect(profiles, activeProfileName) {
        if (!profileSelect) return;
        profileSelect.innerHTML = ''; // Clear existing options

        const profileNames = Object.keys(profiles);

        if (profileNames.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No profiles available';
            option.disabled = true;
            profileSelect.appendChild(option);
        } else {
            profileNames.sort().forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                if (name === activeProfileName) {
                    option.selected = true;
                }
                profileSelect.appendChild(option);
            });
        }
    }

    function renderRecordsTable(records) {
        console.log('UI.renderRecordsTable is deprecated, use renderRecords in main.js instead');
        // Keep this function as a no-op for backwards compatibility
    }

    function updateXmlRootTagInput(tagName) {
        if (xmlRootTagInput) {
            xmlRootTagInput.value = tagName || 'prompt';
        }
    }

    return {
        init,
        populateProfileSelect,
        renderRecordsTable,
        updateXmlRootTagInput
    };
})();

window.UI = UI;