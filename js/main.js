document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let profiles = {};
    let activeProfileName = null;
    let currentRecords = [];

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
    const currentTaskTextarea = document.getElementById('current-task-textarea');
    const importProfileBtn = document.getElementById('import-profile-btn');
    const exportProfileBtn = document.getElementById('export-profile-btn');

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

        // Initialize ImportExport module with dependencies
        ImportExport.init({
            profiles: profiles, // Pass the state object
            getActiveProfileName: () => activeProfileName, // Function to get current name
            updateActiveProfileName: (newName) => { activeProfileName = newName; }, // Function to set current name
            Storage: Storage, 
            Utils: Utils, 
            UI: UI,
            loadCurrentRecords: loadCurrentRecords,
            renderUI: renderUI,
            renderCurrentTask: renderCurrentTask
        });
    }

    function loadData() {
        profiles = Storage.loadProfiles();
        activeProfileName = Storage.loadActiveProfileName();

        // Ensure there is at least a default profile if none exist
        if (Object.keys(profiles).length === 0) {
            const defaultName = "Default Profile";
            profiles[defaultName] = { records: [] };
            Storage.saveProfiles(profiles);
            activeProfileName = defaultName;
            Storage.saveActiveProfileName(activeProfileName);
            Storage.saveCurrentTask(activeProfileName, '');
        }

        // Ensure the active profile exists, otherwise select the first one
        if (!activeProfileName || !profiles[activeProfileName]) {
            activeProfileName = Object.keys(profiles)[0] || null;
            Storage.saveActiveProfileName(activeProfileName);
        }

        // Load records and current task for the active profile
        loadCurrentRecords();
        // Update XML root tag input based on the loaded active profile
        const currentProfile = profiles[activeProfileName];
        const currentXmlRootTag = currentProfile?.xmlRootTag || 'prompt';
        if (xmlRootTagInput) xmlRootTagInput.value = currentXmlRootTag;

        exportProfileBtn.addEventListener('click', ImportExport.handleExportProfile); // Use ImportExport module
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
    }

    function renderUI() {
        UI.populateProfileSelect(profiles, activeProfileName);
        renderRecords();
        renderCurrentTask();
        // Update XML root tag input based on the current active profile
        const currentProfile = profiles[activeProfileName];
        const currentXmlRootTag = currentProfile?.xmlRootTag || 'prompt';
        UI.updateXmlRootTagInput(currentXmlRootTag);
    }

    function renderCurrentTask() {
        if (currentTaskTextarea) {
            const taskText = activeProfileName ? Storage.loadCurrentTask(activeProfileName) : '';
            currentTaskTextarea.value = taskText;
        }
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
            cell.textContent = 'No records available for this profile.';
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
                    <div class="drag-handle" title="Drag to reorder">
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
                        <button class="btn btn-primary edit-record-btn" data-id="${record.id}">Edit</button>
                        <button class="btn btn-danger delete-record-btn" data-id="${record.id}">Delete</button>
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
                if (handleRecordDelete && confirm(`Are you sure you want to delete this record?`)) {
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
        xmlRootTagInput.addEventListener('change', handleXmlRootTagChange);
        currentTaskTextarea.addEventListener('input', Utils.debounce(handleCurrentTaskChange, 500));
        importProfileBtn.addEventListener('click', ImportExport.handleImportProfile);
        exportProfileBtn.addEventListener('click', ImportExport.handleExportProfile);
    }

    // --- Event Handlers ---

    function handleProfileChange(e) {
        const newActiveProfile = e.target.value;
        if (newActiveProfile && profiles[newActiveProfile]) {
            activeProfileName = newActiveProfile;
            Storage.saveActiveProfileName(activeProfileName); // Persist selection immediately
            loadCurrentRecords();
            renderUI(); // Re-render table and load current task for the new profile
            // Explicitly update xml input value after profile change handled by renderUI
            const currentProfile = profiles[activeProfileName];
            const currentXmlRootTag = currentProfile?.xmlRootTag || 'prompt';
            if (xmlRootTagInput) xmlRootTagInput.value = currentXmlRootTag;
        }
    }

    function handleNewProfile() {
        const newName = prompt("Enter a name for the new profile:");
        if (newName && newName.trim()) {
            const trimmedName = newName.trim();
            if (profiles[trimmedName]) {
                alert(`A profile named "${trimmedName}" already exists.`);
            } else {
               if (Storage.addProfile(trimmedName)) {
                    profiles = Storage.loadProfiles(); // Reload profiles state
                    activeProfileName = trimmedName; // Switch to the new profile
                    loadCurrentRecords();
                    saveData(); // Saves the new active profile name
                    Storage.saveCurrentTask(activeProfileName, '');
                    renderUI(); // Update the dropdown, table, and task area
               } else {
                    alert("Could not create profile.");
               }
            }
        }
    }

    function handleRenameProfile() {
         if (!activeProfileName) {
             alert("Please select a profile first.");
             return;
         }
        const newName = prompt(`Enter a new name for profile "${activeProfileName}":`, activeProfileName);
        if (newName && newName.trim() && newName.trim() !== activeProfileName) {
            const trimmedName = newName.trim();
             if (profiles[trimmedName]) {
                 alert(`A profile named "${trimmedName}" already exists.`);
             } else {
                 if (Storage.renameProfile(activeProfileName, trimmedName)) {
                     const oldName = activeProfileName;
                     profiles = Storage.loadProfiles(); // Reload profiles state
                     activeProfileName = trimmedName; // Update active name
                     // No need to reload records, they are associated with the renamed profile
                     saveData(); // Saves potentially updated active profile name
                     renderUI(); // Update dropdown selection, title, and task area
                     alert(`Profile "${oldName}" was renamed to "${trimmedName}".`);
                 } else {
                     alert("Could not rename profile.");
                 }
             }
        }
    }

    function handleDeleteProfile() {
        if (!activeProfileName) {
            alert("Please select a profile to delete first.");
            return;
        }
        if (confirm(`Are you sure you want to delete the profile "${activeProfileName}" and all its data? This action cannot be undone!`)) {
             const nameToDelete = activeProfileName;
            if (Storage.deleteProfile(nameToDelete)) {
                 profiles = Storage.loadProfiles(); // Reload profiles state
                 Storage.deleteCurrentTask(nameToDelete);
                 // Select the first available profile or null
                 activeProfileName = Object.keys(profiles)[0] || null;
                 loadCurrentRecords();
                 saveData(); // Saves updated profiles and potentially new active name
                 renderUI(); // Update UI
                 alert(`Profile "${nameToDelete}" was deleted.`);
            } else {
                alert("Could not delete profile.");
            }
        }
    }

    function handleAddRecord() {
        if (!activeProfileName) {
            alert("Please select a profile first to add a record.");
            return;
        }
        const newRecord = {
            id: Utils.generateUUID(),
            name: `New Record ${currentRecords.length + 1}`,
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
        const taskText = currentTaskTextarea.value.trim();

        if (selectedRecords.length === 0 && !taskText) {
             alert("Please select at least one record or enter a task to generate.");
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

        let finalPrompt = promptParts.join('\n\n'); // Join with two newlines

        if (taskText) {
             // Add task only if there's text, add extra newline if there were previous parts
             if (finalPrompt) {
                 finalPrompt += '\n\n';
             }
             finalPrompt += `Your current task:\n${taskText}`;
        }

        copyToClipboard(finalPrompt, generateTraditionalBtn);
    }

    function handleGenerateXml() {
        const selectedRecords = currentRecords.filter(r => r.selected);
        const taskText = currentTaskTextarea.value.trim();

         if (selectedRecords.length === 0 && !taskText) {
             alert("Please select at least one record or enter a task to generate.");
             return;
         }

        // Get root tag from the current profile
        const currentProfile = profiles[activeProfileName];
        const profileXmlRootTag = currentProfile?.xmlRootTag || 'prompt';
        const rootTagName = Utils.escapeXmlName(profileXmlRootTag.trim() || 'prompt');
        let xmlString = `<${rootTagName}>\n`;

        selectedRecords.forEach(record => {
            const tagName = Utils.escapeXmlName(record.name || 'item');
            const content = Utils.escapeXmlContent(record.content || '');
            xmlString += `  <${tagName}>${content}</${tagName}>\n`; // Indent for readability
        });

        if (taskText) {
            const escapedTaskText = Utils.escapeXmlContent(taskText);
            xmlString += `  <userPrompt>${escapedTaskText}</userPrompt>\n`; // Add userPrompt tag
        }

        xmlString += `</${rootTagName}>`;

        copyToClipboard(xmlString, generateXmlBtn);
    }

    function handleXmlRootTagChange(e) {
         const newRootTag = e.target.value.trim();
         if (activeProfileName && profiles[activeProfileName]) {
             // Update the value in the profile object
             profiles[activeProfileName].xmlRootTag = newRootTag || 'prompt'; // Use default if empty
             // Save the updated profiles object which now includes the profile-specific root tag
             saveData();
         }
    }

    function handleCurrentTaskChange(e) {
         if (activeProfileName) {
            const taskText = e.target.value;
            Storage.saveCurrentTask(activeProfileName, taskText);
         }
    }

    function copyToClipboard(text, buttonElement) {
        // Check if Clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    Utils.showCopyFeedback("Prompt copied to clipboard!", 'copy-feedback');
                    if (buttonElement) {
                        Utils.showCheckAnimation(buttonElement);
                    }
                })
                .catch(err => {
                    console.error('Error copying to clipboard: ', err);
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
                Utils.showCopyFeedback("Prompt copied to clipboard!", 'copy-feedback');
                if (buttonElement) {
                    Utils.showCheckAnimation(buttonElement);
                }
            } else {
                throw new Error('Copy command was unsuccessful');
            }
        } catch (err) {
            console.error('Fallback: Error copying to clipboard: ', err);
            Utils.showCopyFeedback("Error copying!", 'copy-feedback', 3000);
            alert("Could not copy to clipboard. Please check browser permissions or copy manually from the console (F12).");
            console.log("--- Text to copy ---");
            console.log(text);
            console.log("--------------------------");
        }
    }
  
    // --- Start the application ---
    initializeApp();
});