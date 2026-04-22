// Mark JS as loaded so CSS animations activate (progressive enhancement)
document.documentElement.classList.add('js-loaded');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Draws a single SVG path stroke from left to right using dashoffset.
// Delay is added so the stroke starts after the heading text has faded in.
function drawLine(svgId) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const path = svg.querySelector('path');
  if (!path) return;

  const len = path.getTotalLength();
  path.style.strokeDasharray = len;

  if (reducedMotion) {
    path.style.strokeDashoffset = 0;
    return;
  }

  path.style.strokeDashoffset = len;
  // 0.75 s delay lets the heading fade-in finish before the stroke draws
  path.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) 0.75s';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    path.style.strokeDashoffset = 0;
  }));
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');

        // Trigger stroke animation when the heading wrapper becomes visible
        if (entry.target.classList.contains('heading-wrap')) {
          drawLine('line-mobile');
          drawLine('line-desktop');
        }

        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

document.querySelectorAll('.animate-up').forEach((el) => observer.observe(el));

// ── ORDER FOR PICKUP MODAL (desktop only) ──
(function () {
  const btn      = document.querySelector('.btn-viber');
  const modal    = document.getElementById('pickup-modal');
  const closeBtn = modal && modal.querySelector('.modal-close');
  const toast    = document.getElementById('copy-toast');
  const numBtn   = modal && modal.querySelector('.viber-number');

  if (!btn || !modal) return;

  function openModal() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.classList.add('is-closing');
    function onAnimationEnd(e) {
      if (e.target !== modal) return;
      modal.removeEventListener('animationend', onAnimationEnd);
      modal.classList.remove('is-closing');
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
      btn.focus();
    }
    modal.addEventListener('animationend', onAnimationEnd);
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });

  let toastTimer;
  function showToast() {
    if (!toast) return;
    toast.classList.add('toast-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('toast-visible'), 2500);
  }

  if (numBtn) {
    numBtn.addEventListener('click', () => {
      const number = numBtn.dataset.number;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(number).then(showToast).catch(() => fallbackCopy(number));
      } else {
        fallbackCopy(number);
      }
    });
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(); } catch (_) {}
    document.body.removeChild(ta);
  }
}());

// ── COLLAGE PARALLAX (desktop only) ──
if (!reducedMotion && window.matchMedia('(min-width: 768px)').matches) {
  document.querySelectorAll('.desktop-collage .collage-col img').forEach((img) => {
    img.addEventListener('mouseenter', () => {
      // Switch to fast tracking while the cursor is moving
      img.style.transition = 'transform 0.08s ease-out';
    });

    img.addEventListener('mousemove', (e) => {
      const rect = img.getBoundingClientRect();
      // Normalise cursor position to -0.5 … +0.5 relative to image centre
      const x = (e.clientX - rect.left - rect.width  / 2) / rect.width;
      const y = (e.clientY - rect.top  - rect.height / 2) / rect.height;
      // Scale up slightly so the translate never reveals an edge gap
      img.style.transform = `scale(1.06) translate(${x * 14}px, ${y * 10}px)`; // scale stays constant
    });

    img.addEventListener('mouseleave', () => {
      // Slow ease back to rest
      img.style.transition = 'transform 0.5s ease-out';
      img.style.transform = 'scale(1.06)';
    });
  });
}
