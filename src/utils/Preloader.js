export class Preloader {
  constructor() {
    this.element = document.getElementById('preloader');
    this.barFill = document.querySelector('.preloader-bar-fill');
    this.statusText = document.querySelector('.preloader-status');
    this.center = document.querySelector('.preloader-center');
    this.progress = 0;
  }

  updateProgress(value) {
    this.progress = Math.min(value, 100);
    if (this.barFill) {
      this.barFill.style.width = `${this.progress}%`;
    }
    if (this.statusText) {
      if (this.progress < 30) this.statusText.textContent = 'INITIALIZING';
      else if (this.progress < 60) this.statusText.textContent = 'LOADING ASSETS';
      else if (this.progress < 90) this.statusText.textContent = 'CALIBRATING';
      else this.statusText.textContent = 'READY';
    }
  }

  hide() {
    return new Promise((resolve) => {
      this.updateProgress(100);

      // Fade out the center content (text + bar)
      if (this.center) {
        this.center.style.transition = 'opacity 0.6s ease';
        this.center.style.opacity = '0';
      }

      // Then fade out the whole preloader overlay
      setTimeout(() => {
        if (this.element) {
          this.element.classList.add('hidden');
        }
        setTimeout(resolve, 1000);
      }, 600);
    });
  }

  forceHide() {
    if (this.element) {
      this.element.classList.add('hidden');
    }
  }
}
