import { Scene } from './three/Scene.js';
import { Fog } from './three/Fog.js';
import { Particles } from './three/Particles.js';
import { Beacon } from './three/Beacon.js';
import { ScrollManager } from './gsap/ScrollManager.js';
import { TextEffects } from './gsap/TextEffects.js';
import { CardEffects } from './gsap/CardEffects.js';
import { DeviceDetect } from './utils/DeviceDetect.js';
import { Preloader } from './utils/Preloader.js';

class FARAV {
  constructor() {
    this.preloader = new Preloader();
    this.tier = DeviceDetect.getPerformanceTier();

    this._init();
  }

  async _init() {
    try {
      this.scene = new Scene(this.tier);
      this.preloader.updateProgress(10);

      this.beacon = new Beacon(this.scene.scene, this.tier);
      this.preloader.updateProgress(25);

      this.fog = new Fog(this.scene.scene, this.tier);
      this.preloader.updateProgress(40);

      this.scene.start();
      this.preloader.updateProgress(55);

      this.particles = new Particles(this.scene.scene, this.tier);
      this.preloader.updateProgress(75);

      if (this.tier !== 'high') {
        this._optimizeForDevice();
      }

      this.scene.onUpdate((elapsed, delta, mouse) => {
        const scrollProgress = this.scrollManager
          ? this.scrollManager.getScrollProgress()
          : 0;

        this.fog.update(elapsed, delta, mouse, scrollProgress);
        this.particles.update(elapsed, delta, mouse);
        this.beacon.update(elapsed, delta, mouse, scrollProgress);
      });

      this.preloader.updateProgress(90);

      this._initGSAP();
      this.preloader.updateProgress(100);

      await this.preloader.hide();

      this.textEffects = new TextEffects();
      this.cardEffects = new CardEffects();
      this._initWhatsApp();
      this._initHamburger();

    } catch (error) {
      console.error('FARAV initialization error:', error);
      this.preloader.forceHide();
    }
  }

  _initGSAP() {
    requestAnimationFrame(() => {
      this.scrollManager = new ScrollManager(this.beacon, this.fog);
    });
  }

  _optimizeForDevice() {
    if (this.fog.mesh2) {
      this.fog.mesh2.visible = false;
    }
    this.fog.setIntensity(0.7);
  }

  _initWhatsApp() {
    const whatsappBtn = document.getElementById('whatsapp-fixed');
    if (!whatsappBtn) return;

    whatsappBtn.style.opacity = '0';
    whatsappBtn.style.pointerEvents = 'none';
    whatsappBtn.style.transition = 'opacity 0.5s ease';

    let visible = false;
    window.addEventListener('scroll', () => {
      const pastHero = window.scrollY > window.innerHeight * 0.6;
      if (pastHero && !visible) {
        whatsappBtn.style.opacity = '1';
        whatsappBtn.style.pointerEvents = 'auto';
        visible = true;
      } else if (!pastHero && visible) {
        whatsappBtn.style.opacity = '0';
        whatsappBtn.style.pointerEvents = 'none';
        visible = false;
      }
    });
  }

  _initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      menu.classList.toggle('open');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        menu.classList.remove('open');
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FARAV();
});
