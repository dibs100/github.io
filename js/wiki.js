// ===== WIKI CONFIGURATION =====
const CONFIG = {
    storageKey: 'wiki_pages',
    authKey: 'isAuthenticated',
    passwordKey: 'admin_password',
    defaultPassword: 'admin123',
    defaultPage: 'welcome'
};

// ===== STATE =====
const state = {
    currentPage: null,
    isEditing: false,
    isAuthenticated: false,
    pages: new Map(),
    editor: null,
    searchQuery: ''
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initEventListeners();
    loadPages();
    
    if (state.isAuthenticated) {
        showWiki();
        const path = window.location.hash.slice(1) || CONFIG.defaultPage;
        navigateToPage(path);
    }
});

// ===== AUTHENTICATION =====
function checkAuth() {
    // Set default password if none exists
    if (!localStorage.getItem(CONFIG.passwordKey)) {
        localStorage.setItem(CONFIG.passwordKey, CONFIG.defaultPassword);
    }
    
    state.isAuthenticated = localStorage.getItem(CONFIG.authKey) === 'true';
}

function login(password) {
    const storedPassword = localStorage.getItem(CONFIG.passwordKey);
    
    if (password === storedPassword) {
        localStorage.setItem(CONFIG.authKey, 'true');
        state.isAuthenticated = true;
        showWiki();
        loadPages();
        navigateToPage(CONFIG.defaultPage);
        showToast('Welcome back!');
        return true;
    }
    
    document.getElementById('loginError').classList.add('show');
    return false;
}

function logout() {
    localStorage.removeItem(CONFIG.authKey);
    state.isAuthenticated = false;
    location.reload();
}

function showWiki() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('wikiApp').style.display = 'flex';
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Login
    document.getElementById('loginBtn').addEventListener('click', () => {
        const password = document.getElementById('passwordInput').value;
        login(password);
    });
    
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginBtn').click();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // User menu toggle
    document.getElementById('userBtn').addEventListener('click', () => {
        document.querySelector('.user-menu').classList.toggle('active');
    });
    
    // Close user menu on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            document.querySelector('.user-menu').classList.remove('active');
        }
    });
    
    // Edit toggle
    document.getElementById('editToggleBtn').addEventListener('click', toggleEditMode);
    
    // New page
    document.getElementById('newPageBtn').addEventListener('click', () => {
        openModal('newPageModal');
    });
    
    document.getElementById('createPage').addEventListener('click', createNewPage);
    document.getElementById('cancelNew').addEventListener('click', () => closeModal('newPageModal'));
    document.getElementById('closeNewModal').addEventListener('click', () => closeModal('newPageModal'));
    
    // Save/Cancel edit
    document.getElementById('savePage').addEventListener('click', saveCurrentPage);
    document.getElementById('cancelEdit').addEventListener('click', () => toggleEditMode(false));
    document.getElementById('deletePage').addEventListener('click', deleteCurrentPage);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchPages(e.target.value);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (!state.isAuthenticated) return;
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            toggleEditMode();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && state.isEditing) {
            e.preventDefault();
            saveCurrentPage();
        }
        
        if (e.key === 'Escape') {
            closeAllModals();
            if (state.isEditing) {
                toggleEditMode(false);
            }
        }
    });
}

// ===== PAGE MANAGEMENT =====
function loadPages() {
    const stored = localStorage.getItem(CONFIG.storageKey);
    let pages = [];
    
    if (stored) {
        try {
            const data = JSON.parse(stored);
            pages = data.pages || [];
        } catch (e) {
            pages = getDefaultPages();
        }
    } else {
        pages = getDefaultPages();
    }
    
    state.pages = new Map(pages.map(p => [p.path, p]));
    renderNavigation();
}

