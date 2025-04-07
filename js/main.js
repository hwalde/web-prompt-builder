document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let profiles = {};
    let activeProfileName = null;
    let currentRecords = [];
    let xmlRootTag = 'prompt';

    // DOM Elements
    const profileSelect = document.getElementById('profile-select');
    const newProfileBtn = document.getElementById('new-profile-btn');
    const renameProfileBtn = document.getElementById('rename-profile-btn');
    const deleteProfileBtn = document.getElementById('delete-profile-btn');
    const addRecordBtn = document.getElementById('add-record-btn');
    const generateTraditionalBtn = document.getElementById('generate-traditional-btn');
    const generateXmlBtn = document.getElementById('generate-xml-btn');
    const xmlRootTagInput = document.getElementById('xml-root-tag');
    const recordsTbody = document.getElementById('records-tbody');

    // --- Initialization ---

    function initializeApp() {
        loadData();
        setupEventListeners();
        renderUI();
        // DragDrop will be initialized in renderRecords
        UI.init({ // Provide callbacks to UI module
            onSelect: handleRecordSelect,
            onEdit: handleRecordEdit,
            onDelete: handleRecordDelete
        });
    }

    function loadData() {
        profiles = Storage.loadProfiles();
        activeProfileName = Storage.loadActiveProfileName();
        xmlRootTag = Storage.loadXmlRootTag();

        // Ensure there is at least a default profile if none exist
        if (Object.keys(profiles).length === 0) {
            const defaultName = "Default Profile";
            profiles[defaultName] = { records: [] };
            Storage.saveProfiles(profiles);
            activeProfileName = defaultName;
            Storage.saveActiveProfileName(activeProfileName);
        }

        // Ensure the active profile exists, otherwise select the first one
        if (!activeProfileName || !profiles[activeProfileName]) {
            activeProfileName = Object.keys(profiles)[0] || null;
            Storage.saveActiveProfileName(activeProfileName);
        }

        // Load records for the active profile
        loadCurrentRecords();
    }

    function loadCurrentRecords() {
        if (activeProfileName && profiles[activeProfileName]) {
            // Make a copy to avoid direct manipulation issues if needed elsewhere
            currentRecords = [...(profiles[activeProfileName].records || [])];
        } else {
            currentRecords = [];
        }
    }

    function saveData() {
        // Save the current state of records for the active profile
         if (activeProfileName && profiles[activeProfileName]) {
             profiles[activeProfileName].records = currentRecords;
         }
         // Save all profiles (includes the potentially updated records of the active one)
         Storage.saveProfiles(profiles);
         // Save active profile name (might have changed)
         Storage.saveActiveProfileName(activeProfileName);
          // Save XML root tag
         Storage.saveXmlRootTag(xmlRootTag);
    }

    function renderUI() {
        UI.populateProfileSelect(profiles, activeProfileName);
        renderRecords();
        UI.updateXmlRootTagInput(xmlRootTag);
    }

    function renderRecords() {
        const recordsTbody = document.getElementById('records-tbody');
        const currentProfileNameEl = document.getElementById('current-profile-name');
        
        currentProfileNameEl.textContent = activeProfileName;
        recordsTbody.innerHTML = '';

        // Check if there are no records
        if (currentRecords.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4; // Updated to 4 columns (drag + select + name + actions)
            cell.textContent = 'Keine Datensätze für dieses Profil vorhanden.';
            cell.style.textAlign = 'center';
            cell.style.fontStyle = 'italic';
            cell.style.color = 'var(--text-muted)';
            row.appendChild(cell);
            recordsTbody.appendChild(row);
            return;
        }

        currentRecords.forEach(record => {
            const row = document.createElement('tr');
            row.dataset.id = record.id;
            
            row.innerHTML = `
                <td class="col-drag">
                    <div class="drag-handle" title="Ziehen um zu verschieben">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                        </svg>
                    </div>
                </td>
                <td class="col-select">
                    <input type="checkbox" data-id="${record.id}" class="record-checkbox" ${record.selected ? 'checked' : ''}>
                </td>
                <td class="col-name">${Utils.escapeHtml(record.name)}</td>
                <td class="col-actions">
                    <div class="action-buttons">
                        <button class="btn btn-primary edit-record-btn" data-id="${record.id}">Bearbeiten</button>
                        <button class="btn btn-danger delete-record-btn" data-id="${record.id}">Löschen</button>
                    </div>
                </td>
            `;
            
            recordsTbody.appendChild(row);
        });
        
        // Add event listeners to the new buttons and checkboxes
        recordsTbody.querySelectorAll('.record-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (handleRecordSelect) {
                    handleRecordSelect(e.target.dataset.id, e.target.checked);
                }
            });
        });
        
        recordsTbody.querySelectorAll('.edit-record-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (handleRecordEdit) {
                    handleRecordEdit(e.target.dataset.id);
                }
            });
        });
        
        recordsTbody.querySelectorAll('.delete-record-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (handleRecordDelete && confirm(`Möchten Sie diesen Datensatz wirklich löschen?`)) {
                    handleRecordDelete(e.target.dataset.id);
                }
            });
        });
        
        // Re-initialize DragDrop with the current tbody
        DragDrop.init(recordsTbody, handleRecordReordering);
    }

    // --- Event Listeners Setup ---

    function setupEventListeners() {
        profileSelect.addEventListener('change', handleProfileChange);
        newProfileBtn.addEventListener('click', handleNewProfile);
        renameProfileBtn.addEventListener('click', handleRenameProfile);
        deleteProfileBtn.addEventListener('click', handleDeleteProfile);
        addRecordBtn.addEventListener('click', handleAddRecord);
        generateTraditionalBtn.addEventListener('click', handleGenerateTraditional);
        generateXmlBtn.addEventListener('click', handleGenerateXml);
        xmlRootTagInput.addEventListener('input', Utils.debounce(handleXmlRootTagChange, 300));
         xmlRootTagInput.addEventListener('change', handleXmlRootTagChange); // Save on blur/enter too
    }

    // --- Event Handlers ---

    function handleProfileChange(e) {
        const newActiveProfile = e.target.value;
        if (newActiveProfile && profiles[newActiveProfile]) {
            activeProfileName = newActiveProfile;
            Storage.saveActiveProfileName(activeProfileName); // Persist selection immediately
            loadCurrentRecords();
            renderUI(); // Re-render table for the new profile
        }
    }

    function handleNewProfile() {
        const newName = prompt("Geben Sie einen Namen für das neue Profil ein:");
        if (newName && newName.trim()) {
            const trimmedName = newName.trim();
            if (profiles[trimmedName]) {
                alert(`Ein Profil mit dem Namen "${trimmedName}" existiert bereits.`);
            } else {
               if (Storage.addProfile(trimmedName)) {
                    profiles = Storage.loadProfiles(); // Reload profiles state
                    activeProfileName = trimmedName; // Switch to the new profile
                    loadCurrentRecords();
                    saveData(); // Saves the new active profile name
                    renderUI(); // Update the dropdown and table
               } else {
                    alert("Profil konnte nicht erstellt werden.");
               }
            }
        }
    }

    function handleRenameProfile() {
         if (!activeProfileName) {
             alert("Bitte wählen Sie zuerst ein Profil aus.");
             return;
         }
        const newName = prompt(`Neuen Namen für Profil "${activeProfileName}" eingeben:`, activeProfileName);
        if (newName && newName.trim() && newName.trim() !== activeProfileName) {
            const trimmedName = newName.trim();
             if (profiles[trimmedName]) {
                 alert(`Ein Profil mit dem Namen "${trimmedName}" existiert bereits.`);
             } else {
                 if (Storage.renameProfile(activeProfileName, trimmedName)) {
                     const oldName = activeProfileName;
                     profiles = Storage.loadProfiles(); // Reload profiles state
                     activeProfileName = trimmedName; // Update active name
                     // No need to reload records, they are associated with the renamed profile
                     saveData(); // Saves potentially updated active profile name
                     renderUI(); // Update dropdown selection and title
                     alert(`Profil "<span class="math-inline">\{oldName\}" wurde in "</span>{trimmedName}" umbenannt.`);
                 } else {
                     alert("Profil konnte nicht umbenannt werden.");
                 }
             }
        }
    }

    function handleDeleteProfile() {
        if (!activeProfileName) {
            alert("Bitte wählen Sie zuerst ein Profil zum Löschen aus.");
            return;
        }
        if (confirm(`Möchten Sie das Profil "${activeProfileName}" und alle zugehörigen Daten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
             const nameToDelete = activeProfileName;
            if (Storage.deleteProfile(nameToDelete)) {
                 profiles = Storage.loadProfiles(); // Reload profiles state
                 // Select the first available profile or null
                 activeProfileName = Object.keys(profiles)[0] || null;
                 loadCurrentRecords();
                 saveData(); // Saves updated profiles and potentially new active name
                 renderUI(); // Update UI
                 alert(`Profil "${nameToDelete}" wurde gelöscht.`);
            } else {
                alert("Profil konnte nicht gelöscht werden.");
            }
        }
    }

    function handleAddRecord() {
        if (!activeProfileName) {
            alert("Bitte wählen Sie zuerst ein Profil aus, um einen Datensatz hinzuzufügen.");
            return;
        }
        const newRecord = {
            id: Utils.generateUUID(),
            name: `Neuer Datensatz ${currentRecords.length + 1}`,
            content: '',
            escape: false,
            selected: true // Default to selected
        };
        currentRecords.push(newRecord);
        saveData();
        renderUI();
        // Optional: Scroll to the new record or open modal directly
    }

    // Called by UI module when a record's checkbox changes
    function handleRecordSelect(recordId, isSelected) {
        const record = currentRecords.find(r => r.id === recordId);
        if (record) {
            record.selected = isSelected;
            saveData();
            // No need to re-render the whole table, checkbox is already updated by browser
        }
    }

    // Called by UI module when edit button is clicked
    function handleRecordEdit(recordId) {
        const record = currentRecords.find(r => r.id === recordId);
        if (record) {
            // Pass the save function for the modal to call
            Modal.open(record, handleModalSave);
        } else {
            console.error("Record to edit not found:", recordId);
        }
    }

    // Called by Modal module when data should be saved
    function handleModalSave(updatedData) {
         const recordIndex = currentRecords.findIndex(r => r.id === updatedData.id);
         if (recordIndex > -1) {
             // Update only the fields edited in the modal, keep 'selected' status
             currentRecords[recordIndex] = {
                 ...currentRecords[recordIndex], // Keep existing properties like 'selected'
                 name: updatedData.name,
                 content: updatedData.content,
                 escape: updatedData.escape
             };
             saveData();
             renderUI(); // Re-render table to show updated name
         } else {
             console.error("Record to save not found:", updatedData.id);
         }
    }

    // Called by UI module when delete button is clicked (after confirmation)
    function handleRecordDelete(recordId) {
        currentRecords = currentRecords.filter(r => r.id !== recordId);
        saveData();
        renderUI(); // Re-render table
    }

    function handleRecordReordering(draggedId, targetId, insertBefore) {
        // Find indices in the currentRecords array
        const draggedIndex = currentRecords.findIndex(record => record.id === draggedId);
        const targetIndex = currentRecords.findIndex(record => record.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Could not find items for reordering');
            return;
        }
        
        // Remove the dragged item
        const [draggedItem] = currentRecords.splice(draggedIndex, 1);
        
        // Calculate new position, accounting for the removed item
        let newPosition = targetIndex;
        if (draggedIndex < targetIndex) {
            newPosition -= 1;
        }
        
        // If inserting after, add 1 to the position
        if (!insertBefore) {
            newPosition += 1;
        }
        
        // Insert at the new position
        currentRecords.splice(newPosition, 0, draggedItem);
        
        // Save and re-render
        saveData();
        renderUI();
    }

    function handleGenerateTraditional() {
        const selectedRecords = currentRecords.filter(r => r.selected);
        if (selectedRecords.length === 0) {
            alert("Bitte wählen Sie mindestens einen Datensatz zum Generieren aus.");
            return;
        }

        const promptParts = selectedRecords.map(record => {
            let content = record.content || '';
            if (record.escape) {
                // Add ``` on separate lines, ensure no extra newlines if content is empty
                 content = content.trim() === '' ? '```\n```' : `\`\`\`\n${content}\n\`\`\``;
            }
            return content;
        });

        const finalPrompt = promptParts.join('\n\n'); // Join with two newlines

        copyToClipboard(finalPrompt, generateTraditionalBtn);
    }

    function handleGenerateXml() {
        const selectedRecords = currentRecords.filter(r => r.selected);
        if (selectedRecords.length === 0) {
            alert("Bitte wählen Sie mindestens einen Datensatz zum Generieren aus.");
            return;
        }

        const rootTagName = Utils.escapeXmlName(xmlRootTag.trim() || 'prompt');
        let xmlString = `<${rootTagName}>\n`;

        selectedRecords.forEach(record => {
            const tagName = Utils.escapeXmlName(record.name || 'item');
            const content = Utils.escapeXmlContent(record.content || '');
            xmlString += `  <${tagName}>${content}</${tagName}>\n`; // Indent for readability
        });

        xmlString += `</${rootTagName}>`;

        copyToClipboard(xmlString, generateXmlBtn);
    }

    function handleXmlRootTagChange(e) {
         xmlRootTag = e.target.value.trim();
         // Save immediately or rely on the general saveData triggered elsewhere
         Storage.saveXmlRootTag(xmlRootTag); // Save this specific value
    }

    function copyToClipboard(text, buttonElement) {
        // Check if Clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    Utils.showCopyFeedback("Prompt in die Zwischenablage kopiert!");
                    if (buttonElement) {
                        Utils.showCheckAnimation(buttonElement);
                    }
                })
                .catch(err => {
                    console.error('Fehler beim Kopieren in die Zwischenablage: ', err);
                    fallbackCopyToClipboard(text, buttonElement);
                });
        } else {
            // Fallback method for browsers without clipboard API support
            fallbackCopyToClipboard(text, buttonElement);
        }
    }
    
    function fallbackCopyToClipboard(text, buttonElement) {
        try {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = text;
            
            // Make the textarea out of viewport
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            // Execute the copy command
            const successful = document.execCommand('copy');
            
            // Remove the temporary element
            document.body.removeChild(textarea);
            
            if (successful) {
                Utils.showCopyFeedback("Prompt in die Zwischenablage kopiert!");
                if (buttonElement) {
                    Utils.showCheckAnimation(buttonElement);
                }
            } else {
                throw new Error('Copy command was unsuccessful');
            }
        } catch (err) {
            console.error('Fallback: Fehler beim Kopieren in die Zwischenablage: ', err);
            Utils.showCopyFeedback("Fehler beim Kopieren!", 3000);
            alert("Konnte nicht in die Zwischenablage kopieren. Prüfen Sie die Browser-Berechtigungen oder kopieren Sie manuell aus der Konsole (F12).");
            console.log("--- Zu kopierender Text ---");
            console.log(text);
            console.log("--------------------------");
        }
    }

    // --- Start the application ---
    initializeApp();
});