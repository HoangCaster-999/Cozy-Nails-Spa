// Paste the final Setmore booking URL here when it is available.
const SETMORE_BOOKING_URL = '';

const header = document.querySelector('[data-header]');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const toast = document.querySelector('.booking-toast');

const syncHeader = () => header.classList.toggle('scrolled', scrollY > 24);
syncHeader();
addEventListener('scroll', syncHeader, { passive: true });

menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('open', open);
  nav.classList.toggle('open', open);
});

nav.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  menu.setAttribute('aria-expanded', 'false');
  menu.classList.remove('open');
  nav.classList.remove('open');
});

document.querySelectorAll('.booking-link').forEach(link => {
  if (SETMORE_BOOKING_URL) {
    link.href = SETMORE_BOOKING_URL;
    link.target = '_blank';
    link.rel = 'noreferrer';
    return;
  }
  link.addEventListener('click', event => {
    event.preventDefault();
    toast.classList.add('show');
    clearTimeout(window.bookingToastTimer);
    window.bookingToastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  });
});

document.querySelector('.price-tabs').addEventListener('click', event => {
  const button = event.target.closest('[data-price-tab]');
  if (!button) return;
  document.querySelectorAll('[data-price-tab]').forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-price-panel]').forEach(panel => {
    const active = panel.dataset.pricePanel === button.dataset.priceTab;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: .12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
document.querySelector('[data-year]').textContent = new Date().getFullYear();
