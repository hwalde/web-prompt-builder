/**
 * Generiert eine einfache UUID v4.
 * Nicht kryptographisch sicher, aber ausreichend für eindeutige IDs hier.
 * @returns {string} Eine UUID.
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Escaped XML-Namen (vereinfacht). Entfernt ungültige Zeichen und stellt sicher,
 * dass der Name mit einem Buchstaben oder '_' beginnt.
 * Ersetzt Leerzeichen und andere ungültige Zeichen durch '_'.
 * @param {string} name Der zu escapende Name.
 * @returns {string} Ein gültiger XML-Tag-Name.
 */
function escapeXmlName(name) {
    if (!name || typeof name !== 'string') return 'tag'; // Fallback
    let escaped = name.trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
    // Muss mit Buchstaben oder _ beginnen (XML-Regel)
    if (!/^[a-zA-Z_]/.test(escaped)) {
        escaped = '_' + escaped;
    }
    // Ersetze mehrere aufeinanderfolgende __ mit einem _
    escaped = escaped.replace(/__+/g, '_');
     // Entferne führende/trailing _ falls nicht der einzige Character
    if (escaped.length > 1) {
       escaped = escaped.replace(/^_+|_+$/g, '');
       // Nochmals prüfen ob es jetzt leer ist oder mit Zahl beginnt
       if (!escaped || !/^[a-zA-Z_]/.test(escaped)) {
           escaped = '_' + escaped;
       }
    }
     if (!escaped) return 'tag'; // Fallback falls alles entfernt wurde
    return escaped;
}

/**
 * Escaped XML-Inhalt (ersetzt spezielle Zeichen).
 * @param {string} content Der zu escapende Inhalt.
 * @returns {string} Der escapte Inhalt.
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
 * Debounce-Funktion: Verzögert die Ausführung einer Funktion.
 * @param {function} func Die auszuführende Funktion.
 * @param {number} delay Die Verzögerung in Millisekunden.
 * @returns {function} Die debounced Funktion.
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
 * Zeigt eine Feedback-Nachricht für das Kopieren an.
 * @param {string} message Die anzuzeigende Nachricht.
 * @param {number} duration Dauer in Millisekunden.
 */
function showCopyFeedback(message = "In Zwischenablage kopiert!", duration = 2000) {
    const feedbackElement = document.getElementById('copy-feedback');
    if (!feedbackElement) return;

    feedbackElement.textContent = message;
    feedbackElement.classList.add('visible');

    setTimeout(() => {
        feedbackElement.classList.remove('visible');
    }, duration);
}

 /**
 * Zeigt die Check-Animation auf einem Button an.
 * @param {HTMLElement} buttonElement Der Button, auf dem die Animation gezeigt wird.
 */
function showCheckAnimation(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.add('success');
    // Animation entfernen, damit sie erneut ausgelöst werden kann
    setTimeout(() => {
        buttonElement.classList.remove('success');
    }, 1500); // Dauer der Animation + Puffer
}

// Machen wir die Funktionen global verfügbar (oder über Module exportieren, wenn gewünscht)
window.Utils = {
    generateUUID,
    escapeXmlName,
    escapeXmlContent,
    debounce,
    showCopyFeedback,
    showCheckAnimation
};