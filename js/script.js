(() => {
  const header = document.getElementById('header');
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');
  const navLinks = document.querySelectorAll('[data-nav]');

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- header: transparent -> solid on scroll ---------------- */
  const onHeaderScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onHeaderScroll();
  window.addEventListener('scroll', onHeaderScroll, { passive: true });

  /* ---------------- mobile nav ---------------- */
  const closeMobileNav = () => {
    mobileNav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  };
  burger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach(a => a.addEventListener('click', closeMobileNav));

  /* ---------------- active nav link on scroll ---------------- */
  const sections = ['paslaugos', 'sertifikatai', 'atsiliepimai', 'galerija', 'kontaktai']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const navMap = new Map();
  navLinks.forEach(a => {
    const id = a.getAttribute('href').replace('#', '');
    if (!navMap.has(id)) navMap.set(id, []);
    navMap.get(id).push(a);
  });

  const setActive = (id) => {
    navLinks.forEach(a => a.classList.remove('active'));
    (navMap.get(id) || []).forEach(a => a.classList.add('active'));
  };

  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => navObserver.observe(s));
  }

  /* ---------------- scroll reveal ---------------- */
  const revealTargets = document.querySelectorAll(
    '.section-head, .service-card, .cert-card, .gallery-item, .testimonial-empty, .contact-person, .contact-card, .cert-badges, .cta-content, .cta-form'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(el => el.classList.add('in'));
  }

  /* ---------------- parallax on hero / cta media ---------------- */
  const parallaxEls = [
    document.querySelector('.hero-media'),
    document.querySelector('.cta-media')
  ].filter(Boolean);

  if (parallaxEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const progress = (rect.top) / vh;
        const shift = progress * -40;
        el.style.transform = `scale(1.04) translateY(${shift}px)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  /* ---------------- carousels: drag-scroll + optional prev/next buttons ---------------- */
  const tracks = document.querySelectorAll('[data-track]');
  tracks.forEach(track => {
    const carousel = track.closest('[data-carousel]');
    const prevBtn = carousel ? carousel.querySelector('[data-car-prev]') : null;
    const nextBtn = carousel ? carousel.querySelector('[data-car-next]') : null;
    const items = Array.from(track.children);
    if (!items.length) return;

    const step = () => items[0].getBoundingClientRect().width + 28;
    const scrollByStep = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });
    prevBtn && prevBtn.addEventListener('click', () => scrollByStep(-1));
    nextBtn && nextBtn.addEventListener('click', () => scrollByStep(1));

    const updateState = () => {
      if (!prevBtn && !nextBtn) return;
      const max = track.scrollWidth - track.clientWidth;
      const x = track.scrollLeft;
      if (prevBtn) prevBtn.disabled = x <= 4;
      if (nextBtn) nextBtn.disabled = x >= max - 4;
    };
    updateState();
    track.addEventListener('scroll', () => requestAnimationFrame(updateState), { passive: true });
    window.addEventListener('resize', updateState);

    /* drag to scroll with mouse (desktop convenience) */
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      isDown = true; moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      track.style.scrollSnapType = 'none';
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    const endDrag = () => {
      isDown = false;
      track.style.scrollSnapType = 'x mandatory';
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  /* ---------------- lightbox (certificates + gallery) ---------------- */
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('[data-lightbox-img]');
    const closeBtn = lightbox.querySelector('[data-lightbox-close]');

    const openLightbox = (src, alt) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-lightbox]').forEach(el => {
      el.addEventListener('click', () => {
        const src = el.getAttribute('data-lightbox');
        const img = el.querySelector('img');
        openLightbox(src, img ? img.alt : '');
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------------- CTA form (prototype — no backend) ---------------- */
  const ctaForm = document.getElementById('cta-form');
  if (ctaForm) {
    const note = ctaForm.querySelector('[data-form-note]');
    const defaultNote = note ? note.textContent : '';
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!ctaForm.reportValidity()) return;
      note.textContent = 'Ačiū! Jūsų užklausa gauta, susisieksime artimiausiu metu.';
      note.classList.add('success');
      ctaForm.reset();
      setTimeout(() => {
        note.classList.remove('success');
        note.textContent = defaultNote;
      }, 6000);
    });
  }
})();
