import gsap from 'gsap';

export class TextEffects {
  constructor() {
    this._initCursorGlow();
    this._initTextScramble();
  }

  _initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.classList.add('active');
    });

    document.addEventListener('mouseleave', () => {
      glow.classList.remove('active');
    });

    const animate = () => {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
      requestAnimationFrame(animate);
    };
    animate();
  }

  _initTextScramble() {
    const titles = document.querySelectorAll('.track-title');

    titles.forEach((title) => {
      const originalText = title.innerText;
      let isAnimating = false;

      title.addEventListener('mouseenter', () => {
        if (isAnimating) return;
        isAnimating = true;

        let iterations = 0;
        const interval = setInterval(() => {
          title.innerText = originalText
            .split('')
            .map((char, index) => {
              if (index < iterations) return originalText[index];
              return String.fromCharCode(65 + Math.floor(Math.random() * 26));
            })
            .join('');

          if (iterations >= originalText.length) {
            clearInterval(interval);
            title.innerText = originalText;
            isAnimating = false;
          }
          iterations += 1 / 3;
        }, 30);
      });
    });
  }

  // Parallax text on scroll — called from ScrollManager
  static applyParallax(element, scrollProgress, options = {}) {
    const {
      yRange = [-30, 30],
      opacityRange = [0.5, 1],
      blurRange = [2, 0],
    } = options;

    const y = yRange[0] + (yRange[1] - yRange[0]) * scrollProgress;
    const opacity = opacityRange[0] + (opacityRange[1] - opacityRange[0]) * scrollProgress;
    const blur = blurRange[0] + (blurRange[1] - blurRange[0]) * scrollProgress;

    gsap.set(element, {
      y,
      opacity,
      filter: `blur(${blur}px)`,
    });
  }
}