function getDefaultPages() {
    return [
        {
            path: 'welcome',
            title: 'Welcome',
            content: `# Welcome to Dibesh Shrestha Wiki

This wiki contains technical documentation for IT infrastructure, monitoring solutions, and best practices.

## Getting Started

Browse the sidebar to explore documentation topics:

- **Monitoring** - Zabbix, Nagios, Centreon guides
- **Virtualization** - Proxmox, VMware setup instructions  
- **Linux** - Server configuration and maintenance
- **Networking** - Network monitoring and troubleshooting

## Contributing

Login to create and edit pages. All changes are stored locally in your browser.`,
            tags: ['Welcome', 'Documentation'],
            updated: new Date().toISOString()
        },
        {
            path: 'zabbix/installation',
            title: 'Zabbix Installation Guide',
            content: `# Zabbix Installation Guide

Complete guide for installing Zabbix 7.0 on Enterprise Linux systems.

## Prerequisites

- RHEL 8/9 or CentOS Stream
- MySQL 8.0 or PostgreSQL 13+
- PHP 8.0+
- Minimum 4GB RAM

## Installation Steps

### 1. Add Repository

\`\`\`bash
rpm -Uvh https://repo.zabbix.com/zabbix/7.0/rhel/9/x86_64/zabbix-release-7.0-1.el9.noarch.rpm
dnf clean all
\`\`\`

### 2. Install Packages

\`\`\`bash
dnf install zabbix-server-mysql zabbix-web-mysql zabbix-apache-conf zabbix-sql-scripts zabbix-selinux-policy zabbix-agent
\`\`\`

### 3. Database Setup

\`\`\`sql
create database zabbix character set utf8mb4 collate utf8mb4_bin;
create user zabbix@localhost identified by 'password';
grant all privileges on zabbix.* to zabbix@localhost;
\`\`\`

Import schema:
\`\`\`bash
zcat /usr/share/zabbix-sql-scripts/mysql/server.sql.gz | mysql --default-character-set=utf8mb4 -uzabbix -p zabbix
\`\`\`

### 4. Configuration

Edit \`/etc/zabbix/zabbix_server.conf\`:
\`\`\`
DBPassword=password
\`\`\`

### 5. Start Services

\`\`\`bash
systemctl restart zabbix-server zabbix-agent httpd php-fpm
systemctl enable zabbix-server zabbix-agent httpd php-fpm
\`\`\`

## Post-Installation

Access the web interface at \`http://your-server/zabbix\` and complete the setup wizard.

## Troubleshooting

Check logs at \`/var/log/zabbix/zabbix_server.log\` for any issues.`,
            tags: ['Zabbix', 'Monitoring', 'Installation'],
            updated: new Date().toISOString()
        }
    ];
}

function savePages() {
    const pages = Array.from(state.pages.values());
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({ pages }));
}

function getPage(path) {
    return state.pages.get(path) || null;
}

function savePage(path, title, content, tags = []) {
    const existing = state.pages.get(path);
    const page = {
        path,
        title,
        content,
        tags,
        updated: new Date().toISOString(),
        created: existing ? existing.created : new Date().toISOString()
    };
    
    state.pages.set(path, page);
    savePages();
    renderNavigation();
    return page;
}

function deletePage(path) {
    if (!confirm(`Delete "${path}" permanently?`)) return;
    
    state.pages.delete(path);
    savePages();
    renderNavigation();
    
    if (state.currentPage === path) {
        navigateToPage('welcome');
    }
    
    showToast('Page deleted');
}

// ===== NAVIGATION =====
function renderNavigation() {
    const nav = document.getElementById('sidebarNav');
    const pages = Array.from(state.pages.values());
    
    // Group by folder
    const tree = {};
    pages.forEach(page => {
        const parts = page.path.split('/');
        const folder = parts.length > 1 ? parts[0] : 'General';
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(page);
    });
    
    let html = '';
    
    // Sort folders
    const folders = Object.keys(tree).sort();
    
    folders.forEach(folder => {
        const isActive = state.currentPage && state.currentPage.startsWith(folder + '/');
        html += `
            <div class="nav-section">
                <div class="nav-title">${formatTitle(folder)}</div>
                <ul class="nav-list">
                    ${tree[folder].map(page => `
                        <li class="nav-item ${page.path === state.currentPage ? 'active' : ''}" 
                            data-path="${page.path}" onclick="navigateToPage('${page.path}')">
                            <i class="fas fa-file-alt"></i>
                            <span>${page.title}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });
    
    nav.innerHTML = html;
}

