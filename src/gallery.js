import { Cloudinary } from '@cloudinary/url-gen';
import { CLOUDINARY_CONFIG, GALLERY_ASSETS } from './gallery-config.js';

export class Gallery {
  constructor() {
    this.cld = new Cloudinary({
      cloud: { cloudName: CLOUDINARY_CONFIG.cloudName },
    });
    this.folder = CLOUDINARY_CONFIG.folder;
    this.assets = [];
    this.lightbox = null;
    this.currentIndex = -1;
    this._createLightbox();
  }

  async init() {
    // Try to fetch assets from Cloudinary API
    this.assets = await this._fetchAssets();

    // If API didn't return assets, use the manual config
    if (this.assets.length === 0 && GALLERY_ASSETS.length > 0) {
      this.assets = GALLERY_ASSETS;
    }

    this._render();
    this._initScrollAnimations();
  }

  async _fetchAssets() {
    try {
      // Cloudinary admin API — list resources in folder
      // This requires the folder to be accessible or a signed request
      const url = `https://api.cloudinary.com/v1_1/${this.folder}/resources/search?expression=folder:${this.folder}&max_results=50`;
      const response = await fetch(url);

      if (!response.ok) return [];

      const data = await response.json();
      return (data.resources || []).map((r) => ({
        id: r.public_id,
        type: r.resource_type,
        format: r.format,
        width: r.width,
        height: r.height,
      }));
    } catch {
      // API not accessible — fall back to manual config
      return [];
    }
  }

  _getImageUrl(publicId, width = 1200) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},f_auto,q_auto/${publicId}`;
  }

  _getVideoUrl(publicId) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/f_auto,q_auto/${publicId}`;
  }

  _getVideoThumb(publicId) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/c_fill,g_auto,w_600,h_400,so_0,f_auto,q_auto/${publicId}`;
  }

  _render() {
    const container = document.querySelector('.gallery-grid');
    if (!container) return;

    if (this.assets.length === 0) {
      container.innerHTML = `
        <div class="gallery-empty" style="grid-column: 1 / -1;">
          GALLERY_CONTENT_PENDING
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    this.assets.forEach((asset, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.setAttribute('data-animate', 'gallery-emerge');
      item.setAttribute('data-index', i);

      // Vary sizes for visual interest
      if (i % 5 === 0) item.classList.add('wide');
      if (i % 7 === 0) item.classList.add('tall');

      if (asset.type === 'video') {
        item.innerHTML = `
          <video src="${this._getVideoUrl(asset.id)}" muted loop playsinline
            poster="${this._getVideoThumb(asset.id)}"></video>
          <div class="gallery-item-overlay">
            <span class="gallery-item-label">${asset.id.split('/').pop()}</span>
          </div>
          <span class="gallery-item-type">VIDEO</span>
        `;

        // Play video on hover
        const video = item.querySelector('video');
        item.addEventListener('mouseenter', () => video.play());
        item.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
      } else {
        item.innerHTML = `
          <img src="${this._getImageUrl(asset.id)}" alt="${asset.id}" loading="lazy" />
          <div class="gallery-item-overlay">
            <span class="gallery-item-label">${asset.id.split('/').pop()}</span>
          </div>
          <span class="gallery-item-type">PHOTO</span>
        `;
      }

      // Click to open lightbox
      item.addEventListener('click', () => this._showAsset(i));

      container.appendChild(item);
    });
  }

  _createLightbox() {
    this.lightbox = document.createElement('div');
    this.lightbox.className = 'gallery-lightbox';
    this.lightbox.innerHTML = `
      <button class="gallery-lightbox-close">CLOSE</button>
      <button class="gallery-lightbox-prev">&#9664;</button>
      <button class="gallery-lightbox-next">&#9654;</button>
      <span class="gallery-lightbox-counter"></span>
    `;
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox || e.target.classList.contains('gallery-lightbox-close')) {
        this._closeLightbox();
      }
    });

    // Prev/next buttons
    this.lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      this._navigate(-1);
    });
    this.lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      this._navigate(1);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') this._navigate(-1);
      if (e.key === 'ArrowRight') this._navigate(1);
      if (e.key === 'Escape') this._closeLightbox();
    });

    document.body.appendChild(this.lightbox);
  }

  _navigate(direction) {
    if (this.currentIndex < 0 || this.assets.length === 0) return;

    let newIndex = this.currentIndex + direction;
    if (newIndex < 0) newIndex = this.assets.length - 1;
    if (newIndex >= this.assets.length) newIndex = 0;

    this._showAsset(newIndex);
  }

  _showAsset(index) {
    this.currentIndex = index;
    const asset = this.assets[index];

    // Remove previous media
    const existing = this.lightbox.querySelector('img, video');
    if (existing) existing.remove();

    if (asset.type === 'video') {
      const video = document.createElement('video');
      video.src = this._getVideoUrl(asset.id);
      video.controls = true;
      video.autoplay = true;
      this.lightbox.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = this._getImageUrl(asset.id, 1600, 1200);
      img.alt = asset.id;
      this.lightbox.appendChild(img);
    }

    // Update counter
    const counter = this.lightbox.querySelector('.gallery-lightbox-counter');
    counter.textContent = `${index + 1} / ${this.assets.length}`;

    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
    const media = this.lightbox.querySelector('img, video');
    if (media) media.remove();
    this.currentIndex = -1;
  }

  _initScrollAnimations() {
    // Import GSAP dynamically
    import('gsap').then(({ default: gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Gallery title
        gsap.from('.scene-gallery .section-title', {
          scrollTrigger: {
            trigger: '.scene-gallery',
            start: 'top 80%',
            end: 'top 40%',
            scrub: 1,
          },
          opacity: 0,
          x: -50,
          duration: 1,
        });

        gsap.from('.scene-gallery .section-subtitle', {
          scrollTrigger: {
            trigger: '.scene-gallery',
            start: 'top 75%',
            end: 'top 45%',
            scrub: 1,
          },
          opacity: 0,
          y: 20,
          duration: 1,
        });

        // Gallery items emerge
        gsap.utils.toArray('.gallery-item').forEach((item, i) => {
          gsap.from(item, {
            scrollTrigger: {
              trigger: item,
              start: 'top 90%',
              end: 'top 60%',
              scrub: 1,
            },
            opacity: 0,
            y: 40,
            duration: 1,
            delay: i * 0.05,
          });
        });
      });
    });
  }
}
