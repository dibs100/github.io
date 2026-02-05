/**
 * Dibesh Shrestha Wiki - Public Documentation with Admin Editing
 * Location: js/wiki.js
 */

// ===== CONFIGURATION =====
const CONFIG = {
    storageKey: 'wiki_pages',
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
    editor: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Set default password if not exists
    if (!localStorage.getItem(CONFIG.passwordKey)) {
        localStorage.setItem(CONFIG.passwordKey, CONFIG.defaultPassword);
    }
    
    initEventListeners();
    loadPages();
    
    // Route to page from URL
    const path = window.location.hash.slice(1) || CONFIG.defaultPage;
    navigateToPage(path);
});

// ===== AUTHENTICATION (Same as original site) =====
function login(password) {
    const storedPassword = localStorage.getItem(CONFIG.passwordKey);
    
    if (password === storedPassword) {
        state.isAuthenticated = true;
        updateAuthUI();
        closeModal('loginModal');
        showToast('Login successful');
        document.getElementById('passwordInput').value = '';
        document.getElementById('loginError').style.display = 'none';
        return true;
    }
    
    document.getElementById('loginError').style.display = 'flex';
    return false;
}

function logout() {
    state.isAuthenticated = false;
    if (state.isEditing) {
        toggleEditMode(false);
    }
    updateAuthUI();
    showToast('Logged out');
}

function changePassword(current, newPass, confirm) {
    const storedPassword = localStorage.getItem(CONFIG.passwordKey);
    const errorEl = document.getElementById('passwordError');
    const successEl = document.getElementById('passwordSuccess');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    if (current !== storedPassword) {
        errorEl.textContent = 'Current password is incorrect';
        errorEl.style.display = 'block';
        return false;
    }
    
    if (newPass.length < 4) {
        errorEl.textContent = 'Password must be at least 4 characters';
        errorEl.style.display = 'block';
        return false;
    }
    
    if (newPass !== confirm) {
        errorEl.textContent = 'New passwords do not match';
        errorEl.style.display = 'block';
        return false;
    }
    
    localStorage.setItem(CONFIG.passwordKey, newPass);
    successEl.style.display = 'block';
    
    setTimeout(() => {
        closeModal('changePasswordModal');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        successEl.style.display = 'none';
    }, 1500);
    
    return true;
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const newPageBtn = document.getElementById('newPageBtn');
    const editToggleBtn = document.getElementById('editToggleBtn');
    
    if (state.isAuthenticated) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'block';
        newPageBtn.style.display = 'inline-flex';
        editToggleBtn.style.display = 'inline-flex';
        document.body.classList.add('is-authenticated');
    } else {
        loginBtn.style.display = 'inline-flex';
        userMenu.style.display = 'none';
        newPageBtn.style.display = 'none';
        editToggleBtn.style.display = 'none';
        document.body.classList.remove('is-authenticated');
    }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Login modal
    document.getElementById('loginBtn').addEventListener('click', () => {
        openModal('loginModal');
        setTimeout(() => document.getElementById('passwordInput').focus(), 100);
    });
    
    document.getElementById('submitLogin').addEventListener('click', () => {
        login(document.getElementById('passwordInput').value);
    });
    
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login(document.getElementById('passwordInput').value);
    });
    
    document.getElementById('cancelLogin').addEventListener('click', () => closeModal('loginModal'));
    document.getElementById('closeLoginModal').addEventListener('click', () => closeModal('loginModal'));
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // User menu toggle
    document.getElementById('userBtn').addEventListener('click', () => {
        document.getElementById('userMenu').classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#userMenu')) {
            document.getElementById('userMenu').classList.remove('active');
        }
    });
    
    // Change password
    document.getElementById('changePasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('userMenu').classList.remove('active');
        openModal('changePasswordModal');
    });
    
    document.getElementById('savePassword').addEventListener('click', () => {
        changePassword(
            document.getElementById('currentPassword').value,
            document.getElementById('newPassword').value,
            document.getElementById('confirmNewPassword').value
        );
    });
    
    document.getElementById('cancelPassword').addEventListener('click', () => {
        closeModal('changePasswordModal');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
        document.getElementById('passwordError').style.display = 'none';
        document.getElementById('passwordSuccess').style.display = 'none';
    });
    
    document.getElementById('closePasswordModal').addEventListener('click', () => {
        closeModal('changePasswordModal');
    });
    
    // Edit toggle
    document.getElementById('editToggleBtn').addEventListener('click', () => {
        if (!state.isAuthenticated) {
            openModal('loginModal');
            return;
        }
        toggleEditMode();
    });
    
    // New page
    document.getElementById('newPageBtn').addEventListener('click', () => {
        if (!state.isAuthenticated) {
            openModal('loginModal');
            return;
        }
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
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (state.isAuthenticated) {
                toggleEditMode();
            } else {
                openModal('loginModal');
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && state.isEditing) {
            e.preventDefault();
            saveCurrentPage();
        }
        
        if (e.key === 'Escape') {
            closeAllModals();
            if (state.isEditing) toggleEditMode(false);
        }
    });
}

