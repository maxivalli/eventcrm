// Navbar scroll
const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60)
})

// Próximos eventos desde el CRM
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

async function cargarEventos() {
  const lista = document.getElementById('eventosList')
  if (!lista) return

  try {
    const res = await fetch(`${API_URL}/api/public/eventos`)
    if (!res.ok) throw new Error('Error al cargar eventos')
    const eventos = await res.json()

    if (!eventos.length) {
      lista.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No hay eventos próximos publicados.</p>'
      return
    }

    lista.innerHTML = eventos.map((ev, i) => {
      const fecha = new Date(ev.date)
      const dia  = fecha.getDate().toString().padStart(2, '0')
      const mes  = MESES[fecha.getMonth()]
      const hora = ev.time ? ` · ${ev.time}` : ''
      const delay = i > 0 ? ` delay-${i}` : ''

      return `
        <div class="fr-evento-item reveal${delay}">
          <div class="fr-evento-fecha">
            <span class="fr-evento-dia">${dia}</span>
            <span class="fr-evento-mes">${mes}</span>
          </div>
          <div class="fr-evento-info">
            <h4>${ev.name}</h4>
            <p>${ev.type}${hora} · ${ev.venue} · ${ev.guests} invitados</p>
          </div>
          <span class="fr-evento-badge">Confirmado</span>
        </div>`
    }).join('')

    // Re-observar los nuevos elementos para la animación reveal
    lista.querySelectorAll('.reveal').forEach(el => observer.observe(el))

  } catch {
    lista.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No se pudieron cargar los eventos.</p>'
  }
}

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('active')
      observer.unobserve(e.target)
    }
  })
}, { threshold: 0.12 })

document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

// Mobile menu
const btn = document.querySelector('.mobile-menu-btn')
const links = document.querySelector('.nav-links')
btn?.addEventListener('click', () => {
  links.classList.toggle('active')
  const spans = btn.querySelectorAll('span')
  spans[0].style.transform = links.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : ''
  spans[1].style.opacity  = links.classList.contains('active') ? '0' : '1'
  spans[2].style.transform = links.classList.contains('active') ? 'rotate(-45deg) translate(6px, -6px)' : ''
})

// Cerrar menú al hacer click en link
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    links.classList.remove('active')
  })
})

cargarEventos()
