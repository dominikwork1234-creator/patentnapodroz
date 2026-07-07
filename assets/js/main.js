// Patent na Podróż - Main JavaScript

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Language switcher
const langCurrent = document.querySelector('.lang-current');
const langMenu = document.querySelector('.lang-menu');

if (langCurrent && langMenu) {
    langCurrent.addEventListener('click', (e) => {
        e.stopPropagation();
        langMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        langMenu.classList.remove('active');
    });
}

// Contact form submission via Web3Forms
const contactForm = document.getElementById('contact-form');
const formMessage = document.getElementById('form-message');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Check if Web3Forms key is set
        if (!data.access_key || data.access_key === 'YOUR_WEB3FORMS_KEY_HERE') {
            formMessage.textContent = 'Form is in configuration mode. Contact support.';
            formMessage.className = 'form-message error';
            return;
        }
        
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                formMessage.textContent = contactForm.dataset.successMessage || 'Thank you! We will contact you soon.';
                formMessage.className = 'form-message success';
                contactForm.reset();
            } else {
                formMessage.textContent = contactForm.dataset.errorMessage || 'Error sending message. Please try again or call us.';
                formMessage.className = 'form-message error';
            }
        } catch (error) {
            formMessage.textContent = contactForm.dataset.errorMessage || 'Error sending message. Please try again or call us.';
            formMessage.className = 'form-message error';
        }
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});
