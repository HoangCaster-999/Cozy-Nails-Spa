const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
const main = document.querySelector('#main');
const progress = document.querySelector('[data-progress]');
const fab = document.querySelector('.fab');

const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 900px)');

/* ---------- mobile menu ---------- */
const navLinks = [...nav.querySelectorAll('.nav-links a')];
navLinks.forEach((link, i) => link.style.setProperty('--i', i));

const setMenu = open => {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.classList.toggle('open', open);
  nav.classList.toggle('open', open);
  // Drops the header's backdrop-filter while open; with it on, the header
  // becomes the containing block for the fixed nav overlay and clips it.
  header.classList.toggle('nav-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (main) main.inert = open;
};

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});

addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menuButton.focus();
  }
});

// Leaving the mobile breakpoint with the overlay open would otherwise leave the
// body scroll-locked and #main inert.
mobile.addEventListener('change', event => {
  if (!event.matches) setMenu(false);
});

/* ---------- scroll-driven header, progress, parallax, spy ---------- */
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
const sections = navLinks
  .map(link => {
    const target = document.querySelector(link.getAttribute('href'));
    return target ? { link, target } : null;
  })
  .filter(Boolean);

let ticking = false;

const onScroll = () => {
  const y = scrollY;
  const vh = innerHeight;

  header.classList.toggle('scrolled', y > 32);

  const scrollable = document.documentElement.scrollHeight - vh;
  progress.style.setProperty('--p', scrollable > 0 ? Math.min(y / scrollable, 1) : 0);

  if (fab) fab.classList.toggle('show', y > vh * 0.7);

  if (!reduced.matches) {
    for (const element of parallaxItems) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      const offset = (rect.top + rect.height / 2 - vh / 2) * -Number(element.dataset.parallax);
      // `translate` rather than `transform`, so it composes with the CSS
      // animations that already own the transform property on these elements.
      element.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  }

  let active = null;
  for (const section of sections) {
    if (section.target.getBoundingClientRect().top <= vh * 0.35) active = section;
  }
  for (const section of sections) {
    if (section === active) section.link.setAttribute('aria-current', 'true');
    else section.link.removeAttribute('aria-current');
  }

  ticking = false;
};

const requestScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(onScroll);
};

onScroll();
addEventListener('scroll', requestScroll, { passive: true });
addEventListener('resize', requestScroll);

/* ---------- price accordion ---------- */
const animations = new WeakMap();

const setGroup = (details, open) => {
  const panel = details.querySelector('.price-panel');
  if (!panel) return;

  animations.get(panel)?.cancel();

  if (reduced.matches) {
    details.open = open;
    return;
  }

  const from = panel.getBoundingClientRect().height;
  if (open) details.open = true;
  panel.style.height = 'auto';
  const to = open ? panel.getBoundingClientRect().height : 0;
  panel.style.height = `${from}px`;

  const animation = panel.animate({ height: [`${from}px`, `${to}px`] }, { duration: 400, easing: EASE });
  animations.set(panel, animation);

  animation.finished
    .then(() => {
      panel.style.height = '';
      if (!open) details.open = false;
      animations.delete(panel);
    })
    .catch(() => {});
};

document.querySelectorAll('[data-accordion] > details').forEach(details => {
  details.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const opening = !details.open;
    if (opening) {
      details.parentElement.querySelectorAll('details[open]').forEach(other => {
        if (other !== details) setGroup(other, false);
      });
    }
    setGroup(details, opening);
  });
});

/* ---------- reveal on enter ---------- */
const observer = new IntersectionObserver((entries, self) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    self.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
document.querySelector('[data-year]').textContent = new Date().getFullYear();
