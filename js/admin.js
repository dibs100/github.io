// ===== FIREBASE + LOCALSTORAGE HYBRID NOTES APP =====
class HybridNotesApp {
    constructor() {
        console.log('📝 HybridNotesApp: Initializing...');
        
        // FIRST: Check authentication before anything else
        if (!this.checkAuth()) {
            return; // Stop if not authenticated
        }
        
        // Initialize storage modes
        this.storageMode = 'checking'; // checking → firestore → localstorage
        this.useFirestore = false;
        this.firestoreAvailable = false;
        
        // SECOND: Initialize Firebase and app
        this.initializeFirebase();
    }
    
    checkAuth() {
        console.log('🔐 Checking authentication...');
        
        // Check both Firebase and LocalStorage auth
        const lsAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const lsAdmin = localStorage.getItem('isAdmin') === 'true';
        
        console.log('Auth status:', { lsAuthenticated, lsAdmin });
        
        if (!lsAuthenticated) {
            console.log('❌ User not authenticated');
            this.showAuthError();
            return false;
        }
        
        console.log('✅ User authenticated via LocalStorage');
        return true;
    }
    
    async initializeFirebase() {
        console.log('🔥 Initializing Firebase connection...');
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !window.firebaseDB) {
            console.log('⚠️ Firebase not available, using LocalStorage only');
            this.storageMode = 'localstorage';
            this.useFirestore = false;
            this.firestoreAvailable = false;
            this.initApp();
            return;
        }
        
