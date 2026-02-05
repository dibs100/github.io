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