// ===== PAGE MANAGEMENT =====
function loadPages() {
    // Try to load from localStorage first, then fallback to defaults
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

Click "Login" in the top right to create and edit pages. All changes are stored locally in your browser.

---

*This documentation is maintained by Dibesh Shrestha, Enterprise Monitoring Expert.*`,
            tags: ['Welcome', 'Documentation'],
            created: new Date().toISOString(),
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
ncreate user zabbix@localhost identified by 'password';
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
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        },
        {
            path: 'proxmox/installation',
            title: 'Proxmox VE Installation',
            content: `# Proxmox VE Installation Guide

Step-by-step guide for installing Proxmox Virtual Environment.

## Requirements

- 64-bit processor with Intel VT/AMD-V support
- Minimum 4GB RAM (8GB recommended)
- Fast storage (SSD recommended)
- Network interface

## Download

Download ISO from [proxmox.com](https://www.proxmox.com/en/downloads)

## Installation Steps

1. **Create bootable USB** using Rufus or Etcher
2. **Boot from USB** and select "Install Proxmox VE"
3. **Configure network** - Set static IP recommended
4. **Complete installation** - System will reboot automatically

## First Login

Access web interface at \`https://your-server-ip:8006\`

Default credentials:
- Username: root
- Password: (set during installation)

## Post-Install Tasks

### Update System
\`\`\`bash
apt update && apt upgrade -y
\`\`\`

### Configure Storage
Navigate to Datacenter > Storage to add additional storage.

### Create First VM
1. Click "Create VM" in top right
2. Follow the wizard
3. Start VM and install OS

## Useful Commands

\`\`\`bash
# Check node status
pveperf

# List VMs
qm list

# Start VM
qm start <vmid>

# Stop VM
qm stop <vmid>
\`\`\``,
            tags: ['Proxmox', 'Virtualization', 'Installation'],
            created: new Date().toISOString(),
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
        tags: tags.length ? tags : (existing ? existing.tags : ['Documentation']),
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
    
    // Sort folders (General first, then alphabetically)
    const folders = Object.keys(tree).sort((a, b) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
    });
    
    let html = '';
    
    folders.forEach(folder => {
        const isActive = state.currentPage && (
            state.currentPage === folder || 
            state.currentPage.startsWith(folder + '/')
        );
        
        html += `
            <div class="nav-section">
                <div class="nav-title">${formatTitle(folder)}</div>
                <ul class="nav-list">
                    ${tree[folder].map(page => `
                        <li class="nav-item ${page.path === state.currentPage ? 'active' : ''}" 
                            data-path="${page.path}" 
                            onclick="window.navigateToPage('${page.path}')">
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
        render404(path);
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

function render404(path) {
    document.getElementById('pageTitle').textContent = 'Page Not Found';
    document.getElementById('contentBody').innerHTML = `
        <p>The page "${path}" does not exist.</p>
        ${state.isAuthenticated ? `
            <button class="btn btn-primary" onclick="window.createPageFromCurrent()">
                <i class="fas fa-plus"></i> Create this page
            </button>
        ` : `
            <p><button class="btn btn-primary" onclick="openModal('loginModal')">
                <i class="fas fa-lock"></i> Login
            </button> to create this page.</p>
        `}
    `;
    document.getElementById('pageTags').innerHTML = '';
    document.getElementById('pageDate').textContent = '';
    document.getElementById('pageReadTime').textContent = '';
}

// ===== EDITING =====
function toggleEditMode(enable = !state.isEditing) {
    if (!state.isAuthenticated && enable) {
        openModal('loginModal');
        return;
    }
    
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
    
    const page = savePage(path, title, content);
    navigateToPage(path);
    showToast('Page saved successfully');
}

function deleteCurrentPage() {
    if (!state.isAuthenticated) {
        openModal('loginModal');
        return;
    }
    deletePage(state.currentPage);
    toggleEditMode(false);
}

function createNewPage() {
    const title = document.getElementById('newPageTitle').value;
    const path = document.getElementById('newPagePath').value || title.toLowerCase().replace(/\s+/g, '-');
    
    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }
    
    const fullPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Check if page exists
    if (state.pages.has(fullPath)) {
        if (!confirm('Page already exists. Open for editing?')) return;
        closeModal('newPageModal');
        navigateToPage(fullPath);
        toggleEditMode(true);
        return;
    }
    
    savePage(fullPath, title, `# ${title}\n\nStart writing your documentation here...`, ['New']);
    closeModal('newPageModal');
    navigateToPage(fullPath);
    toggleEditMode(true);
    
    document.getElementById('newPageTitle').value = '';
    document.getElementById('newPagePath').value = '';
}

function createPageFromCurrent() {
    const path = state.currentPage;
    const title = path.split('/').pop().replace(/-/g, ' ');
    savePage(path, title, `# ${title}\n\n`, ['New']);
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
                    <li class="nav-item ${page.path === state.currentPage ? 'active' : ''}" 
                        data-path="${page.path}" 
                        onclick="window.navigateToPage('${page.path}')">
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
    const icon = toast.querySelector('i');
    
    msgEl.textContent = message;
    icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    toast.style.borderLeftColor = type === 'error' ? '#ea4335' : '#34a853';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose for onclick handlers
window.navigateToPage = navigateToPage;
window.createPageFromCurrent = createPageFromCurrent;
window.openModal = openModal;
