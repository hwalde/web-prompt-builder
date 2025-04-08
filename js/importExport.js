const ImportExport = (() => {
    // Private variables to hold dependencies
    let _profiles = null;
    let _getActiveProfileName = null;
    let _updateActiveProfileName = null; // Function to update activeProfileName in main.js
    let _Storage = null;
    let _Utils = null;
    let _UI = null;
    let _loadCurrentRecords = null;
    let _renderUI = null;
    let _renderCurrentTask = null;

    /**
     * Initializes the module with dependencies from main.js.
     * @param {object} dependencies - Object containing necessary variables and functions.
     */
    function init(dependencies) {
        _profiles = dependencies.profiles;
        _getActiveProfileName = dependencies.getActiveProfileName;
        _updateActiveProfileName = dependencies.updateActiveProfileName;
        _Storage = dependencies.Storage;
        _Utils = dependencies.Utils;
        _UI = dependencies.UI;
        _loadCurrentRecords = dependencies.loadCurrentRecords;
        _renderUI = dependencies.renderUI;
        _renderCurrentTask = dependencies.renderCurrentTask;
    }

    /**
     * Handles the export profile button click.
     * Exports the currently active profile's data (records, xmlRootTag, currentTask) as a JSON file.
     */
    function handleExportProfile() {
        const activeProfileName = _getActiveProfileName();
        if (!activeProfileName || !_profiles[activeProfileName]) {
            alert("Please select an active profile to export.");
            return;
        }

        // Include the current task in the export
        const currentTask = _Storage.loadCurrentTask(activeProfileName);
        const profileDataToExport = {
            ..._profiles[activeProfileName], // Existing data (records, xmlRootTag)
            currentTask: currentTask         // Add current task
        };

        const exportObj = {
            profileName: activeProfileName,
            profileData: profileDataToExport
        };

        try {
            const jsonString = JSON.stringify(exportObj, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const safeProfileName = activeProfileName.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
            a.download = `prompt_profile_${safeProfileName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            _Utils.showCopyFeedback(`Profile "${activeProfileName}" exported successfully!`, 'profile-feedback', 3000);
        } catch (error) {
            console.error('Error during profile export:', error);
            alert(`An error occurred while exporting the profile: ${error.message}`);
            _Utils.showCopyFeedback('Export failed!', 'profile-feedback', 3000);
        }
    }

    /**
     * Handles the import profile button click.
     * Opens a file dialog, reads the JSON file, validates it, 
     * prompts for overwrite confirmation, and updates the application state.
     */
    function handleImportProfile() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';

        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // --- Validation --- 
                    if (!importedData || typeof importedData !== 'object' ||
                        !importedData.profileName || typeof importedData.profileName !== 'string' ||
                        !importedData.profileData || typeof importedData.profileData !== 'object' ||
                        !Array.isArray(importedData.profileData.records) ||
                        typeof importedData.profileData.xmlRootTag !== 'string') { // Check presence
                        throw new Error('Invalid profile file format (missing core fields).');
                    }
                    // Check currentTask structure if present
                    if (importedData.profileData.hasOwnProperty('currentTask') && typeof importedData.profileData.currentTask !== 'string') {
                        throw new Error('Invalid format for currentTask in profile file.');
                    }
                    
                    const importedProfileName = importedData.profileName.trim();
                    const importedProfileData = importedData.profileData;

                    if (!importedProfileName) {
                        throw new Error('Profile name cannot be empty.');
                    }

                     // Ensure records have necessary fields & sanitize
                    importedProfileData.records.forEach((rec, index) => {
                        if (!rec || typeof rec !== 'object') throw new Error(`Invalid record format at index ${index}.`);
                        // Ensure required fields exist with defaults
                        rec.id = rec.id || _Utils.generateUUID(); // Generate ID if missing
                        rec.name = rec.name || `Imported Record ${index + 1}`;
                        rec.content = rec.content === undefined ? '' : String(rec.content);
                        rec.escape = rec.escape === undefined ? false : !!rec.escape;
                        rec.selected = rec.selected === undefined ? true : !!rec.selected;
                    });
                    // --- End Validation --- 

                    // Reload profiles from storage right before the check to ensure freshness
                    _profiles = _Storage.loadProfiles(); 

                    let proceedWithImport = true;
                    if (_profiles[importedProfileName]) {
                        proceedWithImport = confirm(`A profile named "${importedProfileName}" already exists. Do you want to overwrite it?`);
                    }

                    if (proceedWithImport) {
                         // Extract currentTask separately before saving profile data
                        const importedTask = importedProfileData.currentTask || '';
                        // Create profile data object *without* currentTask for storage
                        const profileDataToStore = {
                            records: importedProfileData.records,
                            xmlRootTag: importedProfileData.xmlRootTag || 'prompt' // Use default if missing
                        };
                        
                        // Add or overwrite the profile in the main state object
                        _profiles[importedProfileName] = profileDataToStore;
                        _Storage.saveProfiles(_profiles); // Save updated profiles object
                        _Storage.saveCurrentTask(importedProfileName, importedTask); // Save task separately

                        const currentActiveProfile = _getActiveProfileName();

                        // Update UI and state
                        if (currentActiveProfile === importedProfileName || !currentActiveProfile) {
                            _updateActiveProfileName(importedProfileName); // Update main.js activeProfileName state
                            _Storage.saveActiveProfileName(importedProfileName);
                            _loadCurrentRecords(); 
                            _renderUI(); 
                            _renderCurrentTask(); // Ensure task area updates if profile became active
                        } else {
                            // Just update the dropdown list if a different profile remains active
                            _UI.populateProfileSelect(_profiles, currentActiveProfile);
                        }
                        
                        _Utils.showCopyFeedback(`Profile "${importedProfileName}" imported successfully!`, 'profile-feedback', 3000);
                    } else {
                        _Utils.showCopyFeedback('Import cancelled.', 'profile-feedback', 2000);
                    }

                } catch (error) {
                    console.error('Error during profile import:', error);
                    alert(`An error occurred while importing the profile: ${error.message}`);
                     _Utils.showCopyFeedback('Import failed!', 'profile-feedback', 3000);
                }
            };

            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                alert('An error occurred while reading the file.');
                _Utils.showCopyFeedback('File read error!', 'profile-feedback', 3000);
            };

            reader.readAsText(file);
        };

        fileInput.click();
    }

    // Expose public methods
    return {
        init,
        handleExportProfile,
        handleImportProfile
    };
})();

// Make globally available
window.ImportExport = ImportExport; 