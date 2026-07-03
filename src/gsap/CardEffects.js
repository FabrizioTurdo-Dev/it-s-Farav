export class CardEffects {
  constructor() {
    this.cards = document.querySelectorAll('.track-card');
    this._init();
  }

  _init() {
    this.cards.forEach((card) => {
      // Track mouse position for glow effect
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);

        // Subtle 3D tilt
        const tiltX = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
        const tiltY = ((e.clientX - rect.left) / rect.width - 0.5) * -6;
        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          card.style.transition = '';
        }, 500);
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = '';
      });
    });
  }
}
