/**
 * Dibesh Wiki - Modern Markdown Documentation System
 * Features: Git-based storage, Live Markdown Editor, Search, Dark/Light Mode
 */

// ===== CONFIGURATION =====
const CONFIG = {
    storageKey: 'wiki_pages',
    adminKey: 'isAuthenticated',
    defaultPage: 'welcome',
    version: '1.0.0'
};

// ===== STATE MANAGEMENT =====
const state = {
    currentPage: null,
    isEditing: false,
    isAdmin: false,
    pages: new Map(),
    editor: null,
    searchQuery: ''
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initTheme();
    initNavigation();
    initEditor();
    initEventListeners();
    loadPages();
    
    // Route to page from URL or default
    const path = window.location.hash.slice(1) || CONFIG.defaultPage;
    navigateToPage(path);
});

// ===== AUTHENTICATION =====
function initAuth() {
    state.isAdmin = localStorage.getItem(CONFIG.adminKey) === 'true';
    if (state.isAdmin) {
        document.body.classList.add('admin-mode');
        updateAdminUI();
    }
}

function loginAdmin(password) {
    // Use same password as main site
    const storedPassword = localStorage.getItem('admin_password') || 'admin123';
    if (password === storedPassword) {
        localStorage.setItem(CONFIG.adminKey, 'true');
        state.isAdmin = true;
        document.body.classList.add('admin-mode');
        updateAdminUI();
        showToast('Admin access granted', 'success');
        closeModal('adminModal');
        return true;
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem(CONFIG.adminKey);
    state.isAdmin = false;
    document.body.classList.remove('admin-mode');
    updateAdminUI();
    showToast('Logged out', 'success');
}

function updateAdminUI() {
    const deleteBtn = document.getElementById('deletePageBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (state.isAdmin) {
        deleteBtn.style.display = 'flex';
        adminBtn.innerHTML = '<i class="fas fa-unlock"></i>';
        adminBtn.title = 'Logout Admin';
    } else {
        deleteBtn.style.display = 'none';
        adminBtn.innerHTML = '<i class="fas fa-lock"></i>';
        adminBtn.title = 'Admin Login';
    }
}

// ===== THEME MANAGEMENT =====
function initTheme() {
    const savedTheme = localStorage.getItem('wiki_theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wiki_theme', theme);
    
    const toggle = document.getElementById('themeToggle');
    if (theme === 'dark') {
        toggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    } else {
        toggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
    
    // Update editor theme if exists
    if (state.editor) {
        const cm = state.editor.codemirror;
        cm.setOption('theme', theme === 'dark' ? 'default' : 'default');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// ===== NAVIGATION =====
function initNavigation() {
    renderNavigation();
}

function renderNavigation() {
    const nav = document.getElementById('sidebarNav');
    const pages = getAllPages();
    
    // Group pages by folder
    const tree = buildPageTree(pages);
    
    nav.innerHTML = renderNavTree(tree);
    
    // Add click handlers
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const path = item.dataset.path;
            if (path) {
                navigateToPage(path);
            }
        });
    });
}

function buildPageTree(pages) {
    const root = { children: {}, pages: [] };
    
    pages.forEach(page => {
        const parts = page.path.split('/').filter(p => p);
        let current = root;
        
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                current.pages.push(page);
            } else {
                if (!current.children[part]) {
                    current.children[part] = { children: {}, pages: [] };
                }
                current = current.children[part];
            }
        });
    });
    
    return root;
}

