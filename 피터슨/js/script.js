// Sticky Navigation & Interaction
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Sticky Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('bg-glass');
            header.style.padding = '10px 0';
            header.style.height = '70px';
        } else {
            header.classList.remove('bg-glass');
            header.style.padding = '0';
            header.style.height = '80px';
        }
    });

    // Smooth Scroll for Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                window.scrollTo({
                    top: targetSection.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Animation triggers
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Trigger once
            }
        });
    }, observerOptions);

    // Track sections to reveal
    document.querySelectorAll('.card, .hero-content, .stats-item').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
});
