/**
 * Dots - Corporate Website JavaScript
 * Particle Animation + Interactions
 */

(function() {
  'use strict';

  /* ==========================================
     Particle Animation (Stars)
     ========================================== */
  class ParticleAnimation {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.particleCount = 100;
      this.mouse = { x: null, y: null, radius: 150 };
      
      this.init();
      this.animate();
      this.handleResize();
    }
    
    init() {
      this.canvas.width = this.canvas.offsetWidth;
      this.canvas.height = this.canvas.offsetHeight;
      
      // Create particles
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          radius: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    }
    
    drawParticle(particle) {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      // Monochrome white particles with glow
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius * 2
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
      gradient.addColorStop(0.5, `rgba(200, 200, 200, ${particle.opacity * 0.6})`);
      gradient.addColorStop(1, `rgba(150, 150, 150, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    updateParticle(particle) {
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Boundary check
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -1;
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -1;
      }
      
      // Mouse interaction
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = this.mouse.x - particle.x;
        const dy = this.mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
          const angle = Math.atan2(dy, dx);
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          particle.x -= Math.cos(angle) * force * 2;
          particle.y -= Math.sin(angle) * force * 2;
        }
      }
    }
    
    drawConnections() {
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            this.ctx.beginPath();
            // Monochrome connection lines
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - distance / 120)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
            this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
            this.ctx.stroke();
          }
        }
      }
    }
    
    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw connections first (so they appear behind particles)
      this.drawConnections();
      
      // Update and draw particles
      this.particles.forEach(particle => {
        this.updateParticle(particle);
        this.drawParticle(particle);
      });
      
      requestAnimationFrame(() => this.animate());
    }
    
    handleResize() {
      window.addEventListener('resize', () => {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
      });
      
      // Mouse move
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });
      
      // Mouse leave
      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }
  }
  
  // Initialize particle animation for all canvases
  const canvasIds = ['particlesCanvas', 'hero-canvas'];
  canvasIds.forEach(canvasId => {
    if (document.getElementById(canvasId)) {
      new ParticleAnimation(canvasId);
    }
  });

  /* ==========================================
     Intersection Observer for Scroll Reveal
     ========================================== */
  const revealElements = document.querySelectorAll('.reveal-fade');
  
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  /* ==========================================
     Header Scroll Effect
     ========================================== */
  const header = document.getElementById('header');
  let lastScrollY = window.scrollY;
  
  function handleHeaderScroll() {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = currentScrollY;
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleHeaderScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ==========================================
     Mobile Navigation Toggle
     ========================================== */
  const menuToggle = document.querySelector('.header__toggle');
  const nav = document.querySelector('.header__nav');
  const navLinks = document.querySelectorAll('.header__nav-list a, .btn--header');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      
      menuToggle.setAttribute('aria-expanded', !isExpanded);
      menuToggle.setAttribute('aria-label', isExpanded ? 'メニューを開く' : 'メニューを閉じる');
      nav.classList.toggle('active');
      
      document.body.style.overflow = isExpanded ? '' : 'hidden';
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('active')) {
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.setAttribute('aria-label', 'メニューを開く');
          nav.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (nav.classList.contains('active') && 
          !nav.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'メニューを開く');
        nav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'メニューを開く');
        nav.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.focus();
      }
    });
  }

  /* ==========================================
     Smooth Scroll
     ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (!href || href === '#') return;
      
      const targetElement = document.querySelector(href);
      
      if (targetElement) {
        e.preventDefault();
        
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        if (history.pushState) {
          history.pushState(null, null, href);
        }
        
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus({ preventScroll: true });
      }
    });
  });

  /* ==========================================
     Stats Counter Animation
     ========================================== */
  const statsNumbers = document.querySelectorAll('.stats__number');
  
  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const unit = element.querySelector('.stats__unit');
      const unitText = unit ? unit.textContent : '';
      const endValue = parseFloat(end);
      
      if (isNaN(endValue)) {
        element.innerHTML = end;
      } else {
        const current = endValue < 10 
          ? (progress * endValue).toFixed(1) 
          : Math.floor(progress * endValue);
        element.innerHTML = `${current}${unit ? `<span class="stats__unit">${unitText}</span>` : ''}`;
      }
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const text = element.textContent;
          const match = text.match(/[\d.]+/);
          
          if (match) {
            const endValue = match[0];
            animateValue(element, 0, parseFloat(endValue), 1500);
          }
          
          statsObserver.unobserve(element);
        }
      });
    },
    { threshold: 0.5 }
  );

  statsNumbers.forEach(stat => statsObserver.observe(stat));

  /* ==========================================
     Review "Read More" Buttons
     ========================================== */
  const readMoreButtons = document.querySelectorAll('.featured-review__more, .review-card__more');
  
  readMoreButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Find the text element (either in quote or direct sibling)
      const quote = this.previousElementSibling;
      let textElement;
      
      if (quote && quote.classList.contains('featured-review__quote')) {
        textElement = quote.querySelector('.review-text');
      } else if (quote && quote.classList.contains('review-card__text')) {
        textElement = quote;
      }
      
      if (textElement && textElement.dataset.fullText) {
        const isExpanded = textElement.classList.contains('expanded');
        const truncateSpan = textElement.querySelector('.text-truncate');
        
        if (isExpanded) {
          // Collapse
          const shortText = textElement.dataset.fullText.split('。')[0] + '。';
          textElement.innerHTML = shortText + '<span class="text-truncate">...</span>';
          textElement.classList.remove('expanded');
          this.textContent = '続きを読む';
        } else {
          // Expand
          textElement.textContent = textElement.dataset.fullText;
          textElement.classList.add('expanded');
          this.textContent = '閉じる';
        }
      }
    });
  });

  /* ==========================================
     Reduced Motion
     ========================================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handleMotionPreference = (e) => {
    if (e.matches) {
      document.documentElement.style.setProperty('--transition-fast', '0.01ms');
      document.documentElement.style.setProperty('--transition-base', '0.01ms');
      document.documentElement.style.setProperty('--transition-slow', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--transition-fast');
      document.documentElement.style.removeProperty('--transition-base');
      document.documentElement.style.removeProperty('--transition-slow');
    }
  };

  prefersReducedMotion.addEventListener('change', handleMotionPreference);
  handleMotionPreference(prefersReducedMotion);

  /* ==========================================
     Counter Animation
     ========================================== */
  function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString();
      }
    };
    
    updateCounter();
  }
  
  // Observe counters and trigger animation when visible
  const counters = document.querySelectorAll('.counter');
  
  if (counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.textContent === '0') {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });
    
    counters.forEach(counter => {
      counterObserver.observe(counter);
    });
  }

  /* ==========================================
     Console Branding
     ========================================== */
  console.log(
    '%c⚫ Dots',
    'font-size: 24px; font-weight: bold; color: #3b82f6; padding: 10px;'
  );
  console.log('%cあらゆる「点」を結び、新しいストーリーを創る。', 'font-size: 14px; color: #94a3b8; padding: 5px;');

  console.log('✅ Dots website initialized successfully');

})();