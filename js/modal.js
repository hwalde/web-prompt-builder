const Modal = (() => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content'); // Parent of form elements
    const closeButtonX = document.getElementById('modal-close-x');
    const closeButton = document.getElementById('modal-close-btn');
    const nameInput = document.getElementById('modal-name');
    const escapeCheckbox = document.getElementById('modal-escape');
    const contentTextarea = document.getElementById('modal-content-area');
    const recordIdInput = document.getElementById('modal-record-id');

    let currentRecordId = null;
    let onSaveCallback = null; // Callback, der nach dem Speichern aufgerufen wird

    // Debounced Speichern-Funktion
    const debouncedSave = Utils.debounce(saveData, 200);

    function open(record, saveCallback) {
        if (!record || !modalContainer) return;

        currentRecordId = record.id;
        onSaveCallback = saveCallback;

        // Populate modal fields
        recordIdInput.value = record.id;
        nameInput.value = record.name || '';
        escapeCheckbox.checked = record.escape || false;
        contentTextarea.value = record.content || '';

        // Show modal
        modalOverlay.classList.remove('hidden');
        modalContainer.classList.remove('hidden');

        // Focus first element
        nameInput.focus();

        // Add event listeners
        closeButtonX.addEventListener('click', close);
        closeButton.addEventListener('click', close);
        modalOverlay.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleKeydown);
        // Autosave listeners
        nameInput.addEventListener('input', debouncedSave);
        contentTextarea.addEventListener('input', debouncedSave);
        escapeCheckbox.addEventListener('change', saveData); // Sofort speichern bei Checkbox
    }

    function close() {
        if (!modalContainer) return;

        saveData(); // Ensure data is saved on close

        modalOverlay.classList.add('hidden');
        modalContainer.classList.add('hidden');

        // Clean up
        currentRecordId = null;
        onSaveCallback = null;
        recordIdInput.value = '';
        nameInput.value = '';
        escapeCheckbox.checked = false;
        contentTextarea.value = '';

        // Remove event listeners
        closeButtonX.removeEventListener('click', close);
        closeButton.removeEventListener('click', close);
        modalOverlay.removeEventListener('click', handleOverlayClick);
        document.removeEventListener('keydown', handleKeydown);
        nameInput.removeEventListener('input', debouncedSave);
        contentTextarea.removeEventListener('input', debouncedSave);
        escapeCheckbox.removeEventListener('change', saveData);
    }

    function saveData() {
        if (!currentRecordId || !onSaveCallback) return;

        const updatedRecordData = {
            id: currentRecordId,
            name: nameInput.value.trim(),
            escape: escapeCheckbox.checked,
            content: contentTextarea.value
            // 'selected' status wird hier nicht geändert, nur im Haupt-UI
        };

        // Use the callback provided by main.js to update the central data store
        onSaveCallback(updatedRecordData);
    }

    function handleOverlayClick(event) {
        // Close only if the click is directly on the overlay, not on the modal content
        if (event.target === modalOverlay) {
            close();
        }
    }

    function handleKeydown(event) {
        // Close on Escape key
        if (event.key === 'Escape') {
            close();
        }
    }

    return {
        open,
        close
    };
})();

// Global verfügbar machen
window.Modal = Modal;