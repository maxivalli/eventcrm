import './style.css';
import logoSrc from './src/assets/HAUS - LOGO VERSIONS (2).png';

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

async function cargarProximosEventos() {
  const lista = document.getElementById('proximosEventosList')
  if (!lista) return
  try {
    const res = await fetch(`${API_URL}/api/public/eventos`)
    if (!res.ok) throw new Error()
    const eventos = await res.json()

    if (!eventos.length) {
      lista.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No hay eventos próximos publicados.</p>'
      return
    }

    lista.innerHTML = eventos.map((ev, i) => {
      const fecha = new Date(ev.date)
      const dia = fecha.getDate().toString().padStart(2, '0')
      const mes = MESES[fecha.getMonth()]
      const hora = ev.time ? ` · ${ev.time}` : ''
      const delay = i > 0 ? ` delay-${Math.min(i, 3)}` : ''
      return `
        <div class="pe-item reveal${delay}">
          <div class="pe-fecha">
            <span class="pe-dia">${dia}</span>
            <span class="pe-mes">${mes}</span>
          </div>
          <div class="pe-info">
            <h4>${ev.name}</h4>
            <p>${ev.type}${hora} · ${ev.venue} · ${ev.guests} invitados</p>
          </div>
          <span class="pe-badge">Confirmado</span>
        </div>`
    }).join('')

    lista.querySelectorAll('.reveal').forEach(el => {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); obs.unobserve(e.target) } })
      }, { threshold: 0.1 })
      obs.observe(el)
    })
  } catch {
    lista.innerHTML = ''
  }
}

cargarProximosEventos()

// ── Intro screen ─────────────────────────────────────
// El div #intro-screen ya está en el HTML desde el primer render.
// Aquí solo inyectamos el contenido y manejamos el timing.
const introScreen   = document.getElementById('intro-screen');
const introContent  = introScreen.querySelector('.intro-content');

introContent.innerHTML = `
  <img src="${logoSrc}" alt="Grupo Haus" class="intro-logo">
  <div class="intro-divider"></div>
  <p class="intro-tagline">Excelencia en Eventos</p>
`;

setTimeout(() => {
  introScreen.classList.add('exit');
  setTimeout(() => {
    introScreen.remove();
    document.body.classList.remove('intro-active');

    const heroContent = document.getElementById('heroContent');
    const heroVisuals = document.getElementById('heroVisuals');

    setTimeout(() => {
      if (heroContent) {
        heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        heroContent.style.opacity = '1';
      }
      if (heroVisuals) {
        heroVisuals.style.transition = 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s';
        heroVisuals.style.opacity = '1';
      }
    }, 3800);

  }, 800);
}, 2800);

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
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

  // Close mobile menu on resize above breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      navLinks.classList.remove('active');
      const spans = mobileMenuBtn.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Scroll handler con requestAnimationFrame para no bloquear el hilo principal
  let rafPending = false
  window.addEventListener('scroll', () => {
    if (rafPending) return
    rafPending = true
    requestAnimationFrame(() => {
      const scrollY = window.scrollY
      document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`)
      navbar.classList.toggle('scrolled', scrollY > 50)
      rafPending = false
    })
  }, { passive: true });

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
