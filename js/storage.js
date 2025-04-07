const PROFILES_KEY = 'promptBuilderProfiles';
const ACTIVE_PROFILE_KEY = 'promptBuilderActiveProfile';
const CURRENT_TASK_KEY_PREFIX = 'promptBuilderCurrentTask_'; // Prefix for profile-specific task

const Storage = {
    /**
     * Loads all profiles from LocalStorage.
     * Ensures that each profile has an 'xmlRootTag' property (migration).
     * @returns {object} An object with all profiles or an empty object.
     */
    loadProfiles: () => {
        try {
            const profilesJson = localStorage.getItem(PROFILES_KEY);
            let loadedProfiles = profilesJson ? JSON.parse(profilesJson) : {};

            // Migration: Ensure all profiles have xmlRootTag
            Object.keys(loadedProfiles).forEach(profileName => {
                if (!loadedProfiles[profileName].hasOwnProperty('xmlRootTag')) {
                    loadedProfiles[profileName].xmlRootTag = 'prompt'; // Default value
                }
            });

            return loadedProfiles;
        } catch (e) {
            console.error("Error loading profiles from LocalStorage:", e);
            return {};
        }
    },

    /**
     * Saves all profiles to LocalStorage.
     * @param {object} profiles The object containing all profiles.
     */
    saveProfiles: (profiles) => {
        try {
            localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        } catch (e) {
            console.error("Error saving profiles to LocalStorage:", e);
            // User feedback could be provided here, e.g., if quota is exceeded
        }
    },

    /**
     * Loads the name of the currently active profile.
     * @returns {string|null} The name of the active profile or null.
     */
    loadActiveProfileName: () => {
        return localStorage.getItem(ACTIVE_PROFILE_KEY);
    },

    /**
     * Saves the name of the currently active profile.
     * @param {string} profileName The name of the active profile.
     */
    saveActiveProfileName: (profileName) => {
        if (profileName) {
            localStorage.setItem(ACTIVE_PROFILE_KEY, profileName);
        } else {
            localStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
    },

    /**
     * Returns the data (records) for a specific profile.
     * @param {string} profileName The name of the profile.
     * @returns {Array} An array of record objects or an empty array.
     */
    getProfileData: (profileName) => {
        const profiles = Storage.loadProfiles();
        return profiles[profileName]?.records || [];
    },

    /**
     * Saves the data (records) for a specific profile.
     * @param {string} profileName The name of the profile.
     * @param {Array} records The array of record objects.
     */
    saveProfileData: (profileName, records) => {
        const profiles = Storage.loadProfiles();
        if (profiles[profileName]) {
            profiles[profileName].records = records;
            Storage.saveProfiles(profiles);
        } else {
            console.warn(`Profile "${profileName}" not found for saving data.`);
        }
    },

     /**
      * Deletes a profile and its data.
      * @param {string} profileName The name of the profile to delete.
      * @returns {boolean} True on success, False otherwise.
      */
    deleteProfile: (profileName) => {
         const profiles = Storage.loadProfiles();
         if (profiles[profileName]) {
             delete profiles[profileName];
             Storage.saveProfiles(profiles);
             // If the deleted profile was active, the active status must be removed
             if (Storage.loadActiveProfileName() === profileName) {
                 Storage.saveActiveProfileName(null);
             }
             return true;
         }
         return false;
    },

     /**
      * Renames a profile.
      * @param {string} oldName The old name.
      * @param {string} newName The new name.
      * @returns {boolean} True on success, False otherwise (e.g., if the new name exists).
      */
    renameProfile: (oldName, newName) => {
        if (!newName || typeof newName !== 'string' || !oldName || typeof oldName !== 'string' || oldName === newName) {
            return false;
        }
        const profiles = Storage.loadProfiles();
        newName = newName.trim();
        if (profiles[oldName] && !profiles[newName]) { // Only rename if old name exists and new one does not
            profiles[newName] = profiles[oldName];
            delete profiles[oldName];
            Storage.saveProfiles(profiles);
            // If the renamed profile was active, update the active name
            if (Storage.loadActiveProfileName() === oldName) {
                Storage.saveActiveProfileName(newName);
            }
            return true;
        }
        return false;
    },

    /**
     * Adds a new, empty profile.
     * @param {string} profileName The name of the new profile.
     * @returns {boolean} True on success, False if the name already exists.
     */
    addProfile: (profileName) => {
         if (!profileName || typeof profileName !== 'string') return false;
         const profiles = Storage.loadProfiles();
         profileName = profileName.trim();
         if (!profiles[profileName]) {
             profiles[profileName] = {
                 records: [],
                 xmlRootTag: 'prompt' // Add default root tag for new profiles
             };
             Storage.saveProfiles(profiles);
             return true;
         }
         return false;
    },

    /**
     * Loads the current task text for a specific profile.
     * @param {string} profileName The name of the profile.
     * @returns {string} The saved task text or an empty string.
     */
    loadCurrentTask: (profileName) => {
        if (!profileName) return '';
        try {
            return localStorage.getItem(CURRENT_TASK_KEY_PREFIX + profileName) || '';
        } catch (e) {
            console.error("Error loading current task from LocalStorage:", e);
            return '';
        }
    },

    /**
     * Saves the current task text for a specific profile.
     * @param {string} profileName The name of the profile.
     * @param {string} taskText The text to save.
     */
    saveCurrentTask: (profileName, taskText) => {
        if (!profileName) return;
        try {
            localStorage.setItem(CURRENT_TASK_KEY_PREFIX + profileName, taskText || '');
        } catch (e) {
            console.error("Error saving current task to LocalStorage:", e);
        }
    },

    /**
     * Deletes the task text for a specific profile (needed when deleting the profile).
     * @param {string} profileName The name of the profile.
     */
    deleteCurrentTask: (profileName) => {
        if (!profileName) return;
        try {
            localStorage.removeItem(CURRENT_TASK_KEY_PREFIX + profileName);
        } catch (e) {
            console.error("Error deleting current task from LocalStorage:", e);
        }
    }
};

// Make globally available
window.Storage = Storage;