        try {
            // Test Firestore connection
            const testRef = window.firebaseDB.collection('_test').doc('connection');
            await testRef.set({ test: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            await testRef.delete();
            
            console.log('✅ Firebase Firestore connection successful');
            this.storageMode = 'firestore';
            this.useFirestore = true;
            this.firestoreAvailable = true;
        } catch (error) {
            console.log('⚠️ Firebase Firestore connection failed, using LocalStorage:', error.message);
            this.storageMode = 'localstorage';
            this.useFirestore = false;
            this.firestoreAvailable = false;
        }
        
        this.initApp();
    }
    
    showAuthError() {
        // Hide everything, show auth error
        const mainApp = document.getElementById('mainApp');
        const authError = document.getElementById('authError');
        const loadingScreen = document.getElementById('firebaseLoading');
        const errorScreen = document.getElementById('firebaseError');
        
        if (mainApp) mainApp.style.display = 'none';
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (errorScreen) errorScreen.style.display = 'none';
        if (authError) authError.style.display = 'flex';
    }
    
    async initApp() {
        console.log(`🚀 Initializing Notes App (Storage: ${this.storageMode})...`);
        
        // Hide auth error, show main app
        const authError = document.getElementById('authError');
        const mainApp = document.getElementById('mainApp');
        const loadingScreen = document.getElementById('firebaseLoading');
        
        if (authError) authError.style.display = 'none';
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        
        // Initialize notes arrays for both storages
        this.notes = [];
        this.localNotes = JSON.parse(localStorage.getItem('dibesh_notes')) || [];
        this.currentNoteId = null;
        this.saveTimeout = null;
        this.AUTO_SAVE_DELAY = 2000;
        this.isSaving = false;
        this.imageResizeData = null;
        
        // ===== DOM ELEMENTS =====
        this.notesList = document.getElementById('notesList');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteEditor = document.getElementById('noteEditor');
        this.noteCount = document.getElementById('noteCount');
        this.searchBox = document.getElementById('searchBox');
        this.charCount = document.getElementById('charCount');
        this.autoSaveIndicator = document.getElementById('autoSaveIndicator');
        this.storageInfo = document.getElementById('storageInfo');
        
        // ===== BUTTONS =====
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.exportOptions = document.getElementById('exportOptions');
        this.importBtn = document.getElementById('importBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.saveToFolderBtn = document.getElementById('saveToFolderBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.insertTableBtn = document.getElementById('insertTableBtn');
        
        // ===== EVENT LISTENERS =====
        this.setupEventListeners();
        
        // ===== LOAD NOTES FROM APPROPRIATE STORAGE =====
        await this.loadNotes();
        
        // ===== SYNC LOCALSTORAGE WITH FIRESTORE (if available) =====
        if (this.useFirestore && this.firestoreAvailable) {
            await this.syncLocalToFirestore();
        }
        
        // Select first note if available
        if (this.notes.length > 0) {
            console.log('📋 Selecting first note');
            this.selectNote(this.notes[0].id);
        } else {
            console.log('📋 No notes, creating new one');
            await this.createNewNote();
        }
        
        this.updateCharacterCount();
        this.updateStorageInfo();
        this.setCursorToEnd();
        
        console.log('✅ Notes App initialized with', this.notes.length, 'notes');
    }
    
    async loadNotes() {
        console.log(`📥 Loading notes from ${this.useFirestore ? 'Firestore' : 'LocalStorage'}...`);
        
        if (this.useFirestore && this.firestoreAvailable) {
            try {
                await this.loadFromFirestore();
            } catch (error) {
                console.error('❌ Failed to load from Firestore, falling back to LocalStorage:', error);
                this.useFirestore = false;
                this.loadFromLocalStorage();
            }
        } else {
            this.loadFromLocalStorage();
        }
        
        console.log(`📥 Loaded ${this.notes.length} notes`);
        this.renderNotes();
    }
    
    async loadFromFirestore() {
        try {
            const snapshot = await window.firebaseDB.collection('notes').get();
            this.notes = [];
            
            snapshot.forEach(doc => {
                const note = doc.data();
                note.id = doc.id; // Add Firestore document ID
                this.notes.push(note);
            });
            
            // Sort by updatedAt
            this.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            // Update LocalStorage backup
            localStorage.setItem('dibesh_notes_backup', JSON.stringify(this.notes));
        } catch (error) {
            throw new Error(`Firestore load failed: ${error.message}`);
        }
    }
    
    loadFromLocalStorage() {
        this.notes = JSON.parse(localStorage.getItem('dibesh_notes')) || [];
        
        // Sort by updatedAt
        this.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    
    async syncLocalToFirestore() {
        try {
            const localNotes = JSON.parse(localStorage.getItem('dibesh_notes')) || [];
            
            if (localNotes.length === 0) return;
            
            console.log('🔄 Syncing LocalStorage notes to Firestore...');
            let syncCount = 0;
            
            for (const localNote of localNotes) {
                // Check if note exists in Firestore
                const docRef = window.firebaseDB.collection('notes').doc(localNote.id);
                const doc = await docRef.get();
                
                if (!doc.exists) {
                    // Note doesn't exist in Firestore, upload it
                    await docRef.set({
                        ...localNote,
                        syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    syncCount++;
                }
            }
            
            if (syncCount > 0) {
                console.log(`✅ Synced ${syncCount} notes to Firestore`);
            }
        } catch (error) {
            console.error('❌ Failed to sync to Firestore:', error);
        }
    }
    
    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        // Note actions
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteNote());
        
        // Export/Import
        this.exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.exportOptions.classList.toggle('show');
        });
        
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportNotes(format);
                this.exportOptions.classList.remove('show');
            });
        });
        
        this.importBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.importNotes(e));
        
        this.saveToFolderBtn.addEventListener('click', () => this.saveToLocalFolder());
        
        // Logout
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Search
        this.searchBox.addEventListener('input', () => this.filterNotes());
        
        // Auto-save
        this.noteTitle.addEventListener('input', () => {
            this.autoSave();
            this.updateNoteTitleInList();
        });
        
        this.noteEditor.addEventListener('input', () => {
            this.autoSave();
            this.updateCharacterCount();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveNote();
            }
            
            // Escape to blur editor
            if (e.key === 'Escape') {
                this.noteEditor.blur();
            }
        });
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = e.currentTarget.dataset.command;
                const value = e.currentTarget.dataset.value;
                this.executeCommand(command, value);
            });
        });
        
        // Table insertion
        this.insertTableBtn.addEventListener('click', () => {
            this.insertTable();
        });
        
        // Image paste
        this.noteEditor.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Image resizing
        this.setupImageResizing();
        
        // Close export menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.exportBtn.contains(e.target) && !this.exportOptions.contains(e.target)) {
                this.exportOptions.classList.remove('show');
            }
        });
        
        console.log('✅ Event listeners setup complete');
    }
    
    // ===== NOTE MANAGEMENT =====
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    async createNewNote() {
        console.log('📝 Creating new note');
        const newNote = {
            id: this.generateId(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to both storages
        await this.saveNoteToAllStorages(newNote);
        
        this.notes.unshift(newNote);
        this.renderNotes();
        this.selectNote(newNote.id);
        
        setTimeout(() => {
            this.noteTitle.focus();
            this.noteTitle.setSelectionRange(this.noteTitle.value.length, this.noteTitle.value.length);
        }, 100);
    }
    
    selectNote(noteId) {
        console.log('📋 Selecting note:', noteId);
        this.currentNoteId = noteId;
        const note = this.notes.find(n => n.id === noteId);
        
        if (!note) {
            console.error('❌ Note not found:', noteId);
            return;
        }
        
        this.noteTitle.value = note.title;
        this.noteEditor.innerHTML = note.content || '<p><br></p>';
        
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === noteId) {
                item.classList.add('active');
            }
        });
        
        this.updateCharacterCount();
        this.setCursorToEnd();
        setTimeout(() => this.setupImageResizing(), 100);
    }
    
    async saveNote() {
        if (!this.currentNoteId || this.isSaving) return;
        
        console.log('💾 Saving note:', this.currentNoteId);
        this.isSaving = true;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;
        
        const title = this.noteTitle.value.trim() || 'Untitled Note';
        const content = this.noteEditor.innerHTML;
        
        const updatedNote = {
            ...this.notes[noteIndex],
            title: title,
            content: content,
            updatedAt: new Date().toISOString()
        };
        
        this.notes[noteIndex] = updatedNote;
        
        // Save to both storages
        await this.saveNoteToAllStorages(updatedNote);
        
        this.renderNotes();
        
        this.autoSaveIndicator.textContent = '✓ Saved';
        this.autoSaveIndicator.style.color = '#10b981';
        
        setTimeout(() => {
            this.autoSaveIndicator.textContent = `Auto-save enabled (${this.useFirestore ? 'Firestore' : 'Local'})`;
            this.autoSaveIndicator.style.color = '';
            this.isSaving = false;
        }, 1500);
    }
    
    async saveNoteToAllStorages(note) {
        // Always save to LocalStorage
        this.saveToLocalStorage();
        
        // Save to Firestore if available
        if (this.useFirestore && this.firestoreAvailable) {
            try {
                await window.firebaseDB.collection('notes').doc(note.id).set({
                    ...note,
                    syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('❌ Failed to save to Firestore:', error);
                this.useFirestore = false;
                this.storageInfo.textContent = 'Storage: Local (Firestore failed)';
            }
        }
    }
    
    autoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            if (this.currentNoteId) {
                this.saveNote();
            }
        }, this.AUTO_SAVE_DELAY);
    }
    
    async deleteNote() {
        if (!this.currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            const noteId = this.currentNoteId;
            
            // Delete from Firestore
            if (this.useFirestore && this.firestoreAvailable) {
                try {
                    await window.firebaseDB.collection('notes').doc(noteId).delete();
                } catch (error) {
                    console.error('❌ Failed to delete from Firestore:', error);
                }
            }
            
            // Delete from LocalStorage
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveToLocalStorage();
            this.renderNotes();
            
            if (this.notes.length === 0) {
                await this.createNewNote();
            } else {
                this.selectNote(this.notes[0].id);
            }
        }
    }
    
    updateNoteTitleInList() {
        if (!this.currentNoteId) return;
        
        const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
        if (noteIndex === -1) return;
        
        const title = this.noteTitle.value.trim() || 'Untitled Note';
        this.notes[noteIndex].title = title;
        this.notes[noteIndex].updatedAt = new Date().toISOString();
        
        // Save to both storages
        this.saveNoteToAllStorages(this.notes[noteIndex]);
        this.renderNotes();
    }
    
    updateCharacterCount() {
        const text = this.noteEditor.innerText || '';
        const length = text.length;
        this.charCount.textContent = `${length} characters`;
    }
    
    saveToLocalStorage() {
        localStorage.setItem('dibesh_notes', JSON.stringify(this.notes));
        this.updateStorageInfo();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    renderNotes() {
        const searchTerm = this.searchBox.value.toLowerCase();
        let filteredNotes = this.notes;
        
        if (searchTerm) {
            filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) || 
                this.stripHtml(note.content).toLowerCase().includes(searchTerm)
            );
        }
        
        filteredNotes.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        
        if (filteredNotes.length === 0) {
            this.notesList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--secondary);">
                    <i class="fas fa-sticky-note" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>${searchTerm ? 'No matching notes' : 'No notes yet'}</p>
                </div>
            `;
        } else {
            this.notesList.innerHTML = filteredNotes.map(note => `
                <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" 
                     data-id="${note.id}">
                    <div class="note-item-title">${note.title || 'Untitled Note'}</div>
                    <div class="note-item-preview">${this.stripHtml(note.content).substring(0, 100)}</div>
                    <div class="note-item-date">${this.formatDate(note.updatedAt)}</div>
                    ${this.useFirestore ? '<div class="firestore-badge" title="Synced to Cloud"><i class="fas fa-cloud"></i></div>' : ''}
                </div>
            `).join('');
            
            document.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectNote(item.dataset.id);
                });
            });
        }
        
        this.noteCount.textContent = `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`;
    }
    
    filterNotes() {
        this.renderNotes();
    }
    
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    // ===== EDITOR FUNCTIONS =====
    setCursorToEnd() {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this.noteEditor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        this.noteEditor.focus();
    }
    
    executeCommand(command, value = null) {
        document.execCommand(command, false, value);
        this.noteEditor.focus();
    }
    
    insertTable() {
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');
        
        if (rows && cols) {
            let tableHtml = '<table><tbody>';
            for (let i = 0; i < parseInt(rows); i++) {
                tableHtml += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    tableHtml += `<td>Cell ${i+1}-${j+1}</td>`;
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table>';
            
            document.execCommand('insertHTML', false, tableHtml);
            this.noteEditor.focus();
        }
    }
    
    // ===== IMAGE HANDLING =====
    handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                event.preventDefault();
                const blob = item.getAsFile();
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'resizable-image';
                    img.style.maxWidth = '300px';
                    img.style.height = 'auto';
                    
                    const resizeHandle = document.createElement('div');
                    resizeHandle.className = 'resize-handle';
                    img.appendChild(resizeHandle);
                    
                    document.execCommand('insertHTML', false, img.outerHTML);
                    this.setupImageResizing();
                };
                
                reader.readAsDataURL(blob);
                break;
            }
        }
    }
    
    setupImageResizing() {
        // Image resizing implementation
        document.querySelectorAll('.resizable-image').forEach(img => {
            img.addEventListener('mousedown', this.handleImageMouseDown.bind(this));
            
            if (!img.querySelector('.resize-handle')) {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                img.appendChild(resizeHandle);
            }
        });
        
        document.addEventListener('mousemove', this.handleImageMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleImageMouseUp.bind(this));
    }
    
    handleImageMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            
            const img = e.target.parentElement;
            this.imageResizeData = {
                img: img,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: parseInt(getComputedStyle(img).width),
                startHeight: parseInt(getComputedStyle(img).height)
            };
            
            img.classList.add('resizing');
        }
    }
    
    handleImageMouseMove(e) {
        if (this.imageResizeData) {
            e.preventDefault();
            
            const { img, startX, startY, startWidth, startHeight } = this.imageResizeData;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(50, startWidth + deltaX);
            const aspectRatio = startHeight / startWidth;
            const newHeight = newWidth * aspectRatio;
            
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
            img.style.maxWidth = 'none';
            
            this.autoSave();
        }
    }
    
    handleImageMouseUp() {
        if (this.imageResizeData) {
            this.imageResizeData.img.classList.remove('resizing');
            this.imageResizeData.img.style.maxWidth = '100%';
            this.imageResizeData = null;
            this.saveNote();
        }
    }
    
    // ===== EXPORT/IMPORT FUNCTIONS =====
    exportNotes(format) {
        switch (format) {
            case 'txt': this.exportAllAsTXT(); break;
            case 'json': this.exportAllAsJSON(); break;
            case 'html': this.exportAllAsHTML(); break;
            case 'markdown': this.exportAllAsMarkdown(); break;
            case 'single-txt': this.exportCurrentAsTXT(); break;
            case 'single-html': this.exportCurrentAsHTML(); break;
        }
    }
    
    exportAllAsTXT() {
        this.exportMultipleFiles('txt', 'text/plain', (note) => 
            `${note.title}\n\n${this.stripHtml(note.content)}`
        );
    }
    
    exportAllAsJSON() {
        const exportData = {
            notes: this.notes,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            storageType: this.useFirestore ? 'firestore' : 'localstorage'
        };
        
        this.downloadFile(
            JSON.stringify(exportData, null, 2),
            `notes-backup-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    }
    
    exportAllAsHTML() {
        this.exportMultipleFiles('html', 'text/html', (note) => `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${note.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
                    img { max-width: 100%; height: auto; }
                    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                </style>
            </head>
            <body>
                <h1>${note.title}</h1>
                <div>${note.content}</div>
            </body>
            </html>
        `);
    }
    
    exportAllAsMarkdown() {
        this.exportMultipleFiles('md', 'text/markdown', (note) => {
            let md = `# ${note.title}\n\n`;
            md += this.htmlToMarkdown(note.content);
            md += `\n\n---\n*Exported from My Notes on ${new Date().toLocaleString()}*`;
            return md;
        });
    }
    
    exportCurrentAsTXT() {
        if (!this.currentNoteId) return;
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        this.downloadFile(
            `${note.title}\n\n${this.stripHtml(note.content)}`,
            `${this.sanitizeFilename(note.title)}.txt`,
            'text/plain'
        );
    }
    
    exportCurrentAsHTML() {
        if (!this.currentNoteId) return;
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${note.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
                    img { max-width: 100%; height: auto; }
                    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                </style>
            </head>
            <body>
                <h1>${note.title}</h1>
                <div>${note.content}</div>
            </body>
            </html>
        `;
        
        this.downloadFile(html, `${this.sanitizeFilename(note.title)}.html`, 'text/html');
    }
    
    htmlToMarkdown(html) {
        return html
            .replace(/<h1[^>]*>([^<]+)<\/h1>/g, '# $1\n\n')
            .replace(/<h2[^>]*>([^<]+)<\/h2>/g, '## $1\n\n')
            .replace(/<h3[^>]*>([^<]+)<\/h3>/g, '### $1\n\n')
            .replace(/<strong[^>]*>([^<]+)<\/strong>/g, '**$1**')
            .replace(/<b[^>]*>([^<]+)<\/b>/g, '**$1**')
            .replace(/<em[^>]*>([^<]+)<\/em>/g, '*$1*')
            .replace(/<i[^>]*>([^<]+)<\/i>/g, '*$1*')
            .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)')
            .replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
            .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/g, '')
            .replace(/<li[^>]*>([^<]+)<\/li>/g, '- $1\n')
            .replace(/<p[^>]*>([^<]+)<\/p>/g, '$1\n\n')
            .replace(/<br[^>]*>/g, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    
    exportMultipleFiles(extension, mimeType, contentGenerator) {
        if (this.notes.length === 0) {
            alert('No notes to export');
            return;
        }
        
        alert(`Exporting ${this.notes.length} notes as ${extension.toUpperCase()} files...`);
        
        setTimeout(() => {
            this.notes.forEach((note, index) => {
                setTimeout(() => {
                    this.downloadFile(
                        contentGenerator(note),
                        `${this.sanitizeFilename(note.title)}-${index + 1}.${extension}`,
                        mimeType
                    );
                }, index * 500);
            });
        }, 1000);
    }
    
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50) || 'note';
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // ===== IMPORT FUNCTIONS =====
    async importNotes(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        let importedCount = 0;
        
        for (const file of files) {
            try {
                const content = await this.readFile(file);
                const note = this.createNoteFromFile(file, content);
                
                if (note) {
                    // Save to both storages
                    await this.saveNoteToAllStorages(note);
                    this.notes.unshift(note);
                    importedCount++;
                }
            } catch (error) {
                console.error(`Error importing ${file.name}:`, error);
            }
        }
        
        if (importedCount > 0) {
            this.saveToLocalStorage();
            this.renderNotes();
            alert(`Successfully imported ${importedCount} note${importedCount !== 1 ? 's' : ''}`);
        }
        
        event.target.value = '';
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    createNoteFromFile(file, content) {
        const extension = file.name.split('.').pop().toLowerCase();
        const filename = file.name.replace(/\.[^/.]+$/, "");
        
        let noteContent = '';
        let noteTitle = filename;
        
        switch (extension) {
            case 'md':
            case 'txt':
            case 'html':
            case 'rtf':
                noteContent = content;
                break;
                
            case 'json':
                try {
                    const data = JSON.parse(content);
                    if (data.title && data.content) {
                        noteTitle = data.title;
                        noteContent = data.content;
                    }
                } catch (e) {
                    noteContent = content;
                }
                break;
                
            default:
                noteContent = content;
        }
        
        return {
            id: this.generateId(),
            title: noteTitle,
            content: noteContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            originalFilename: file.name
        };
    }
    
    // ===== LOCAL FOLDER SAVING =====
    async saveToLocalFolder() {
        try {
            if ('showDirectoryPicker' in window) {
                const directoryHandle = await window.showDirectoryPicker({
                    startIn: 'documents'
                });
                
                const notesFolderHandle = await directoryHandle.getDirectoryHandle('My-Notes', { create: true });
                
                const backupData = {
                    notes: this.notes,
                    exportedAt: new Date().toISOString(),
                    version: '1.0',
                    storageType: this.useFirestore ? 'firestore' : 'localstorage'
                };
                
                const content = JSON.stringify(backupData, null, 2);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `notes-backup-${timestamp}.json`;
                
                const fileHandle = await notesFolderHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                
                alert(`✅ Backup saved to: My-Notes/${filename}`);
                return;
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.log('File System API failed:', error);
            }
        }
        
        this.downloadBackupFile();
    }
    
    downloadBackupFile() {
        const backupData = {
            notes: this.notes,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            storageType: this.useFirestore ? 'firestore' : 'localstorage'
        };
        
        const content = JSON.stringify(backupData, null, 2);
        const filename = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        this.downloadFile(content, filename, 'application/json');
        
        alert(`📥 Backup downloaded as: ${filename}\n\n💡 Save it to your preferred location.`);
    }
    
    updateStorageInfo() {
        const notesSize = JSON.stringify(this.notes).length;
        const totalSize = (notesSize / 1024).toFixed(2);
        const storageType = this.useFirestore ? 'Firestore + Local' : 'LocalStorage';
        this.storageInfo.textContent = `Storage: ${storageType} (${totalSize} KB)`;
        this.autoSaveIndicator.textContent = `Auto-save (${storageType})`;
    }
    
    logout() {
        // Clear authentication
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('isAdmin');
        
        // Redirect to index
        window.location.href = 'index.html';
    }
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM fully loaded, initializing HybridNotesApp...');
    try {
        new HybridNotesApp();
    } catch (error) {
        console.error('❌ Failed to initialize HybridNotesApp:', error);
        alert('Error loading notes application. Please refresh the page.');
    }
});
