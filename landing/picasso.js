const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60)
})

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('active')
      observer.unobserve(e.target)
    }
  })
}, { threshold: 0.12 })

document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

const btn = document.querySelector('.mobile-menu-btn')
const links = document.querySelector('.nav-links')
btn?.addEventListener('click', () => {
  links.classList.toggle('active')
  const spans = btn.querySelectorAll('span')
  spans[0].style.transform = links.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : ''
  spans[1].style.opacity  = links.classList.contains('active') ? '0' : '1'
  spans[2].style.transform = links.classList.contains('active') ? 'rotate(-45deg) translate(6px, -6px)' : ''
})

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => links.classList.remove('active'))
})

const form = document.getElementById('picassoForm')
form?.addEventListener('submit', e => {
  e.preventDefault()
  const btn = form.querySelector('button')
  const orig = btn.innerHTML
  btn.innerHTML = '<span>Enviando...</span>'
  setTimeout(() => {
    btn.innerHTML = '<span>¡Consulta enviada!</span>'
    btn.style.background = '#10b981'
    form.reset()
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = '' }, 3000)
  }, 1500)
})
