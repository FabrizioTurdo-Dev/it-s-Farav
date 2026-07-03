import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollManager {
  constructor(beacon, fog) {
    this.beacon = beacon;
    this.fog = fog;
    this.scrollProgress = 0;

    this._setupScrollTracking();
    this._animateHero();
    this._animateTracks();
    this._animateBio();
    this._animateContact();
  }

  _setupScrollTracking() {
    // Global scroll progress for Three.js
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        this.scrollProgress = self.progress;
      },
    });
  }

  getScrollProgress() {
    return this.scrollProgress;
  }

  _animateHero() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scene-hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        pin: false,
      },
    });

    // Logo — frontal movement (Y only, no depth/scale)
    tl.to('.hero-logo', {
      y: -80,
      opacity: 0,
      letterSpacing: '0.2em',
      duration: 1,
    }, 0);

    // Tagline fades
    tl.to('.hero-tagline', {
      opacity: 0,
      y: -30,
      duration: 0.5,
    }, 0);

    // Status fades
    tl.to('.hero-status', {
      opacity: 0,
      y: -20,
      duration: 0.5,
    }, 0);

    // Nav fades
    tl.to('.hero-nav', {
      opacity: 0,
      y: -25,
      duration: 0.5,
    }, 0);

    // UI corners fade
    tl.to('.hero-ui-top, .hero-ui-bottom', {
      opacity: 0,
      duration: 0.5,
    }, 0);

    // Fog intensifies as we leave hero
    tl.to({}, {
      duration: 1,
      onUpdate: () => {
        const progress = tl.progress();
        if (this.fog) {
          this.fog.setIntensity(1.0 + progress * 0.5);
        }
      },
    }, 0);

    // Entry animations (on page load)
    this._heroEntry();
  }

  _heroEntry() {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo('.hero-status',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', immediateRender: false },
    );

    tl.fromTo('.hero-logo',
      { opacity: 0, scale: 1.5, filter: 'blur(20px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out', immediateRender: false },
    '-=0.5');

    tl.fromTo('.hero-tagline',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', immediateRender: false },
    '-=0.8');

    tl.fromTo('.nav-link, .nav-divider',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', immediateRender: false },
    '-=0.5');

    tl.fromTo('.hero-ui-top, .hero-ui-bottom',
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: 'power2.out', immediateRender: false },
    '-=0.3');
  }

  _animateTracks() {
    // Section title
    gsap.from('.scene-tracks .section-title', {
      scrollTrigger: {
        trigger: '.scene-tracks',
        start: 'top 80%',
        end: 'top 40%',
        scrub: 1,
      },
      opacity: 0,
      x: -50,
      duration: 1,
    });

    gsap.from('.scene-tracks .section-subtitle', {
      scrollTrigger: {
        trigger: '.scene-tracks',
        start: 'top 75%',
        end: 'top 45%',
        scrub: 1,
      },
      opacity: 0,
      y: 20,
      duration: 1,
    });

    // Track cards emerge from darkness
    gsap.utils.toArray('.track-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: 'top 50%',
          scrub: 1,
        },
        opacity: 0,
        y: 80,
        rotateX: 8,
        duration: 1,
        delay: i * 0.15,
      });
    });
  }

  _animateBio() {
    // Video frame reveal
    gsap.from('.video-frame', {
      scrollTrigger: {
        trigger: '.scene-bio',
        start: 'top 70%',
        end: 'top 30%',
        scrub: 1,
      },
      opacity: 0,
      scale: 0.92,
      duration: 1.5,
    });

    // Bio line expand
    gsap.from('.bio-line', {
      scrollTrigger: {
        trigger: '.bio-line',
        start: 'top 80%',
        end: 'top 50%',
        scrub: 1,
      },
      scaleX: 0,
      transformOrigin: 'left',
      duration: 1,
    });

    // Bio title
    gsap.from('.scene-bio .section-title', {
      scrollTrigger: {
        trigger: '.scene-bio',
        start: 'top 75%',
        end: 'top 45%',
        scrub: 1,
      },
      opacity: 0,
      x: -30,
      duration: 1,
    });

    // Bio highlight
    gsap.from('.bio-highlight', {
      scrollTrigger: {
        trigger: '.bio-highlight',
        start: 'top 80%',
        end: 'top 50%',
        scrub: 1,
      },
      opacity: 0,
      y: 30,
      duration: 1,
    });

    // Bio paragraphs stagger
    gsap.from('.bio-col-content p', {
      scrollTrigger: {
        trigger: '.bio-col-content',
        start: 'top 80%',
        end: 'bottom 60%',
        scrub: 1,
      },
      opacity: 0,
      y: 25,
      stagger: 0.15,
      duration: 1,
    });
  }

  _animateContact() {
    // Contact title
    gsap.from('.contact-title', {
      scrollTrigger: {
        trigger: '.scene-contact',
        start: 'top 70%',
        end: 'top 30%',
        scrub: 1,
      },
      opacity: 0,
      filter: 'blur(20px)',
      y: 30,
      duration: 1.5,
    });

    // Contact subtitle
    gsap.from('.contact-subtitle', {
      scrollTrigger: {
        trigger: '.scene-contact',
        start: 'top 65%',
        end: 'top 35%',
        scrub: 1,
      },
      opacity: 0,
      y: 20,
      duration: 1,
    });

    // WhatsApp CTA
    gsap.from('.whatsapp-cta', {
      scrollTrigger: {
        trigger: '.scene-contact',
        start: 'top 60%',
        end: 'top 30%',
        scrub: 1,
      },
      opacity: 0,
      y: 20,
      duration: 1,
    });

    // Footer
    gsap.from('.contact-footer', {
      scrollTrigger: {
        trigger: '.scene-contact',
        start: 'top 50%',
        end: 'top 20%',
        scrub: 1,
      },
      opacity: 0,
      duration: 1,
    });
  }

  dispose() {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
