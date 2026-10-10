const SETMORE_BOOKING_URL = 'https://cozynailsspa.setmore.com';

const header = document.querySelector('[data-header]');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const toast = document.querySelector('.booking-toast');
const welcomePopup = document.querySelector('[data-welcome-popup]');

if (welcomePopup) {
  const previousFocus = document.activeElement;
  const closeButton = welcomePopup.querySelector('.welcome-popup__close');
  const closePopup = () => {
    clearTimeout(window.welcomePopupTimer);
    welcomePopup.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      welcomePopup.hidden = true;
      previousFocus?.focus?.();
    }, 350);
  };

  requestAnimationFrame(() => {
    welcomePopup.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
    window.welcomePopupTimer = setTimeout(closePopup, 5000);
  });

  welcomePopup.querySelectorAll('[data-popup-close]').forEach(button => button.addEventListener('click', closePopup));
  addEventListener('keydown', event => event.key === 'Escape' && closePopup(), { once: true });
}

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

document.querySelector('.service-arches').addEventListener('click', event => {
  const link = event.target.closest('[data-service-price]');
  if (link) document.querySelector(`[data-price-tab="${link.dataset.servicePrice}"]`).click();
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
