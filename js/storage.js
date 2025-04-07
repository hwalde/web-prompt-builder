const PROFILES_KEY = 'promptBuilderProfiles';
const ACTIVE_PROFILE_KEY = 'promptBuilderActiveProfile';
const XML_ROOT_TAG_KEY = 'promptBuilderXmlRootTag';

const Storage = {
    /**
     * Lädt alle Profile aus dem LocalStorage.
     * @returns {object} Ein Objekt mit allen Profilen oder ein leeres Objekt.
     */
    loadProfiles: () => {
        try {
            const profilesJson = localStorage.getItem(PROFILES_KEY);
            return profilesJson ? JSON.parse(profilesJson) : {};
        } catch (e) {
            console.error("Error loading profiles from LocalStorage:", e);
            return {};
        }
    },

    /**
     * Speichert alle Profile im LocalStorage.
     * @param {object} profiles Das Objekt mit allen Profilen.
     */
    saveProfiles: (profiles) => {
        try {
            localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        } catch (e) {
            console.error("Error saving profiles to LocalStorage:", e);
            // Hier könnte man Nutzerfeedback geben, z.B. bei Quota-Überschreitung
        }
    },

    /**
     * Lädt den Namen des aktuell aktiven Profils.
     * @returns {string|null} Der Name des aktiven Profils oder null.
     */
    loadActiveProfileName: () => {
        return localStorage.getItem(ACTIVE_PROFILE_KEY);
    },

    /**
     * Speichert den Namen des aktuell aktiven Profils.
     * @param {string} profileName Der Name des aktiven Profils.
     */
    saveActiveProfileName: (profileName) => {
        if (profileName) {
            localStorage.setItem(ACTIVE_PROFILE_KEY, profileName);
        } else {
            localStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
    },

    /**
     * Lädt den Root-Tag für XML.
     * @returns {string} Der XML-Root-Tag (default: 'prompt').
     */
    loadXmlRootTag: () => {
        return localStorage.getItem(XML_ROOT_TAG_KEY) || 'prompt';
    },

    /**
     * Speichert den Root-Tag für XML.
     * @param {string} tagName Der zu speichernde Tag-Name.
     */
    saveXmlRootTag: (tagName) => {
        if (tagName && typeof tagName === 'string') {
            localStorage.setItem(XML_ROOT_TAG_KEY, tagName.trim());
        }
    },

    /**
     * Gibt die Daten (Records) für ein bestimmtes Profil zurück.
     * @param {string} profileName Der Name des Profils.
     * @returns {Array} Ein Array von Record-Objekten oder ein leeres Array.
     */
    getProfileData: (profileName) => {
        const profiles = Storage.loadProfiles();
        return profiles[profileName]?.records || [];
    },

    /**
     * Speichert die Daten (Records) für ein bestimmtes Profil.
     * @param {string} profileName Der Name des Profils.
     * @param {Array} records Das Array von Record-Objekten.
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
      * Löscht ein Profil und seine Daten.
      * @param {string} profileName Der Name des zu löschenden Profils.
      * @returns {boolean} True bei Erfolg, False sonst.
      */
    deleteProfile: (profileName) => {
         const profiles = Storage.loadProfiles();
         if (profiles[profileName]) {
             delete profiles[profileName];
             Storage.saveProfiles(profiles);
             // Wenn das gelöschte Profil aktiv war, muss der aktive Status entfernt werden
             if (Storage.loadActiveProfileName() === profileName) {
                 Storage.saveActiveProfileName(null);
             }
             return true;
         }
         return false;
    },

     /**
      * Benennt ein Profil um.
      * @param {string} oldName Der alte Name.
      * @param {string} newName Der neue Name.
      * @returns {boolean} True bei Erfolg, False sonst (z.B. wenn neuer Name existiert).
      */
    renameProfile: (oldName, newName) => {
        if (!newName || typeof newName !== 'string' || !oldName || typeof oldName !== 'string' || oldName === newName) {
            return false;
        }
        const profiles = Storage.loadProfiles();
        newName = newName.trim();
        if (profiles[oldName] && !profiles[newName]) { // Nur umbenennen, wenn alter Name existiert und neuer nicht
            profiles[newName] = profiles[oldName];
            delete profiles[oldName];
            Storage.saveProfiles(profiles);
            // Wenn das umbenannte Profil aktiv war, den aktiven Namen aktualisieren
            if (Storage.loadActiveProfileName() === oldName) {
                Storage.saveActiveProfileName(newName);
            }
            return true;
        }
        return false;
    },

    /**
     * Fügt ein neues, leeres Profil hinzu.
     * @param {string} profileName Der Name des neuen Profils.
     * @returns {boolean} True bei Erfolg, False wenn der Name schon existiert.
     */
    addProfile: (profileName) => {
         if (!profileName || typeof profileName !== 'string') return false;
         const profiles = Storage.loadProfiles();
         profileName = profileName.trim();
         if (!profiles[profileName]) {
             profiles[profileName] = { records: [] };
             Storage.saveProfiles(profiles);
             return true;
         }
         return false;
    }
};

// Global verfügbar machen
window.Storage = Storage;