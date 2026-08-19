// Maggie's Kitchen — site interactions
document.addEventListener('DOMContentLoaded', function () {
  var header = document.getElementById('site-header');
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  var backToTop = document.getElementById('back-to-top');
  var yearEl = document.getElementById('year');
  var form = document.getElementById('reserve-form');
  var formNote = document.getElementById('form-note');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header state
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    if (backToTop) {
      if (window.scrollY > 500) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile nav toggle
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Back to top
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // Reservation form (static placeholder — wire up to a real backend/service)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formNote.textContent = "Thanks! This form isn't connected to an inbox yet — ask your developer to wire it up to email or a booking service.";
    });
  }
});
