// ===== ADMIN NOTES APP =====
class NotesApp {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.autoSaveTimer = null;
        this.isResizing = false;
        this.resizeData = null;
        this.pastedImage = null;
        
        this.init();
    }
    
    init() {
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }
        
        // DOM Elements
        this.cacheElements();
        
        // Load notes
        this.loadNotes();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create initial note if none exist
        if (this.notes.length === 0) {
            this.createNewNote();
        } else {
            this.selectNote(this.notes[0].id);
        }
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 300);
        
        this.updateStats();
    }
    
    checkAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        
        if (!isAuthenticated) {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('authError').classList.add('active');
            return false;
        }
        
        return true;
    }
    
    cacheElements() {
        // Sidebar
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.notesList = document.getElementById('notesList');
        this.searchBox = document.getElementById('searchBox');
        
        // Toolbar
        this.noteTitle = document.getElementById('noteTitle');
        this.lastSaved = document.getElementById('lastSaved');
        
        // Editor
        this.noteEditor = document.getElementById('noteEditor');
        this.imageResizeOverlay = document.getElementById('imageResizeOverlay');
        this.resizeDimensions = document.getElementById('resizeDimensions');
        
        // Buttons
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.insertImageBtn = document.getElementById('insertImageBtn');
        this.insertTableBtn = document.getElementById('insertTableBtn');
        
        // Status
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
        this.noteCount = document.getElementById('noteCount');
        
        // Hidden inputs
        this.imageInput = document.getElementById('imageInput');
        this.importInput = document.getElementById('importInput');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Modals
        this.imageModal = document.getElementById('imageModal');
        this.previewImage = document.getElementById('previewImage');
        this.tableModal = document.getElementById('tableModal');
    }
    
    setupEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.sidebar.classList.toggle('collapsed');
            const icon = this.sidebarToggle.querySelector('i');
            icon.classList.toggle('fa-chevron-left');
            icon.classList.toggle('fa-chevron-right');
        });
        
        // New note
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        
        // Delete note
        this.deleteNoteBtn.addEventListener('click', () => this.deleteNote());
        
        // Search
        this.searchBox.addEventListener('input', () => this.filterNotes());
        
        // Note title
        this.noteTitle.addEventListener('input', () => {
            this.autoSave();
            this.updateNoteInList();
        });
        
        // Editor content
        this.noteEditor.addEventListener('input', () => {
            this.autoSave();
            this.updateStats();
        });
        
        // Format buttons
        document.querySelectorAll('.format-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = btn.dataset.command;
                const value = btn.dataset.value;
                this.execCommand(command, value);
                this.noteEditor.focus();
            });
        });
        
        // Insert image
        this.insertImageBtn.addEventListener('click', () => {
            this.imageInput.click();
        });
        
        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageSelect(e.target.files[0]);
            }
        });
        
        // Image modal
        document.getElementById('imageModalClose').addEventListener('click', () => {
            this.closeImageModal();
        });
        
        document.getElementById('imageModalCancel').addEventListener('click', () => {
            this.closeImageModal();
        });
        
        document.getElementById('imageModalInsert').addEventListener('click', () => {
            this.insertPastedImage();
        });
        
        // Insert table
        this.insertTableBtn.addEventListener('click', () => {
            this.tableModal.classList.add('active');
        });
        
        document.getElementById('tableModalClose').addEventListener('click', () => {
            this.tableModal.classList.remove('active');
        });
        
        document.getElementById('tableModalCancel').addEventListener('click', () => {
            this.tableModal.classList.remove('active');
        });
        
        document.getElementById('tableModalInsert').addEventListener('click', () => {
            this.insertTable();
        });
        
        // Export dropdown
        this.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportBtn.parentElement.classList.toggle('active');
        });
        
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                this.handleExport(action);
                this.exportBtn.parentElement.classList.remove('active');
            });
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
            }
        });
        
        // Import
        this.importBtn.addEventListener('click', () => {
            this.importInput.click();
        });
        
        this.importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImport(e.target.files);
            }
        });
        
        // Logout
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote();
                this.showToast('Note saved!');
            }
            
            // Ctrl+B for bold
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.execCommand('bold');
            }
            
            // Ctrl+I for italic
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.execCommand('italic');
            }
            
            // Ctrl+U for underline
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                this.execCommand('underline');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.imageModal.classList.remove('active');
                this.tableModal.classList.remove('active');
            }
        });
        
        // Image paste
        this.noteEditor.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Global mouse events for image resizing
        document.addEventListener('mousemove', (e) => this.handleResizeMove(e));
        document.addEventListener('mouseup', () => this.handleResizeEnd());
    }
    
    // ===== NOTE MANAGEMENT =====
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    createNewNote() {
        const newNote = {
            id: this.generateId(),
            title: '',
            content: '<p><br></p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotesList();
        this.selectNote(newNote.id);
        
        this.noteTitle.focus();
        this.showToast('New note created');
    }
    
    selectNote(noteId) {
        // Save current note before switching
        if (this.currentNoteId) {
            this.saveCurrentNote();
        }
        
        this.currentNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        
        if (note) {
            this.noteTitle.value = note.title;
            this.noteEditor.innerHTML = note.content;
            
            // Update active state in list
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === noteId);
            });
            
            this.updateStats();
            this.setupImageResizing();
        }
    }
    
    deleteNote() {
        if (!this.currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== this.currentNoteId);
            this.saveNotes();
            this.renderNotesList();
            
            if (this.notes.length > 0) {
                this.selectNote(this.notes[0].id);
            } else {
                this.createNewNote();
            }
            
            this.showToast('Note deleted');
        }
    }
    
    saveCurrentNote() {
        if (!this.currentNoteId) return;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].title = this.noteTitle.value;
            this.notes[noteIndex].content = this.noteEditor.innerHTML;
            this.notes[noteIndex].updatedAt = new Date().toISOString();
            
            this.saveNotes();
            this.renderNotesList();
            
            this.lastSaved.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
        }
    }
    
    autoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.lastSaved.textContent = 'Saving...';
        
        this.autoSaveTimer = setTimeout(() => {
            this.saveCurrentNote();
        }, 1000);
    }
    
    updateNoteInList() {
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].title = this.noteTitle.value;
            this.notes[noteIndex].updatedAt = new Date().toISOString();
            this.renderNotesList();
        }
    }
    
    // ===== STORAGE =====
    loadNotes() {
        const stored = localStorage.getItem('dibesh_notes');
        if (stored) {
            try {
                this.notes = JSON.parse(stored);
            } catch (e) {
                this.notes = [];
            }
        }
    }
    
    saveNotes() {
        localStorage.setItem('dibesh_notes', JSON.stringify(this.notes));
    }
    
    // ===== RENDERING =====
    renderNotesList() {
        const searchTerm = this.searchBox.value.toLowerCase();
        let filteredNotes = this.notes;
        
        if (searchTerm) {
            filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) ||
                this.stripHtml(note.content).toLowerCase().includes(searchTerm)
            );
        }
        
        // Sort by updated date
        filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        if (filteredNotes.length === 0) {
            this.notesList.innerHTML = `
                <div class="note-item-empty">
                    <i class="fas fa-sticky-note"></i>
                    <p>${searchTerm ? 'No matching notes' : 'No notes yet'}</p>
                </div>
            `;
        } else {
            this.notesList.innerHTML = filteredNotes.map(note => `
                <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Untitled Note'}</div>
                    <div class="note-item-preview">${this.stripHtml(note.content).substring(0, 60) || 'No content'}</div>
                    <div class="note-item-date">${this.formatDate(note.updatedAt)}</div>
                </div>
            `).join('');
            
            // Add click handlers
            this.notesList.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectNote(item.dataset.id);
                });
            });
        }
        
        this.noteCount.textContent = `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;
    }
    
    filterNotes() {
        this.renderNotesList();
    }
    
    // ===== EDITOR COMMANDS =====
    execCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.noteEditor.focus();
        this.autoSave();
    }
    
    insertTable() {
        const rows = parseInt(document.getElementById('tableRows').value) || 3;
        const cols = parseInt(document.getElementById('tableCols').value) || 3;
        
        let tableHTML = '<table><tbody>';
        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td>Cell</td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table><p><br></p>';
        
        this.execCommand('insertHTML', tableHTML);
        this.tableModal.classList.remove('active');
    }
    
    // ===== IMAGE HANDLING =====
    handleImageSelect(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.pastedImage = e.target.result;
            this.previewImage.src = this.pastedImage;
            this.imageModal.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
    
    handlePaste(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    this.pastedImage = event.target.result;
                    this.previewImage.src = this.pastedImage;
                    this.imageModal.classList.add('active');
                };
                
                reader.readAsDataURL(blob);
                return;
            }
        }
    }
    
    insertPastedImage() {
        if (!this.pastedImage) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'resizable-image-wrapper';
        wrapper.style.width = '400px';
        
        const img = document.createElement('img');
        img.src = this.pastedImage;
        img.style.width = '100%';
        img.style.height = 'auto';
        
        // Add resize handles
        ['se', 'sw', 'ne', 'nw'].forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            wrapper.appendChild(handle);
        });
        
        wrapper.appendChild(img);
        
        // Insert at cursor position
        this.execCommand('insertHTML', wrapper.outerHTML);
        
        // Setup resizing for the new image
        setTimeout(() => this.setupImageResizing(), 100);
        
        this.closeImageModal();
        this.showToast('Image inserted');
    }
    
    closeImageModal() {
        this.imageModal.classList.remove('active');
        this.pastedImage = null;
        this.imageInput.value = '';
    }
    
    // ===== IMAGE RESIZING =====
    setupImageResizing() {
        document.querySelectorAll('.resizable-image-wrapper').forEach(wrapper => {
            // Remove existing listeners
            const newWrapper = wrapper.cloneNode(true);
            wrapper.parentNode.replaceChild(newWrapper, wrapper);
            
            // Add resize handle listeners
            newWrapper.querySelectorAll('.resize-handle').forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    this.isResizing = true;
                    this.resizeData = {
                        wrapper: newWrapper,
                        handle: handle.dataset.handle,
                        startX: e.clientX,
                        startY: e.clientY,
                        startWidth: newWrapper.offsetWidth,
                        startHeight: newWrapper.offsetHeight
                    };
                    
                    newWrapper.classList.add('resizing');
                    this.imageResizeOverlay.classList.add('active');
                    
                    // Get image dimensions
                    const img = newWrapper.querySelector('img');
                    this.resizeDimensions.textContent = `${Math.round(newWrapper.offsetWidth)} x ${Math.round(img.offsetHeight)}`;
                });
            });
            
            // Click to select
            newWrapper.addEventListener('click', (e) => {
                if (e.target === newWrapper || e.target.tagName === 'IMG') {
                    document.querySelectorAll('.resizable-image-wrapper').forEach(w => {
                        w.style.borderColor = '';
                    });
                    newWrapper.style.borderColor = 'var(--accent-primary)';
                }
            });
        });
    }
    
    handleResizeMove(e) {
        if (!this.isResizing || !this.resizeData) return;
        
        e.preventDefault();
        
        const { wrapper, handle, startX, startY, startWidth, startHeight } = this.resizeData;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        
        // Calculate new width based on handle position
        if (handle.includes('e')) {
            newWidth = startWidth + deltaX;
        } else if (handle.includes('w')) {
            newWidth = startWidth - deltaX;
        }
        
        // Minimum width
        newWidth = Math.max(100, newWidth);
        
        // Maximum width (container width)
        const containerWidth = this.noteEditor.offsetWidth - 80;
        newWidth = Math.min(newWidth, containerWidth);
        
        wrapper.style.width = `${newWidth}px`;
        
        // Update dimensions display
        const img = wrapper.querySelector('img');
        this.resizeDimensions.textContent = `${Math.round(newWidth)} x ${Math.round(img.offsetHeight)}`;
    }
    
    handleResizeEnd() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        if (this.resizeData) {
            this.resizeData.wrapper.classList.remove('resizing');
        }
        
        this.imageResizeOverlay.classList.remove('active');
        this.resizeData = null;
        
        this.autoSave();
    }
    
    // ===== EXPORT/IMPORT =====
    handleExport(action) {
        if (!this.currentNoteId) {
            this.showToast('No note selected');
            return;
        }
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        switch (action) {
            case 'export-txt':
                this.downloadFile(
                    `${note.title}\n\n${this.stripHtml(note.content)}`,
                    `${this.sanitizeFilename(note.title)}.txt`,
                    'text/plain'
                );
                break;
                
            case 'export-html':
                const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${note.title}</title>
    <style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:20px}</style>
</head>
<body>
    <h1>${note.title}</h1>
    ${note.content}
</body>
</html>`;
                this.downloadFile(html, `${this.sanitizeFilename(note.title)}.html`, 'text/html');
                break;
                
            case 'export-json':
                this.downloadFile(
                    JSON.stringify(note, null, 2),
                    `${this.sanitizeFilename(note.title)}.json`,
                    'application/json'
                );
                break;
                
            case 'export-md':
                const md = `# ${note.title}\n\n${this.htmlToMarkdown(note.content)}`;
                this.downloadFile(md, `${this.sanitizeFilename(note.title)}.md`, 'text/markdown');
                break;
                
            case 'export-all':
                this.downloadFile(
                    JSON.stringify({ notes: this.notes, exportedAt: new Date().toISOString() }, null, 2),
                    `all-notes-backup-${new Date().toISOString().split('T')[0]}.json`,
                    'application/json'
                );
                break;
        }
        
        this.showToast('Exported successfully');
    }
    
    async handleImport(files) {
        let importedCount = 0;
        
        for (const file of files) {
            try {
                const content = await file.text();
                const ext = file.name.split('.').pop().toLowerCase();
                
                let note = {
                    id: this.generateId(),
                    title: file.name.replace(/\.[^/.]+$/, ''),
                    content: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                if (ext === 'json') {
                    try {
                        const data = JSON.parse(content);
                        if (data.notes && Array.isArray(data.notes)) {
                            // Import multiple notes
                            for (const n of data.notes) {
                                this.notes.push({
                                    ...n,
                                    id: this.generateId(),
                                    updatedAt: new Date().toISOString()
                                });
                            }
                            importedCount += data.notes.length;
                            continue;
                        } else {
                            note.title = data.title || note.title;
                            note.content = data.content || content;
                        }
                    } catch (e) {
                        note.content = content;
                    }
                } else if (ext === 'html') {
                    // Extract body content
                    const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    note.content = match ? match[1] : content;
                } else {
                    note.content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
                }
                
                this.notes.push(note);
                importedCount++;
            } catch (e) {
                console.error('Import error:', e);
            }
        }
        
        this.saveNotes();
        this.renderNotesList();
        this.showToast(`Imported ${importedCount} note${importedCount !== 1 ? 's' : ''}`);
    }
    
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // ===== UTILITIES =====
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    htmlToMarkdown(html) {
        return html
            .replace(/<h1[^>]*>([^<]*)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>([^<]*)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>([^<]*)<\/h3>/gi, '### $1\n\n')
            .replace(/<strong[^>]*>([^<]*)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>([^<]*)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>([^<]*)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>([^<]*)<\/i>/gi, '*$1*')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
            .replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .trim();
    }
    
    sanitizeFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return mins < 1 ? 'Just now' : `${mins}m ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
        
        return date.toLocaleDateString();
    }
    
    updateStats() {
        const text = this.stripHtml(this.noteEditor.innerHTML);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        
        this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        this.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
    }
    
    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    logout() {
        localStorage.removeItem('isAuthenticated');
        window.location.href = 'index.html';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.notesApp = new NotesApp();
});