function renderNavTree(node, level = 0) {
    let html = '';
    
    // Render folders
    Object.entries(node.children).forEach(([name, childNode]) => {
        const folderId = `folder-${name}-${level}`;
        html += `
            <div class="nav-section">
                <div class="nav-item nav-folder" data-folder="${name}">
                    <i class="fas fa-folder"></i>
                    <span>${formatTitle(name)}</span>
                    <i class="fas fa-chevron-right nav-expand"></i>
                </div>
                <div class="nav-children">
                    ${renderNavTree(childNode, level + 1)}
                </div>
            </div>
        `;
    });
    
    // Render pages
    node.pages.forEach(page => {
        const isActive = state.currentPage === page.path;
        const icon = getPageIcon(page);
        html += `
            <a href="#${page.path}" class="nav-item ${isActive ? 'active' : ''}" data-path="${page.path}">
                <i class="${icon}"></i>
                <span>${page.title}</span>
                ${state.isAdmin ? `
                    <span class="nav-actions">
                        <button onclick="event.stopPropagation(); deletePage('${page.path}')" title="Delete">
                            <i class="fas fa-times"></i>
                        </button>
                    </span>
                ` : ''}
            </a>
        `;
    });
    
    return html;
}

function getPageIcon(page) {
    if (page.path.includes('guide')) return 'fas fa-book';
    if (page.path.includes('ref')) return 'fas fa-bookmark';
    if (page.path.includes('troubleshoot')) return 'fas fa-wrench';
    if (page.path.includes('install')) return 'fas fa-download';
    return 'fas fa-file-alt';
}

function formatTitle(str) {
    return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// ===== PAGE MANAGEMENT =====
function getAllPages() {
    const stored = localStorage.getItem(CONFIG.storageKey);
    if (!stored) return getDefaultPages();
    
    try {
        const data = JSON.parse(stored);
        return data.pages || getDefaultPages();
    } catch (e) {
        return getDefaultPages();
    }
}

function getDefaultPages() {
    return [
        {
            path: 'welcome',
            title: 'Welcome',
            content: `# Welcome to Dibesh Wiki

This is your personal documentation hub for IT monitoring, infrastructure, and technical knowledge.

## Quick Start

- **Browse** - Use the sidebar to navigate through documentation
- **Search** - Use the search box to find specific topics
- **Edit** - Login as admin to create and edit pages

## Categories

### Monitoring
- Zabbix configuration and best practices
- Nagios migration guides
- Alerting and escalation procedures

### Infrastructure
- Server setup and maintenance
- Network monitoring
- Performance optimization

### Troubleshooting
- Common issues and solutions
- Debug techniques
- Emergency procedures

---
*Last updated: ${new Date().toLocaleDateString()}*`,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        },
        {
            path: 'zabbix/installation',
            title: 'Zabbix Installation Guide',
            content: `# Zabbix Installation Guide

Complete guide for installing Zabbix 7.0 on Enterprise Linux.

## Prerequisites

- RHEL 8/9 or CentOS Stream
- MySQL 8.0 or PostgreSQL 13+
- PHP 8.0+
- 4GB RAM minimum

## Installation Steps

### 1. Install Repository

\`\`\`bash
rpm -Uvh https://repo.zabbix.com/zabbix/7.0/rhel/9/x86_64/zabbix-release-7.0-1.el9.noarch.rpm
dnf clean all
\`\`\`

### 2. Install Server and Frontend

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

Access the frontend at \`http://server_ip/zabbix\` and complete the wizard.

## Troubleshooting

Check logs: \`/var/log/zabbix/zabbix_server.log\`

---
*Next: [Configuration](configuration)*`,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        }
    ];
}

function savePages(pages) {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify({ pages }));
    state.pages = new Map(pages.map(p => [p.path, p]));
}

function loadPages() {
    const pages = getAllPages();
    state.pages = new Map(pages.map(p => [p.path, p]));
}

function getPage(path) {
    return state.pages.get(path) || null;
}

function savePage(path, title, content) {
    const pages = getAllPages();
    const existingIndex = pages.findIndex(p => p.path === path);
    
    const pageData = {
        path,
        title,
        content,
        updated: new Date().toISOString(),
        created: existingIndex >= 0 ? pages[existingIndex].created : new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        pages[existingIndex] = pageData;
    } else {
        pages.push(pageData);
    }
    
    savePages(pages);
    renderNavigation();
    
    return pageData;
}

