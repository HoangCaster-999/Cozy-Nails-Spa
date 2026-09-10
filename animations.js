/* ==========================================================================
   animations.js — hangt de animatielaag aan de bestaande markup.
   Verandert niets aan script.js. Verwijder de <script> om alles uit te zetten.
   ========================================================================== */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. tekst opsplitsen in losse letters ---------- */
  // Woorden blijven bestaan zodat regelafbreking normaal werkt; elke letter
  // krijgt een eigen box die vanuit de overflow omhoog schuift.
  const splitLetters = root => {
    if (root.dataset.split === 'done') return;
    let index = 0;

    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          if (!child.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(part);
            const word = document.createElement('span');
            word.className = 'word';
            for (const ch of part) {
              const letter = document.createElement('span');
              letter.className = 'char';
              letter.textContent = ch;
              letter.style.setProperty('--c', index++);
              word.append(letter);
            }
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };

    walk(root);
    root.dataset.split = 'done';
    root.classList.add('split');
  };

  const headings = [
    ...document.querySelectorAll('.hero-words span'),
    ...document.querySelectorAll('.about-copy h2, .center-heading h2, .booking-inner h2, .faq-heading h2, .contact-heading h2'),
  ];
  headings.forEach(splitLetters);

  /* ---------- 2. zichtbaar maken bij binnenkomst ---------- */
  const io = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      self.unobserve(entry.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.split').forEach(el => io.observe(el));

  // De hero staat al in beeld bij het laden — direct starten, net na de
  // bestaande hero-in animatie van de afbeelding.
  const heroWords = document.querySelectorAll('.hero-words span.split');
  if (heroWords.length) {
    heroWords.forEach((el, i) => {
      io.unobserve(el);
      setTimeout(() => el.classList.add('visible'), 260 + i * 90);
    });
  }

  /* ---------- 3. beeld dat oprijst binnen de vorm ---------- */
  document.querySelectorAll('.arch-wrap').forEach(el => el.classList.add('rise-img'));

  /* ---------- 4. stagger voor kaarten en tegels ---------- */
  const stagger = (selector, scope) => {
    document.querySelectorAll(scope).forEach(group => {
      [...group.querySelectorAll(selector)].forEach((el, i) => {
        el.classList.add('stagger');
        el.style.setProperty('--i', i);
      });
    });
  };
  stagger('.service-card', '.service-arches');
  stagger('.gallery-tile', '.gallery-grid');
  stagger('.contact-grid a', '.contact');

  /* ---------- 5. index voor de prijsrijen (animeren bij tabwissel) ---------- */
  document.querySelectorAll('.price-grid').forEach(grid => {
    [...grid.children].forEach((row, i) => row.style.setProperty('--r', i));
  });

  /* ---------- 6. scroll-voortgang + parallax ---------- */
  const bar = document.createElement('div');
  bar.className = 'anim-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i></i>';
  document.body.prepend(bar);
  const barFill = bar.querySelector('i');

  // `translate` en niet `transform`: deze elementen hebben al een transform
  // (translateX(-50%) / translateY(-50%)) die we niet mogen overschrijven.
  const parallax = [
    { el: document.querySelector('.hero-image'), depth: 0.06 },
    { el: document.querySelector('.booking-art'), depth: 0.05 },
    { el: document.querySelector('.hero-halo'), depth: -0.04 },
  ].filter(p => p.el);

  let ticking = false;
  const onScroll = () => {
    const vh = innerHeight;
    const scrollable = document.documentElement.scrollHeight - vh;
    barFill.style.setProperty('--p', scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0);

    if (!reduced.matches) {
      for (const { el, depth } of parallax) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const offset = (r.top + r.height / 2 - vh / 2) * -depth;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      }
    }
    ticking = false;
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  };
  onScroll();
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
})();
