// Language switching functionality
const langEnBtn = document.getElementById('langEn');
const langDeBtn = document.getElementById('langDe');
const langEnMobileBtn = document.getElementById('langEnMobile');
const langDeMobileBtn = document.getElementById('langDeMobile');
const htmlElement = document.getElementById('htmlLang');

function switchLanguage(lang) {
    // Update active buttons
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (lang === 'en') {
        if (langEnBtn) langEnBtn.classList.add('active');
        if (langEnMobileBtn) langEnMobileBtn.classList.add('active');
        htmlElement.setAttribute('lang', 'en');
    } else {
        if (langDeBtn) langDeBtn.classList.add('active');
        if (langDeMobileBtn) langDeMobileBtn.classList.add('active');
        htmlElement.setAttribute('lang', 'de');
    }
    
    // Show/hide language-specific content
    document.querySelectorAll('.lang-en').forEach(el => {
        el.style.display = lang === 'en' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.lang-de').forEach(el => {
        el.style.display = lang === 'de' ? 'block' : 'none';
    });
    
    // Update navigation links
    document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
        const text = link.getAttribute(`data-${lang}`);
        if (text) {
            link.textContent = text;
        }
    });
    
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
}

// Event listeners for language buttons
if (langEnBtn) langEnBtn.addEventListener('click', () => switchLanguage('en'));
if (langDeBtn) langDeBtn.addEventListener('click', () => switchLanguage('de'));
if (langEnMobileBtn) langEnMobileBtn.addEventListener('click', () => switchLanguage('en'));
if (langDeMobileBtn) langDeMobileBtn.addEventListener('click', () => switchLanguage('de'));

// Check for saved language preference
const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
switchLanguage(savedLanguage);

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        mobileMenuBtn.innerHTML = mobileNav.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
}

// Close mobile menu when clicking a link
const mobileLinks = document.querySelectorAll('.mobile-nav a');
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        if (mobileMenuBtn) mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        
        // Update active link
        document.querySelectorAll('nav a, .mobile-nav a').forEach(a => {
            a.classList.remove('active');
        });
        link.classList.add('active');
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 120,
                behavior: 'smooth'
            });
            
            // Update active link
            if(this.getAttribute('href') !== '#contact') {
                document.querySelectorAll('nav a, .mobile-nav a').forEach(a => {
                    a.classList.remove('active');
                });
                this.classList.add('active');
            }
        }
    });
});

// Update active link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a, .mobile-nav a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if(scrollY >= (sectionTop - 160)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});
