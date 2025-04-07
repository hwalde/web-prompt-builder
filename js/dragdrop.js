const DragDrop = (() => {
    let draggedItem = null;
    let recordsContainer = null;
    let onDropCallback = null;
    let isDragging = false;
    let touchStartY = 0;
    let lastHoveredRow = null; // Track the last row hovered over
    let lastTouchY = 0;
    let initialized = false;
    let scrollInterval = null; // For auto-scrolling
    const scrollSensitivity = 40; // Pixels from edge to trigger scroll
    const scrollSpeed = 10; // Pixels to scroll per interval

    function init(tbodyElement, dropCallback) {
        if (initialized) {
            cleanup();
        }
        
        recordsContainer = tbodyElement;
        onDropCallback = dropCallback;
        initialized = true;

        if (!recordsContainer) {
            console.error("Container element not found for Drag & Drop initialization.");
            return;
        }

        setupRows();
        
        // Global listeners for move and end events
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchend', handleDragEnd);
    }
    
    function cleanup() {
        // Reset state
        draggedItem?.classList.remove('dragging'); // Ensure class is removed
        draggedItem = null;
        isDragging = false;
        lastHoveredRow = null;
        stopAutoScroll();
        
        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchend', handleDragEnd);
        
        // Remove row listeners
        if (recordsContainer) {
            const rows = recordsContainer.querySelectorAll('tr[data-id]');
            rows.forEach(row => {
                row.removeEventListener('mousedown', handleDragStart);
                row.removeEventListener('touchstart', handleTouchStart);
            });
        }
        initialized = false;
    }
    
    function setupRows() {
        if (!recordsContainer) return;
        
        const rows = recordsContainer.querySelectorAll('tr[data-id]');
        rows.forEach(row => {
            // Ensure listeners aren't added multiple times
            row.removeEventListener('mousedown', handleDragStart);
            row.removeEventListener('touchstart', handleTouchStart);
            
            row.addEventListener('mousedown', handleDragStart);
            row.addEventListener('touchstart', handleTouchStart, { passive: false });
            row.draggable = true; // Keep for semantics, though we prevent default DND
        });
    }

    function performSwap(targetRow) {
        if (!draggedItem || !targetRow || draggedItem === targetRow) return;

        const currentRect = draggedItem.getBoundingClientRect();
        const targetRect = targetRow.getBoundingClientRect();
        const parent = recordsContainer;

        // Determine if dragging down or up
        const draggingDown = currentRect.top < targetRect.top;

        if (draggingDown) {
            // Insert dragged item after the target item
            parent.insertBefore(draggedItem, targetRow.nextSibling);
        } else {
            // Insert dragged item before the target item
            parent.insertBefore(draggedItem, targetRow);
        }
        lastHoveredRow = targetRow; // Update last hovered row after swap
    }

    function handleDragStart(e) {
        const dragHandle = e.target.closest('.drag-handle');
        if (!dragHandle || isDragging) return;
        
        draggedItem = e.target.closest('tr');
        if (!draggedItem || !draggedItem.dataset.id) {
            draggedItem = null;
            return;
        }
        
        isDragging = true;
        lastHoveredRow = null; 
        draggedItem.classList.add('dragging'); 
        document.body.classList.add('is-dragging'); // Add class to body
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }
    
    function handleTouchStart(e) {
        const dragHandle = e.target.closest('.drag-handle');
        if (!dragHandle || isDragging) return;
        
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        lastTouchY = touch.clientY;
        
        draggedItem = e.target.closest('tr');
        if (!draggedItem || !draggedItem.dataset.id) {
             draggedItem = null;
             return;
        }

        isDragging = true;
        lastHoveredRow = null;
        draggedItem.classList.add('dragging');
        document.body.classList.add('is-dragging'); // Add class to body
        document.body.style.userSelect = 'none';

        if (e.cancelable) e.preventDefault();
    }
    
    function handleMouseMove(e) {
        if (!isDragging || !draggedItem) return;
        processMove(e.clientY, e.clientX);
        e.preventDefault(); // Prevent other interactions like text selection
    }
    
    function handleTouchMove(e) {
        if (!isDragging || !draggedItem) return;
        
        const touch = e.touches[0];
        lastTouchY = touch.clientY;
        processMove(touch.clientY, touch.clientX);
        if (e.cancelable) e.preventDefault(); // Prevent scrolling during drag
    }

    function processMove(y, x) {
        // Auto-scroll logic
        const containerRect = recordsContainer.getBoundingClientRect();
        if (y < containerRect.top + scrollSensitivity) {
            startAutoScroll(-1);
        } else if (y > containerRect.bottom - scrollSensitivity) {
            startAutoScroll(1);
        } else {
            stopAutoScroll();
        }

        // Find the element directly under the pointer/touch
        // Temporarily hide dragged item to find element underneath
        draggedItem.style.visibility = 'hidden';
        const elementUnderPointer = document.elementFromPoint(x, y);
        draggedItem.style.visibility = ''; // Make it visible again

        if (!elementUnderPointer) return;

        const targetRow = elementUnderPointer.closest('tr[data-id]');

        // If hovering over a valid row (and not the dragged item itself or the last hovered row)
        if (targetRow && targetRow !== draggedItem && targetRow !== lastHoveredRow && recordsContainer.contains(targetRow)) {
            performSwap(targetRow);
        }
    }

    function startAutoScroll(direction) {
        if (scrollInterval) return; // Already scrolling
        scrollInterval = setInterval(() => {
            recordsContainer.scrollTop += direction * scrollSpeed;
        }, 20);
    }

    function stopAutoScroll() {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
    
    function handleDragEnd(e) {
        if (!isDragging) return;
        
        stopAutoScroll();
        document.body.classList.remove('is-dragging'); // Remove class from body
        document.body.style.userSelect = '';

        if (draggedItem) {
            const draggedId = draggedItem.dataset.id;
            let targetId = null;
            let insertBefore = false;

            // Determine final position based on siblings
            const nextSibling = draggedItem.nextElementSibling;
            const previousSibling = draggedItem.previousElementSibling;

            if (nextSibling && nextSibling.dataset.id) {
                targetId = nextSibling.dataset.id;
                insertBefore = true;
            } else if (previousSibling && previousSibling.dataset.id) {
                targetId = previousSibling.dataset.id;
                insertBefore = false;
            } else {
                 // Dropped at the beginning (no previous data sibling) 
                 // or it's the only item left
                 insertBefore = true; // Signal to insert at beginning/prepend
                 // targetId remains null, callback handles this
            }
            
            // Trigger callback with final position
             if (onDropCallback) {
                 onDropCallback(draggedId, targetId, insertBefore);
             }

            draggedItem.classList.remove('dragging');
        }
        
        // Reset state
        isDragging = false;
        draggedItem = null;
        lastHoveredRow = null;
        
        if (e && e.type === 'touchend' && e.cancelable) {
            e.preventDefault();
        }
    }
    
    return {
        init,
        cleanup
    };
})();

window.DragDrop = DragDrop;