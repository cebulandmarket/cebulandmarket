/* ===== CebuLandMarket - Modern Visual Effects ===== */

(function() {
  'use strict';

  // --- Scroll Reveal (Intersection Observer) ---
  function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    if (!revealElements.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // --- Auto-tag sections for reveal ---
  function autoTagReveal() {
    // Tag major sections
    var sections = [
      '.search-section',
      '.how-it-works',
      '.stats-bar',
      '.cta-banner',
      '.showcase-section',
      '.video-section'
    ];
    sections.forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el && !el.classList.contains('reveal')) el.classList.add('reveal');
    });

    // Tag section titles
    document.querySelectorAll('.section-title').forEach(function(el) {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });

    // Tag grids for stagger
    var grids = document.querySelectorAll('.steps-grid, .trust-grid, .showcase-grid');
    grids.forEach(function(g) {
      if (!g.classList.contains('stagger-children')) g.classList.add('stagger-children');
    });

    // Tag featured listings grid
    var featGrid = document.querySelector('.listings-grid');
    if (featGrid && !featGrid.classList.contains('stagger-children')) {
      featGrid.classList.add('stagger-children');
    }
  }

  // --- Animated Counter ---
  function animateCounters() {
    var statNumbers = document.querySelectorAll('.stat-number[data-count]');
    if (!statNumbers.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10);
          var prefix = el.getAttribute('data-prefix') || '';
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = 2000;
          var start = 0;
          var startTime = null;

          function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
          }

          function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var value = Math.floor(easeOutQuart(progress) * target);
            el.textContent = prefix + value.toLocaleString() + suffix;
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              el.textContent = prefix + target.toLocaleString() + suffix;
            }
          }

          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(function(el) { observer.observe(el); });
  }

  // --- Hero Particles ---
  function initParticles() {
    var canvas = document.getElementById('heroParticles');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = 50;

    function resize() {
      var hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.4 + 0.1
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function(p) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + p.opacity + ')';
        ctx.fill();
      });

      // Draw connections
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.06 * (1 - dist / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', function() {
      resize();
    });
  }

  // --- Typing Effect for Hero ---
  function initTypingEffect() {
    var el = document.getElementById('heroTypingText');
    if (!el) return;

    var phrases = [
      'Buy or Sell Property in Cebu',
      'DTI-Registered & Verified',
      'List Your Property \u2014 \u20B1100 Only',
      'Works Offline \u2014 No WiFi Needed',
      'Trusted by Cebuanos'
    ];

    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 60;
    var deleteSpeed = 30;
    var pauseTime = 2500;

    function type() {
      var currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        el.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(type, 400);
          return;
        }
        setTimeout(type, deleteSpeed);
      } else {
        el.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === currentPhrase.length) {
          isDeleting = true;
          setTimeout(type, pauseTime);
          return;
        }
        setTimeout(type, typeSpeed);
      }
    }

    setTimeout(type, 800);
  }

  // --- Video Play Button ---
  function initVideoPlay() {
    var overlay = document.querySelector('.video-play-overlay');
    var video = document.querySelector('.video-wrapper video');
    if (!overlay || !video) return;

    overlay.addEventListener('click', function() {
      overlay.style.display = 'none';
      video.play();
      video.setAttribute('controls', '');
    });
  }

  // --- Smooth Navbar Shadow on Scroll ---
  function initNavbarScroll() {
    var header = document.querySelector('.header');
    if (!header) return;

    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var scrollY = window.pageYOffset;
      if (scrollY > 60) {
        header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.08)';
      } else {
        header.style.boxShadow = '';
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  // --- Parallax subtle on hero ---
  function initHeroParallax() {
    var heroSlideshow = document.querySelector('.hero-slideshow');
    if (!heroSlideshow) return;

    window.addEventListener('scroll', function() {
      var scrollY = window.pageYOffset;
      if (scrollY < 600) {
        heroSlideshow.style.transform = 'translateY(' + (scrollY * 0.15) + 'px)';
        heroSlideshow.style.opacity = 1 - (scrollY / 600) * 0.3;
      }
    }, { passive: true });
  }

  // --- Init All ---
  document.addEventListener('DOMContentLoaded', function() {
    autoTagReveal();
    initScrollReveal();
    animateCounters();
    initParticles();
    initTypingEffect();
    initVideoPlay();
    initNavbarScroll();
    initHeroParallax();
  });

})();
