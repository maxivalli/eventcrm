import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // Animate hamburger icon
    const spans = mobileMenuBtn.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Close mobile menu when clicking a link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const spans = mobileMenuBtn.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });

  // Elementos principales
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Inyectamos el scroll en el root de la app para animar puros con CSS Variable
    document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
    
    // Navbar effect
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Intersection Observer for Reveal Animations (Apariciones suaves automáticas)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Opcional: si solo queremos animar una vez, dejamos de observar:
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));

  // Simular envío de formulario
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      const originalText = btn.innerHTML;
      
      btn.innerHTML = '<span>Enviando...</span>';
      
      setTimeout(() => {
        btn.innerHTML = '<span>¡Mensaje Enviado!</span>';
        btn.style.background = '#10b981'; // Success green
        form.reset();
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 3000);
      }, 1500);
    });
  }
});
