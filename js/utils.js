/**
 * Generates a simple UUID v4.
 * Not cryptographically secure, but sufficient for unique IDs here.
 * @returns {string} A UUID.
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Escapes HTML content (replaces special characters).
 * @param {string} content The content to escape.
 * @returns {string} The escaped content.
 */
function escapeHtml(content) {
    if (content === null || content === undefined) return '';
    return String(content)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapes XML names (simplified). Removes invalid characters and ensures
 * the name starts with a letter or '_'.
 * Replaces spaces and other invalid characters with '_'.
 * @param {string} name The name to escape.
 * @returns {string} A valid XML tag name.
 */
function escapeXmlName(name) {
    if (!name || typeof name !== 'string') return 'tag'; // Fallback
    let escaped = name.trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
    // Must start with letter or _ (XML rule)
    if (!/^[a-zA-Z_]/.test(escaped)) {
        escaped = '_' + escaped;
    }
    // Replace multiple consecutive __ with a single _
    escaped = escaped.replace(/__+/g, '_');
     // Remove leading/trailing _ if not the only character
    if (escaped.length > 1) {
       escaped = escaped.replace(/^_+|_+$/g, '');
       // Check again if it's now empty or starts with a number
       if (!escaped || !/^[a-zA-Z_]/.test(escaped)) {
           escaped = '_' + escaped;
       }
    }
     if (!escaped) return 'tag'; // Fallback if everything was removed
    return escaped;
}

/**
 * Escapes XML content (replaces special characters).
 * @param {string} content The content to escape.
 * @returns {string} The escaped content.
 */
function escapeXmlContent(content) {
    if (content === null || content === undefined) return '';
    return String(content).replace(/[<>&"']/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return match;
        }
    });
}

/**
 * Debounce function: Delays the execution of a function.
 * @param {function} func The function to execute.
 * @param {number} delay The delay in milliseconds.
 * @returns {function} The debounced function.
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Shows a feedback message for copying or other actions.
 * @param {string} message The message to display.
 * @param {string} [feedbackElementId='copy-feedback'] The ID of the feedback element to use.
 * @param {number} [duration=2000] Duration in milliseconds.
 */
function showCopyFeedback(message = "Action complete!", feedbackElementId = 'copy-feedback', duration = 2000) {
    const feedbackElement = document.getElementById(feedbackElementId);
    if (!feedbackElement) {
        console.warn(`Feedback element with ID '${feedbackElementId}' not found.`);
        return;
    }

    feedbackElement.textContent = message;
    feedbackElement.classList.add('visible');

    setTimeout(() => {
        feedbackElement.classList.remove('visible');
    }, duration);
}

 /**
 * Shows the check animation on a button.
 * @param {HTMLElement} buttonElement The button to show the animation on.
 */
function showCheckAnimation(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.add('success');
    // Remove animation so it can be triggered again
    setTimeout(() => {
        buttonElement.classList.remove('success');
    }, 1500); // Duration of animation + buffer
}

// Make functions globally available (or export via modules if desired)
window.Utils = {
    generateUUID,
    escapeHtml,
    escapeXmlName,
    escapeXmlContent,
    debounce,
    showCopyFeedback,
    showCheckAnimation
};