function navigateToPage(path) {
    const page = getPage(path);
    if (!page) {
        render404();
        return;
    }
    
    state.currentPage = path;
    window.location.hash = path;
    
    // Update UI
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.path === path);
    });
    
    document.getElementById('pageTitle').textContent = page.title;
    document.getElementById('pageDate').textContent = 'Updated: ' + new Date(page.updated).toLocaleDateString();
    document.getElementById('pageReadTime').textContent = Math.ceil(page.content.split(' ').length / 200) + ' min read';
    
    // Render markdown
    document.getElementById('contentBody').innerHTML = marked.parse(page.content);
    
    // Render tags
    const tagsContainer = document.getElementById('pageTags');
    tagsContainer.innerHTML = page.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    // Highlight code
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    // Exit edit mode
    if (state.isEditing) {
        toggleEditMode(false);
    }
}

function render404() {
    document.getElementById('pageTitle').textContent = 'Page Not Found';
    document.getElementById('contentBody').innerHTML = `
        <p>The page "${state.currentPage}" does not exist.</p>
        <button class="btn btn-primary" onclick="createPageFromCurrent()">
            <i class="fas fa-plus"></i> Create this page
        </button>
    `;
    document.getElementById('pageTags').innerHTML = '';
}

// ===== EDITING =====
function toggleEditMode(enable = !state.isEditing) {
    state.isEditing = enable;
    
    const viewEl = document.getElementById('wikiContent');
    const editEl = document.getElementById('wikiEditor');
    const editBtn = document.getElementById('editToggleBtn');
    
    if (enable) {
        viewEl.style.display = 'none';
        editEl.style.display = 'flex';
        editBtn.innerHTML = '<i class="fas fa-eye"></i> View';
        editBtn.classList.add('active');
        
        const page = getPage(state.currentPage) || {
            path: state.currentPage,
            title: 'New Page',
            content: ''
        };
        
        document.getElementById('editTitle').value = page.title;
        document.getElementById('editPath').value = page.path;
        
        if (!state.editor) {
            state.editor = new EasyMDE({
                element: document.getElementById('markdownEditor'),
                spellChecker: false,
                status: ['lines', 'words'],
                toolbar: [
                    'bold', 'italic', 'heading', '|',
                    'quote', 'unordered-list', 'ordered-list', '|',
                    'link', 'image', 'code', 'table', '|',
                    'preview', 'side-by-side', 'fullscreen', '|',
                    'guide'
                ]
            });
        }
        
        state.editor.value(page.content);
        setTimeout(() => state.editor.codemirror.refresh(), 100);
    } else {
        viewEl.style.display = 'block';
        editEl.style.display = 'none';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.classList.remove('active');
    }
}

function saveCurrentPage() {
    const title = document.getElementById('editTitle').value;
    const path = document.getElementById('editPath').value;
    const content = state.editor.value();
    
    if (!title || !path) {
        showToast('Title and path are required', 'error');
        return;
    }
    
    const page = savePage(path, title, content, ['Documentation']);
    navigateToPage(path);
    showToast('Page saved successfully');
}

function deleteCurrentPage() {
    deletePage(state.currentPage);
}

function createNewPage() {
    const title = document.getElementById('newPageTitle').value;
    const path = document.getElementById('newPagePath').value || title.toLowerCase().replace(/\s+/g, '-');
    
    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    
    const fullPath = path.startsWith('/') ? path.slice(1) : path;
    
    savePage(fullPath, title, `# ${title}\n\nStart writing...`, ['New']);
    closeModal('newPageModal');
    navigateToPage(fullPath);
    toggleEditMode(true);
    
    document.getElementById('newPageTitle').value = '';
    document.getElementById('newPagePath').value = '';
}

function createPageFromCurrent() {
    const path = state.currentPage;
    const title = path.split('/').pop().replace(/-/g, ' ');
    savePage(path, title, `# ${title}\n\n`, []);
    navigateToPage(path);
    toggleEditMode(true);
}

// ===== SEARCH =====
function searchPages(query) {
    if (!query) {
        renderNavigation();
        return;
    }
    
    const pages = Array.from(state.pages.values());
    const results = pages.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.content.toLowerCase().includes(query.toLowerCase())
    );
    
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = `
        <div class="nav-section">
            <div class="nav-title">Search Results (${results.length})</div>
            <ul class="nav-list">
                ${results.map(page => `
                    <li class="nav-item" data-path="${page.path}" onclick="navigateToPage('${page.path}')">
                        <i class="fas fa-search"></i>
                        <span>${page.title}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

// ===== UTILITIES =====
function formatTitle(str) {
    return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    
    msgEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose for onclick handlers
window.navigateToPage = navigateToPage;
window.createPageFromCurrent = createPageFromCurrent;
