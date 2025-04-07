const DragDrop = (() => {
    let draggedItem = null;
    let recordsTbody = null;
    let onDropCallback = null;

    function init(tbodyElement, dropCallback) {
        recordsTbody = tbodyElement;
        onDropCallback = dropCallback;

        if (!recordsTbody) {
            console.error("Tbody element not found for Drag & Drop initialization.");
            return;
        }

        // Use event delegation on the tbody
        recordsTbody.addEventListener('dragstart', handleDragStart);
        recordsTbody.addEventListener('dragover', handleDragOver);
        recordsTbody.addEventListener('dragleave', handleDragLeave);
        recordsTbody.addEventListener('drop', handleDrop);
        recordsTbody.addEventListener('dragend', handleDragEnd);
    }

    function handleDragStart(e) {
        // Allow dragging only when clicking directly on the row, not buttons/checkboxes
         if (e.target.tagName === 'TR') {
             draggedItem = e.target;
             e.dataTransfer.effectAllowed = 'move';
             e.dataTransfer.setData('text/plain', draggedItem.dataset.id); // Pass the record ID

             // Add delay so the browser can render the ghost image before styling
             setTimeout(() => {
                 if (draggedItem) draggedItem.classList.add('dragging');
             }, 0);
         } else {
             // Prevent dragging if started on an interactive element within the row
             e.preventDefault();
        }
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';

        const targetRow = e.target.closest('tr');
        if (targetRow && targetRow !== draggedItem && recordsTbody.contains(targetRow)) {
             // Remove previous indicators
            clearDragOverIndicators();
            // Add indicator to the current target
            targetRow.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const targetRow = e.target.closest('tr');
         if (targetRow && recordsTbody.contains(targetRow)) {
             targetRow.classList.remove('drag-over');
         }
         // Also check if leaving tbody entirely
         if (!recordsTbody.contains(e.relatedTarget)) {
             clearDragOverIndicators();
         }
    }

     function clearDragOverIndicators() {
        const indicators = recordsTbody.querySelectorAll('.drag-over');
        indicators.forEach(indicator => indicator.classList.remove('drag-over'));
     }


    function handleDrop(e) {
        e.preventDefault();
         clearDragOverIndicators();

        const targetRow = e.target.closest('tr');
        if (targetRow && draggedItem && targetRow !== draggedItem && recordsTbody.contains(targetRow)) {
            const draggedId = draggedItem.dataset.id;
            const targetId = targetRow.dataset.id;

            // Determine if dropping before or after the targetRow based on drop position
            const rect = targetRow.getBoundingClientRect();
            const dropBefore = e.clientY < rect.top + rect.height / 2;

            // Find the indices in the actual data array based on the current order in the DOM
            const rows = Array.from(recordsTbody.children);
            const draggedIndex = rows.findIndex(row => row.dataset.id === draggedId);
            const targetIndex = rows.findIndex(row => row.dataset.id === targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                 // Call the callback provided by main.js to handle the actual data reordering
                if (onDropCallback) {
                    onDropCallback(draggedId, targetId, dropBefore);
                }
            } else {
                 console.warn("Could not find dragged or target element index for reordering.");
             }
        }
         // Clean up dragged item reference handled in dragend
    }

    function handleDragEnd(e) {
         // Clean up styling regardless of whether drop was successful
        if (draggedItem) {
             draggedItem.classList.remove('dragging');
        }
        clearDragOverIndicators();
        draggedItem = null;
    }

    return {
        init
    };
})();

window.DragDrop = DragDrop;