function deletePage(path) {
    if (!confirm(`Are you sure you want to delete "${path}"?`)) return;
    
    const pages = getAllPages().filter(p => p.path !== path);
    savePages(pages);
    
    if (state.currentPage === path) {
        navigateToPage('welcome');
    } else {
        renderNavigation();
    }
    
    showToast('Page deleted', 'success');
}

// ===== NAVIGATION & ROUTING =====
function navigateToPage(path) {
    state.currentPage = path;
    const page = getPage(path);
    
    if (!page) {
        render404();
        return;
    }
    
    // Update URL
    window.location.hash = path;
    
    // Update breadcrumbs
    updateBreadcrumbs(path);
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.path === path);
    });
    
    // Render content
    renderPage(page);
    
    // Exit edit mode if active
    if (state.isEditing) {
        toggleEditMode(false);
    }
}

function updateBreadcrumbs(path) {
    const parts = path.split('/').filter(p => p);
    const container = document.getElementById('breadcrumbs');
    
    let html = `<span class="bc-root" onclick="navigateToPage('welcome')"><i class="fas fa-home"></i></span>`;
    
    let currentPath = '';
    parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isLast = index === parts.length - 1;
        
        html += `<span class="bc-separator">/</span>`;
        if (isLast) {
            html += `<span class="bc-current">${formatTitle(part)}</span>`;
        } else {
            html += `<span class="bc-current" onclick="navigateToPage('${currentPath}')" style="cursor:pointer;color:var(--wiki-primary)">${formatTitle(part)}</span>`;
        }
    });
    
    container.innerHTML = html;
}

