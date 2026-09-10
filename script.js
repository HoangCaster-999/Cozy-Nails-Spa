const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('.site-nav');
const main = document.querySelector('#main');
const progress = document.querySelector('[data-progress]');
const fab = document.querySelector('.fab');

const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 900px)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');

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

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuButton.focus(); }
});
mobile.addEventListener('change', event => { if (!event.matches) setMenu(false); });

/* ---------- split headings into words for the stagger reveal ---------- */
const splitWords = root => {
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(part);
          const outer = document.createElement('span');
          outer.className = 'word';
          const inner = document.createElement('span');
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(root);
  root.querySelectorAll('.word > span').forEach((span, i) => span.style.setProperty('--w', i));
};
document.querySelectorAll('[data-split]').forEach(splitWords);

/* ---------- open / closed right now ---------- */
// [openMinutes, closeMinutes] per weekday, index 0 = Sunday. null = closed.
const HOURS = [null, [600, 1080], [600, 1080], [600, 1080], [600, 1080], [600, 1200], [540, 1020]];
const statusChip = document.querySelector('[data-status]');

const paintStatus = () => {
  const now = new Date();
  const today = HOURS[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  const open = !!today && mins >= today[0] && mins < today[1];
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  if (statusChip) {
    statusChip.hidden = false;
    statusChip.classList.toggle('is-closed', !open);
    statusChip.innerHTML = '<span class="dot"></span>' +
      (open ? `Nu open · tot ${fmt(today[1])}` : 'Nu gesloten');
  }
  document.querySelectorAll('.hours [data-day]').forEach(row => {
    const days = row.dataset.day.split(',').map(Number);
    row.classList.toggle('today', days.includes(now.getDay()));
  });
};
paintStatus();
setInterval(paintStatus, 60000);

/* ---------- scroll: header, progress, parallax, spy, timeline, marquee ---------- */
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
const sections = navLinks
  .map(link => {
    const target = document.querySelector(link.getAttribute('href'));
    return target ? { link, target } : null;
  })
  .filter(Boolean);

const railLinks = [...document.querySelectorAll('[data-rail] a')]
  .map(link => {
    const target = document.querySelector(link.getAttribute('href'));
    return target ? { link, target } : null;
  })
  .filter(Boolean);

const timeline = document.querySelector('[data-timeline]');
const timelineRail = document.querySelector('[data-timeline-fill]');
const marqueeTrack = document.querySelector('[data-marquee] .marquee-track');

let ticking = false;
let lastY = scrollY;
let marqueeX = 0;
let marqueeBoost = 0;

const markCurrent = (list, active) => {
  for (const item of list) {
    if (item === active) item.link.setAttribute('aria-current', 'true');
    else item.link.removeAttribute('aria-current');
  }
};

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
      // `translate`, not `transform`: these elements already animate transform.
      element.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  }

  let active = null;
  for (const section of sections) {
    if (section.target.getBoundingClientRect().top <= vh * 0.35) active = section;
  }
  markCurrent(sections, active);

  let railActive = null;
  for (const item of railLinks) {
    if (item.target.getBoundingClientRect().top <= vh * 0.45) railActive = item;
  }
  markCurrent(railLinks, railActive);

  if (timeline && timelineRail) {
    const rect = timeline.getBoundingClientRect();
    const span = rect.height + vh * 0.35;
    const fill = (vh * 0.8 - rect.top) / span;
    timelineRail.style.setProperty('--fill', Math.min(Math.max(fill, 0), 1).toFixed(3));
  }

  marqueeBoost = Math.min(Math.abs(y - lastY) * 0.35, 22);
  lastY = y;
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

/* ---------- marquee: constant drift that speeds up with scroll ---------- */
if (marqueeTrack && !reduced.matches) {
  const step = () => {
    marqueeX -= 0.45 + marqueeBoost;
    marqueeBoost *= 0.9;
    const half = marqueeTrack.scrollWidth / 2;
    if (half > 0 && -marqueeX >= half) marqueeX += half;
    marqueeTrack.style.transform = `translateX(${marqueeX.toFixed(2)}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- magnetic buttons ---------- */
if (fine.matches && !reduced.matches) {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('pointermove', event => {
      const r = el.getBoundingClientRect();
      const dx = (event.clientX - (r.left + r.width / 2)) * 0.25;
      const dy = (event.clientY - (r.top + r.height / 2)) * 0.35;
      el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', event => {
      const r = el.getBoundingClientRect();
      const rx = ((event.clientY - r.top) / r.height - 0.5) * -4;
      const ry = ((event.clientX - r.left) / r.width - 0.5) * 4;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- price accordion ---------- */
const animations = new WeakMap();

const setGroup = (details, open) => {
  const panel = details.querySelector('.price-panel');
  if (!panel) return;
  animations.get(panel)?.cancel();

  if (reduced.matches) { details.open = open; return; }

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

// The rail jumps to a category and opens it on the way.
railLinks.forEach(({ link, target }) => {
  link.addEventListener('click', () => { if (!target.open) setGroup(target, true); });
});

/* ---------- reveal on enter ---------- */
const observer = new IntersectionObserver((entries, self) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    self.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal, [data-split], .timeline li').forEach(el => observer.observe(el));
document.querySelector('[data-year]').textContent = new Date().getFullYear();
