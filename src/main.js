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
      // 1. Three.js starts IMMEDIATELY — canvas = preloader background
      this.scene = new Scene();
      this.preloader.updateProgress(10);

      // 2. Beacon (the rotating red light) — visible from the start
      this.beacon = new Beacon(this.scene.scene);
      this.preloader.updateProgress(25);

      // 3. Fog — atmospheric background
      this.fog = new Fog(this.scene.scene);
      this.preloader.updateProgress(40);

      // 4. Start render loop — faro is now spinning behind the preloader
      this.scene.start();
      this.preloader.updateProgress(55);

      // 5. Particles
      this.particles = new Particles(this.scene.scene);
      this.preloader.updateProgress(75);

      // 6. Device optimization
      if (this.tier !== 'high') {
        this._optimizeForDevice();
      }

      // 7. Register update loop
      this.scene.onUpdate((elapsed, delta, mouse) => {
        const scrollProgress = this.scrollManager
          ? this.scrollManager.getScrollProgress()
          : 0;

        this.fog.update(elapsed, delta, mouse, scrollProgress);
        this.particles.update(elapsed, delta, mouse);
        this.beacon.update(elapsed, delta, mouse, scrollProgress);
      });

      this.preloader.updateProgress(90);

      // 8. Init GSAP
      this._initGSAP();
      this.preloader.updateProgress(100);

      // 9. Hide preloader — canvas stays, HTML fades out
      await this.preloader.hide();

      // 10. Init interactions
      this.textEffects = new TextEffects();
      this.cardEffects = new CardEffects();
      this._initWhatsApp();

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
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  new FARAV();
});