function renderPage(page) {
    const container = document.getElementById('wikiContent');
    
    // Parse markdown
    const html = marked.parse(page.content);
    
    container.innerHTML = `
        <div class="wiki-meta">
            <span><i class="fas fa-calendar"></i> Updated ${new Date(page.updated).toLocaleDateString()}</span>
            <span><i class="fas fa-clock"></i> ${Math.ceil(page.content.split(' ').length / 200)} min read</span>
            <span><i class="fas fa-folder"></i> ${page.path.includes('/') ? page.path.split('/')[0] : 'root'}</span>
        </div>
        ${html}
        <div class="wiki-tags">
            <span class="wiki-tag">Documentation</span>
            <span class="wiki-tag">IT</span>
            <span class="wiki-tag">Monitoring</span>
        </div>
    `;
    
    // Highlight code blocks
    container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function render404() {
    const container = document.getElementById('wikiContent');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-file-excel"></i>
            <h3>Page Not Found</h3>
            <p>The page "${state.currentPage}" doesn't exist yet.</p>
            ${state.isAdmin ? `<button class="btn btn-primary" onclick="createNewPageFrom404()"><i class="fas fa-plus"></i> Create This Page</button>` : ''}
        </div>
    `;
}

// ===== EDITOR =====
function initEditor() {
    // EasyMDE will be initialized when entering edit mode
}

function toggleEditMode(enable, page = null) {
    state.isEditing = enable;
    const viewEl = document.getElementById('wikiContent');
    const editEl = document.getElementById('wikiEditor');
    
    if (enable) {
        viewEl.style.display = 'none';
        editEl.style.display = 'flex';
        
        const currentPage = page || getPage(state.currentPage) || {
            path: state.currentPage,
            title: 'New Page',
            content: ''
        };
        
        document.getElementById('pageTitleInput').value = currentPage.title;
        document.getElementById('pagePathInput').value = currentPage.path;
        
        // Initialize EasyMDE
        if (!state.editor) {
            state.editor = new EasyMDE({
                element: document.getElementById('markdownEditor'),
                spellChecker: false,
                autosave: {
                    enabled: true,
                    delay: 1000,
                    uniqueId: 'wiki-draft'
                },
                toolbar: [
                    'bold', 'italic', 'heading', '|',
                    'quote', 'unordered-list', 'ordered-list', '|',
                    'link', 'image', 'code', 'table', '|',
                    'preview', 'side-by-side', 'fullscreen', '|',
                    'guide'
                ],
                status: ['lines', 'words', 'cursor'],
                minHeight: '400px'
            });
        }
        
        state.editor.value(currentPage.content);
        setTimeout(() => state.editor.codemirror.refresh(), 100);
    } else {
        viewEl.style.display = 'block';
        editEl.style.display = 'none';
    }
}

// ===== SEARCH =====
function searchPages(query) {
    if (!query) {
        renderNavigation();
        return;
    }
    
    const pages = getAllPages();
    const results = pages.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.content.toLowerCase().includes(query.toLowerCase()) ||
        p.path.toLowerCase().includes(query.toLowerCase())
    );
    
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = `
        <div class="nav-section">
            <div class="nav-section-title">Search Results (${results.length})</div>
            ${results.map(page => `
                <a href="#${page.path}" class="nav-item" data-path="${page.path}">
                    <i class="fas fa-search"></i>
                    <span>${page.title}</span>
                </a>
            `).join('')}
        </div>
    `;
    
    // Re-attach click handlers
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(item.dataset.path);
        });
    });
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.getElementById('wikiSidebar').classList.add('active');
    });
    
    document.getElementById('sidebarClose')?.addEventListener('click', () => {
        document.getElementById('wikiSidebar').classList.remove('active');
    });
    
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
        document.getElementById('wikiSidebar').classList.remove('active');
    });
    
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Edit/Save/Cancel
    document.getElementById('editPageBtn')?.addEventListener('click', () => {
        if (!state.isAdmin) {
            openModal('adminModal');
            return;
        }
        toggleEditMode(true);
    });
    
    document.getElementById('cancelEdit')?.addEventListener('click', () => {
        toggleEditMode(false);
    });
    
    document.getElementById('savePage')?.addEventListener('click', () => {
        const title = document.getElementById('pageTitleInput').value;
        const path = document.getElementById('pagePathInput').value;
        const content = state.editor.value();
        
        if (!title || !path) {
            showToast('Title and path are required', 'error');
            return;
        }
        
        savePage(path, title, content);
        navigateToPage(path);
        showToast('Page saved successfully', 'success');
    });
    
    // New page
    document.getElementById('newPageBtn')?.addEventListener('click', () => {
        if (!state.isAdmin) {
            openModal('adminModal');
            return;
        }
        openModal('newPageModal');
    });
    
    document.getElementById('createNewPage')?.addEventListener('click', createNewPage);
    document.getElementById('cancelNewPage')?.addEventListener('click', () => closeModal('newPageModal'));
    document.getElementById('closeNewPageModal')?.addEventListener('click', () => closeModal('newPageModal'));
    
    // Delete
    document.getElementById('deletePageBtn')?.addEventListener('click', () => {
        openModal('deleteModal');
        document.getElementById('deletePageName').textContent = state.currentPage;
    });
    
    document.getElementById('confirmDelete')?.addEventListener('click', () => {
        deletePage(state.currentPage);
        closeModal('deleteModal');
    });
    
    document.getElementById('cancelDelete')?.addEventListener('click', () => closeModal('deleteModal'));
    document.getElementById('closeDeleteModal')?.addEventListener('click', () => closeModal('deleteModal'));
    
    // Admin
    document.getElementById('adminBtn')?.addEventListener('click', () => {
        if (state.isAdmin) {
            logoutAdmin();
        } else {
            openModal('adminModal');
        }
    });
    
    document.getElementById('loginAdmin')?.addEventListener('click', () => {
        const password = document.getElementById('adminPassword').value;
        if (!loginAdmin(password)) {
            document.getElementById('adminError').style.display = 'block';
        }
    });
    
    document.getElementById('cancelAdmin')?.addEventListener('click', () => closeModal('adminModal'));
    document.getElementById('closeAdminModal')?.addEventListener('click', () => closeModal('adminModal'));
    
    document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('loginAdmin').click();
        }
    });
    
    // Search
    const searchInput = document.getElementById('wikiSearch');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchPages(e.target.value);
        }, 300);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + E to edit
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (state.isAdmin) {
                toggleEditMode(!state.isEditing);
            }
        }
        
        // Ctrl/Cmd + S to save (in edit mode)
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && state.isEditing) {
            e.preventDefault();
            document.getElementById('savePage').click();
        }
        
        // ESC to close modals or exit edit mode
        if (e.key === 'Escape') {
            if (state.isEditing) {
                toggleEditMode(false);
            } else {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        }
    });
    
    // Folder expand/collapse
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-folder')) {
            const folder = e.target.closest('.nav-folder');
            folder.classList.toggle('expanded');
        }
    });
    
    // Template selection
    document.getElementById('pageTemplate')?.addEventListener('change', (e) => {
        const template = e.target.value;
        const titleInput = document.getElementById('newPageTitle');
        
        const templates = {
            guide: `# ${titleInput.value || 'Guide Title'}

## Overview
Brief description of what this guide covers.

## Prerequisites
- List required software/knowledge
- System requirements

## Step-by-Step Instructions

### Step 1: 
Detailed instructions...

\`\`\`bash
# Example command
command here
\`\`\`

### Step 2:
Next steps...

## Verification
How to verify the installation/setup worked.

## Troubleshooting
Common issues and solutions.

## Next Steps
Links to related documentation.`,
            reference: `# ${titleInput.value || 'Reference'}

## Quick Commands

| Command | Description | Example |
|---------|-------------|---------|
| \`cmd\` | Description | \`example\` |

## Configuration Options

### Option Name
- **Type**: string/boolean/number
- **Default**: default_value
- **Description**: What this does

## Common Patterns

\`\`\`bash
# Pattern 1
example code

# Pattern 2
example code
\`\`\`

## See Also
- [Related Link](#)`,
            troubleshooting: `# ${titleInput.value || 'Troubleshooting'}

## Problem Statement
Clear description of the issue.

## Symptoms
- Symptom 1
- Symptom 2

## Root Causes

### Cause 1: Description
**Solution:**
1. Step 1
2. Step 2

### Cause 2: Description
**Solution:**
Steps to resolve...

## Prevention
How to avoid this issue in the future.

## Emergency Contacts
Who to contact if this doesn't work.`
        };
        
        if (templates[template] && state.editor) {
            state.editor.value(templates[template]);
        }
    });
}

