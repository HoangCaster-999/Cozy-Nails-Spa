/* ============================================================
   SETMORE — plak hier je boekingslink zodra je die hebt.
   Bijvoorbeeld: 'https://cozynailsspa.setmore.com'
   Laat leeg om terug te vallen op WhatsApp met de selectie erin.

   Zet EMBED_SETMORE op true om Setmore ook als iframe op de pagina
   te tonen in plaats van alleen als knop.
   ============================================================ */
const SETMORE_URL = '';
const EMBED_SETMORE = false;

const WHATSAPP = 'https://wa.me/31629193391';

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
  // backdrop-filter would make the header the containing block for the
  // fixed overlay and clip it to the header box, so drop it while open.
  header.classList.toggle('nav-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (main) main.inert = open;
};

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuButton.focus(); }
});
mobile.addEventListener('change', e => { if (!e.matches) setMenu(false); });

/* ---------- split headings for the word reveal ---------- */
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
  root.querySelectorAll('.word > span').forEach((s, i) => s.style.setProperty('--w', i));
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
    statusChip.innerHTML = '<span class="dot"></span>' + (open ? `Nu open · tot ${fmt(today[1])}` : 'Nu gesloten');
  }
  document.querySelectorAll('.hours [data-day]').forEach(row => {
    row.classList.toggle('today', row.dataset.day.split(',').map(Number).includes(now.getDay()));
  });
};
paintStatus();
setInterval(paintStatus, 60000);

/* ---------- booking picker ---------- */
const picker = document.querySelector('[data-picker]');
const summaryList = document.querySelector('[data-summary-list]');
const totalEl = document.querySelector('[data-total]');
const noteEl = document.querySelector('[data-note]');
const bookBtn = document.querySelector('[data-book]');
const clearBtn = document.querySelector('[data-clear]');
const embedBox = document.querySelector('[data-setmore-embed]');

const euro = n => '€' + String(n).replace('.', ',');

const buildMessage = (picked, total, hasOpen) => {
  const lines = picked.map(p => `• ${p.name}${p.price ? ` (${euro(p.price)})` : ' (in overleg)'}`);
  let msg = `Hoi Cozy Nails & Spa! Ik wil graag een afspraak maken voor:\n${lines.join('\n')}`;
  if (total) msg += `\n\nIndicatie totaal: ${euro(total)}`;
  if (hasOpen) msg += '\n(enkele onderdelen in overleg)';
  return msg;
};

const refresh = () => {
  if (!picker) return;
  const picked = [...picker.querySelectorAll('input:checked')].map(i => ({
    name: i.dataset.name,
    price: i.dataset.price ? Number(i.dataset.price) : 0,
  }));
  const total = picked.reduce((sum, p) => sum + p.price, 0);
  const hasOpen = picked.some(p => !p.price);

  summaryList.innerHTML = picked.length
    ? picked.map(p => `<li><span>${p.name}</span><span>${p.price ? euro(p.price) : 'in overleg'}</span></li>`).join('')
    : '<li class="summary-empty">Nog niets gekozen — vink aan wat je wilt laten doen.</li>';

  totalEl.textContent = euro(total);
  noteEl.hidden = !hasOpen;
  if (hasOpen) noteEl.textContent = 'Voor de onderdelen “in overleg” bepalen we de prijs samen tijdens je afspraak.';

  // With a Setmore link the button goes there; without one it falls back to
  // WhatsApp with the whole selection already written out.
  bookBtn.href = SETMORE_URL || `${WHATSAPP}?text=${encodeURIComponent(buildMessage(picked, total, hasOpen))}`;
};

if (picker) {
  picker.addEventListener('change', refresh);
  clearBtn?.addEventListener('click', () => {
    picker.querySelectorAll('input:checked').forEach(i => { i.checked = false; });
    refresh();
  });
  refresh();
}

// optional inline Setmore iframe
if (SETMORE_URL && EMBED_SETMORE && embedBox) {
  embedBox.hidden = false;
  embedBox.querySelector('iframe').src = SETMORE_URL;
}

/* ---------- scroll: header, progress, parallax, spy, marquee ---------- */
const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
const asPair = link => {
  const target = document.querySelector(link.getAttribute('href'));
  return target ? { link, target } : null;
};
const sections = navLinks.map(asPair).filter(Boolean);
const railLinks = [...document.querySelectorAll('[data-rail] a')].map(asPair).filter(Boolean);
const marqueeTrack = document.querySelector('[data-marquee] .marquee-track');

let ticking = false, lastY = scrollY, marqueeX = 0, marqueeBoost = 0;

const markCurrent = (list, active) => {
  for (const item of list) {
    if (item === active) item.link.setAttribute('aria-current', 'true');
    else item.link.removeAttribute('aria-current');
  }
};

const onScroll = () => {
  const y = scrollY, vh = innerHeight;
  header.classList.toggle('scrolled', y > 32);

  const scrollable = document.documentElement.scrollHeight - vh;
  progress.style.setProperty('--p', scrollable > 0 ? Math.min(y / scrollable, 1) : 0);
  if (fab) fab.classList.toggle('show', y > vh * 0.7);

  if (!reduced.matches) {
    for (const el of parallaxItems) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const offset = (r.top + r.height / 2 - vh / 2) * -Number(el.dataset.parallax);
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  }

  let active = null;
  for (const s of sections) if (s.target.getBoundingClientRect().top <= vh * 0.35) active = s;
  markCurrent(sections, active);

  let railActive = null;
  for (const s of railLinks) if (s.target.getBoundingClientRect().top <= vh * 0.45) railActive = s;
  markCurrent(railLinks, railActive);

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

/* ---------- card tilt ---------- */
if (fine.matches && !reduced.matches) {
  document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
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

  const anim = panel.animate({ height: [`${from}px`, `${to}px`] }, { duration: 400, easing: EASE });
  animations.set(panel, anim);
  anim.finished.then(() => {
    panel.style.height = '';
    if (!open) details.open = false;
    animations.delete(panel);
  }).catch(() => {});
};

document.querySelectorAll('[data-accordion] > details').forEach(details => {
  details.querySelector('summary').addEventListener('click', e => {
    e.preventDefault();
    const opening = !details.open;
    if (opening) {
      details.parentElement.querySelectorAll('details[open]').forEach(other => {
        if (other !== details) setGroup(other, false);
      });
    }
    setGroup(details, opening);
  });
});
railLinks.forEach(({ link, target }) => {
  link.addEventListener('click', () => { if (!target.open) setGroup(target, true); });
});

/* ---------- reveal ---------- */
const observer = new IntersectionObserver((entries, self) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    self.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal, [data-split]').forEach(el => observer.observe(el));
document.querySelector('[data-year]').textContent = new Date().getFullYear();
