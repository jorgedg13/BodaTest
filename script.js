/* ═══════════════════════════════════════════════════
   INVITACIÓN DE BODA — Coral & Sergio
   Script: countdown, carruseles, animaciones, formulario
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────
     1. COUNTDOWN — Cuenta atrás (6 Marzo 2027)
     ───────────────────────────────────── */
  const EVENT_DATE = new Date('2027-03-06T11:00:00').getTime();

  const timerEls = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  function updateCountdown() {
    const now = Date.now();
    const diff = EVENT_DATE - now;

    if (diff <= 0) {
      timerEls.days.textContent = '00';
      timerEls.hours.textContent = '00';
      timerEls.minutes.textContent = '00';
      timerEls.seconds.textContent = '00';
      clearInterval(countdownInterval);
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    timerEls.days.textContent = String(d).padStart(2, '0');
    timerEls.hours.textContent = String(h).padStart(2, '0');
    timerEls.minutes.textContent = String(m).padStart(2, '0');
    timerEls.seconds.textContent = String(s).padStart(2, '0');
  }

  const countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();


  /* ─────────────────────────────────────
     2. CARRUSELES — Swipe táctil + autoplay
     ───────────────────────────────────── */
  const carousels = document.querySelectorAll('[data-carousel]');

  /* ── Carruseles sincronizados de "Nosotros" ────────────── */
  const coupleSection = document.querySelector('.couple-section');
  const nosotrosCarousels = coupleSection
    ? Array.from(coupleSection.querySelectorAll('[data-carousel]'))
    : [];

  // Estado compartido para los carruseles de Nosotros
  const sync = {
    current: 0,
    total: 0,
    cycles: 0,        // avances completos realizados
    maxCycles: 3,      // ciclos antes de detenerse
    stopped: false,
    timer: null,
    instances: []      // { track, dots, total }
  };

  // Inicializar cada carrusel de Nosotros
  nosotrosCarousels.forEach((carousel) => {
    const track = carousel.querySelector('.carousel-track');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const slides = Array.from(track.children);
    const total = slides.length;

    if (total <= 1) return;

    // Crear dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Foto ${i + 1}`);
      dot.addEventListener('click', () => syncGoTo(i));
      dotsContainer.appendChild(dot);
    }

    const dots = Array.from(dotsContainer.children);
    const inst = { track, dots, total, carousel };
    sync.instances.push(inst);
    if (total > sync.total) sync.total = total; // usar el mayor

    // Touch / swipe (individual por carrusel, sin autoplay)
    let startX = 0, deltaX = 0, isDragging = false, localCurrent = 0;

    // Mantener referencia local para swipe
    inst.getLocal = () => localCurrent;
    inst.setLocal = (v) => { localCurrent = v; };

    carousel.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX;
      deltaX = 0;
      localCurrent = sync.current;
      track.style.transition = 'none';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      deltaX = e.touches[0].clientX - startX;
      const offset = -(localCurrent * 100) + (deltaX / carousel.offsetWidth) * 100;
      track.style.transform = `translateX(${offset}%)`;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
      isDragging = false;
      track.style.transition = '';

      const threshold = carousel.offsetWidth * 0.2;

      if (deltaX < -threshold && sync.current < sync.total - 1) {
        syncGoTo(sync.current + 1);
      } else if (deltaX > threshold && sync.current > 0) {
        syncGoTo(sync.current - 1);
      } else {
        syncGoTo(sync.current); // Snap back
      }
    });
  });

  // Ir a una slide en todos los carruseles de Nosotros
  function syncGoTo(index) {
    if (index < 0) index = 0;
    if (index >= sync.total) index = sync.total - 1;
    sync.current = index;
    sync.instances.forEach((inst) => {
      const clamped = Math.min(index, inst.total - 1);
      inst.track.style.transform = `translateX(-${clamped * 100}%)`;
      inst.dots.forEach((d, i) => d.classList.toggle('active', i === clamped));
    });
  }

  // Avance automático sincronizado con conteo de ciclos
  function syncNext() {
    if (sync.stopped) return;
    const nextIndex = sync.current + 1;

    if (nextIndex >= sync.total) {
      // Completado un ciclo
      sync.cycles++;
      if (sync.cycles >= sync.maxCycles) {
        // Ya hizo 3 pasadas → quedarse en la última
        syncGoTo(sync.total - 1);
        clearInterval(sync.timer);
        sync.stopped = true;
        return;
      }
      // Volver al inicio para siguiente ciclo
      syncGoTo(0);
    } else {
      syncGoTo(nextIndex);
    }
  }

  if (sync.instances.length > 0 && sync.total > 1) {
    sync.timer = setInterval(syncNext, 4500);
  }

  /* ── Carruseles normales (fuera de Nosotros) ───────────── */
  carousels.forEach((carousel) => {
    // Saltar los que ya están gestionados como sincronizados
    if (nosotrosCarousels.includes(carousel)) return;

    const track = carousel.querySelector('.carousel-track');
    const dotsContainer = carousel.querySelector('.carousel-dots');
    const slides = Array.from(track.children);
    const total = slides.length;

    if (total <= 1) return;

    let current = 0;
    let startX = 0;
    let deltaX = 0;
    let isDragging = false;
    let autoplayTimer = null;

    // Crear dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Foto ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }

    const dots = Array.from(dotsContainer.children);

    function goTo(index) {
      current = ((index % total) + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      resetAutoplay();
    }

    function next() {
      goTo(current + 1);
    }

    function startAutoplay() {
      autoplayTimer = setInterval(next, 4500);
    }

    function resetAutoplay() {
      clearInterval(autoplayTimer);
      startAutoplay();
    }

    startAutoplay();

    // Touch / swipe
    carousel.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].clientX;
      deltaX = 0;
      track.style.transition = 'none';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      deltaX = e.touches[0].clientX - startX;
      const offset = -(current * 100) + (deltaX / carousel.offsetWidth) * 100;
      track.style.transform = `translateX(${offset}%)`;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
      isDragging = false;
      track.style.transition = '';

      const threshold = carousel.offsetWidth * 0.2;

      if (deltaX < -threshold && current < total - 1) {
        goTo(current + 1);
      } else if (deltaX > threshold && current > 0) {
        goTo(current - 1);
      } else {
        goTo(current); // Snap back
      }
    });
  });


  /* ─────────────────────────────────────
     3. SCROLL ANIMATIONS — Fade-in
     ───────────────────────────────────── */
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    fadeElements.forEach((el) => observer.observe(el));
  } else {
    fadeElements.forEach((el) => el.classList.add('visible'));
  }


  /* ─────────────────────────────────────
     4. FORMULARIO ÚNICO — Envío de todo
     ───────────────────────────────────── */

  /* ────────────────────────────────────────────────────
     IMPORTANTE: Reemplaza la URL de abajo con la que
     te da Google Apps Script al desplegar la aplicación web.
     Mira el archivo google-apps-script.gs para instrucciones.
     ──────────────────────────────────────────────────── */
  const ENDPOINTS = {
    rsvp: 'https://script.google.com/macros/s/AKfycbxusySx-94Blb8ozmzHCsHg0jPKL6TdIOXvC4Ekk80jdEVixvfdp2J7E2ca7Ta_vtDc/exec',
  };

  async function submitToSheet(endpoint, payload) {
    // Modo demo: si no se ha configurado la URL real
    if (endpoint.includes('YOUR_')) {
      console.log('📋 Datos del formulario (modo demo):', payload);
      console.log('⚠️  Configura la URL de Google Apps Script en script.js para enviar datos reales.');
      return new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Enviar como formulario URL-encoded para máxima compatibilidad con Google Apps Script
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      formData.append(key, value);
    }

    await fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    // Con mode: 'no-cors' no podemos leer la respuesta,
    // pero si no lanza error, asumimos que se envió correctamente.
    return { result: 'ok' };
  }

  function showStatus(el, message, type) {
    el.textContent = message;
    el.className = 'form-status form-status--' + type;
  }

  // ─── Formulario RSVP + Canciones ───
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpStatus = document.getElementById('rsvpStatus');
  const songsTextarea = document.getElementById('song-list');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fd = new FormData(rsvpForm);

      const payload = {
        nombre: fd.get('nombre')?.trim() || 'Anónimo',
        asiste: fd.get('asiste') || 'Sin respuesta',
        acompanantes: fd.get('acompanantes') || '0',
        alergias: fd.get('alergias')?.trim() || 'Ninguna',
        info_extra: fd.get('info_extra')?.trim() || '',
        canciones: songsTextarea ? songsTextarea.value.trim() : '',
        timestamp: new Date().toISOString(),
      };

      // Validación
      if (!fd.get('asiste')) {
        showStatus(rsvpStatus, 'Por favor, indica si asistirás.', 'error');
        return;
      }

      showStatus(rsvpStatus, 'Enviando…', 'sending');

      try {
        await submitToSheet(ENDPOINTS.rsvp, payload);
        showStatus(rsvpStatus, '¡Gracias! Tu respuesta ha sido recibida. ♥', 'success');
        rsvpForm.reset();
        if (songsTextarea) songsTextarea.value = '';
      } catch (err) {
        console.error('Error al enviar:', err);
        showStatus(rsvpStatus, 'No se pudo enviar. Inténtalo de nuevo más tarde.', 'error');
      }
    });
  }


  /* ─────────────────────────────────────
     5. SMOOTH SCROLL — Click en scroll hint
     ───────────────────────────────────── */
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      const nextSection = document.querySelector('.hero + *');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    scrollHint.style.cursor = 'pointer';
  }


  /* ─────────────────────────────────────
     6. PARALLAX SUTIL — Esquinas del hero
     ───────────────────────────────────── */
  const hero = document.getElementById('hero');
  const corners = document.querySelectorAll('.corner-ornament');

  if (hero && corners.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cornerData = Array.from(corners).map((c) => {
      const flip = c.classList.contains('corner-tr') ? 'scaleX(-1)'
        : c.classList.contains('corner-bl') ? 'scaleY(-1)'
        : c.classList.contains('corner-br') ? 'scale(-1)'
        : '';
      const direction = c.classList.contains('corner-tl') || c.classList.contains('corner-tr') ? 1 : -1;
      return { el: c, flip, direction };
    });

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const heroH = hero.offsetHeight;

          if (scrollY < heroH) {
            const factor = scrollY * 0.04;
            cornerData.forEach(({ el, flip, direction }) => {
              el.style.transform = `${flip} translateY(${factor * direction}px)`.trim();
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

})();
