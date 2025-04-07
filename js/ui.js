const UI = (() => {
    const profileSelect = document.getElementById('profile-select');
    const currentProfileNameSpan = document.getElementById('current-profile-name');
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
            option.textContent = 'Keine Profile vorhanden';
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
         // Update displayed profile name
        updateCurrentProfileName(activeProfileName);
    }

     function updateCurrentProfileName(profileName) {
        if (currentProfileNameSpan) {
             currentProfileNameSpan.textContent = profileName || 'Kein Profil ausgewählt';
        }
    }

    function renderRecordsTable(records) {
        if (!recordsTbody) return;
        recordsTbody.innerHTML = ''; // Clear existing rows

        if (!records || records.length === 0) {
            const row = recordsTbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3; // Span across all columns
            cell.textContent = 'Keine Datensätze für dieses Profil vorhanden.';
            cell.style.textAlign = 'center';
            cell.style.fontStyle = 'italic';
            cell.style.color = 'var(--text-muted)';
            return;
        }

        records.forEach((record, index) => {
            const row = recordsTbody.insertRow();
            row.dataset.id = record.id; // Store ID on the row
            row.draggable = true; // Make row draggable
            
            // Add double-click handler to trigger edit functionality
            row.addEventListener('dblclick', () => {
                if (recordActionCallbacks.onEdit) {
                    recordActionCallbacks.onEdit(record.id);
                }
            });

            // 1. Select Checkbox
            const selectCell = row.insertCell();
            selectCell.classList.add('col-select');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = record.selected || false;
            checkbox.dataset.id = record.id;
            checkbox.title = "Diesen Datensatz für die Generierung auswählen";
            checkbox.addEventListener('change', (e) => {
                if (recordActionCallbacks.onSelect) {
                    recordActionCallbacks.onSelect(record.id, e.target.checked);
                }
            });
            selectCell.appendChild(checkbox);

            // 2. Name
            const nameCell = row.insertCell();
            nameCell.classList.add('col-name');
            nameCell.textContent = record.name || '(Unbenannt)';

            // 3. Actions
            const actionsCell = row.insertCell();
            actionsCell.classList.add('col-actions');
            const buttonDiv = document.createElement('div');
            buttonDiv.classList.add('action-buttons');

            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Bearbeiten';
            editButton.classList.add('btn', 'btn-warning');
            editButton.dataset.id = record.id;
            editButton.addEventListener('click', () => {
                if (recordActionCallbacks.onEdit) {
                    recordActionCallbacks.onEdit(record.id);
                }
            });
            buttonDiv.appendChild(editButton);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Löschen';
            deleteButton.classList.add('btn', 'btn-danger');
            deleteButton.dataset.id = record.id;
            deleteButton.addEventListener('click', () => {
                if (recordActionCallbacks.onDelete) {
                     // Add confirmation before deleting
                    if (confirm(`Möchten Sie den Datensatz "${record.name || '(Unbenannt)'}" wirklich löschen?`)) {
                        recordActionCallbacks.onDelete(record.id);
                    }
                }
            });
            buttonDiv.appendChild(deleteButton);

            actionsCell.appendChild(buttonDiv);
        });
    }

     function updateXmlRootTagInput(tagName) {
         if (xmlRootTagInput) {
             xmlRootTagInput.value = tagName || 'prompt';
         }
     }

    return {
        init,
        populateProfileSelect,
        updateCurrentProfileName,
        renderRecordsTable,
        updateXmlRootTagInput
    };
})();

window.UI = UI;