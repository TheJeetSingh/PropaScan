/**
 * PropaScan Website - JavaScript
 * Adds interactivity and dynamic content
 */

// Update current date in masthead
function updateDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    dateElement.textContent = currentDate;
  }
}

// Handle install button click
function setupInstallButton() {
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      // For now, log to console - replace with actual Chrome Web Store URL
      console.log('Install button clicked');

      // Show a temporary message
      const originalText = installBtn.innerHTML;
      installBtn.innerHTML = '<span class="cta-button-text">Coming Soon!</span>';
      installBtn.style.background = 'var(--accent-gold)';

      setTimeout(() => {
        installBtn.innerHTML = originalText;
        installBtn.style.background = '';
      }, 2000);

      // In production, replace above with:
      // window.open('YOUR_CHROME_WEB_STORE_URL', '_blank');
    });
  }
}

// Add scroll animations for elements
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe feature cards for staggered animation
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    observer.observe(card);
  });

  // Observe sidebar boxes
  const sidebarBoxes = document.querySelectorAll('.sidebar-box');
  sidebarBoxes.forEach((box, index) => {
    box.style.opacity = '0';
    box.style.transform = 'translateX(20px)';
    box.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.15}s`;
    observer.observe(box);
  });
}

// Add typewriter effect to headline (optional enhancement)
function typewriterEffect(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';

  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}

// Add paper crinkle sound effect on button clicks (optional)
function addButtonSounds() {
  const buttons = document.querySelectorAll('button, .link-button');

  buttons.forEach(button => {
    button.addEventListener('mousedown', () => {
      // Visual feedback
      button.style.transition = 'transform 0.1s ease';
    });
  });
}

// Smooth scroll for any internal links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Add vintage newspaper ink smudge effect on mouse movement
function addInkSmudgeEffect() {
  let timeout;
  const newspaper = document.querySelector('.newspaper');

  newspaper.addEventListener('mousemove', (e) => {
    clearTimeout(timeout);

    // Create subtle shadow effect following cursor
    const x = e.clientX;
    const y = e.clientY;
    const rect = newspaper.getBoundingClientRect();
    const relX = ((x - rect.left) / rect.width - 0.5) * 2;
    const relY = ((y - rect.top) / rect.height - 0.5) * 2;

    newspaper.style.boxShadow = `
      ${relX * -5}px ${relY * -5}px 40px rgba(0,0,0,0.15),
      0 10px 40px rgba(0,0,0,0.3),
      inset 0 0 100px rgba(0,0,0,0.05),
      0 0 0 1px var(--ink-medium)
    `;

    timeout = setTimeout(() => {
      newspaper.style.boxShadow = '';
    }, 200);
  });
}

// Easter egg: Konami code for vintage print mode
function setupKonamiCode() {
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activatePrintMode();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
}

function activatePrintMode() {
  const body = document.body;
  body.style.filter = 'grayscale(100%) contrast(120%)';
  body.style.transition = 'filter 1s ease';

  setTimeout(() => {
    body.style.filter = '';
  }, 5000);

  console.log('🗞️ Vintage print mode activated!');
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  setupInstallButton();
  setupScrollAnimations();
  addButtonSounds();
  setupSmoothScroll();
  addInkSmudgeEffect();
  setupKonamiCode();

  console.log('%c📰 PropaScan Website Loaded', 'font-size: 20px; font-weight: bold; color: #8b2500;');
  console.log('%cExposing propaganda, one page at a time', 'font-style: italic; color: #4a3f2f;');
});

// Add print styles trigger
window.addEventListener('beforeprint', () => {
  document.body.classList.add('printing');
});

window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing');
});