// ===== MODAL HELPERS =====
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ===== NEW PAGE CREATION =====
function createNewPage() {
    const title = document.getElementById('newPageTitle').value;
    const category = document.getElementById('newPageCategory').value;
    
    if (!title) {
        showToast('Please enter a page title', 'error');
        return;
    }
    
    const path = category ? `${category}/${title.toLowerCase().replace(/\s+/g, '-')}` : title.toLowerCase().replace(/\s+/g, '-');
    
    closeModal('newPageModal');
    
    // Clear form
    document.getElementById('newPageTitle').value = '';
    document.getElementById('newPageCategory').value = '';
    
    // Navigate and open editor
    navigateToPage(path);
    toggleEditMode(true, {
        path,
        title,
        content: `# ${title}

Start writing your documentation here...`
    });
}

function createNewPageFrom404() {
    const path = state.currentPage;
    const title = formatTitle(path.split('/').pop());
    toggleEditMode(true, {
        path,
        title,
        content: `# ${title}

Start writing your documentation here...`
    });
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== EXPORT FOR GITHUB =====
function exportToMarkdown() {
    const pages = getAllPages();
    const exportData = {
        version: CONFIG.version,
        exported: new Date().toISOString(),
        pages: pages
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wiki-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Expose to window for console access
window.wiki = {
    export: exportToMarkdown,
    pages: () => getAllPages(),
    save: savePage,
    delete: deletePage,
    navigate: navigateToPage
};
