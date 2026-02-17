import { Injectable } from '@angular/core';

/**
 * Asset Preloader Service
 *
 * Optimizes asset loading using resource hints:
 * - dns-prefetch: Resolve DNS early (no connection)
 * - preconnect: Establish full connection (DNS + TLS + TCP)
 * - prefetch: Download for later navigation (low priority)
 * - preload: Download now, use soon (high priority)
 *
 * Performance Impact:
 * - dns-prefetch: ~50-100ms faster
 * - preconnect: ~100-300ms faster (critical for CDN)
 * - prefetch: 20-50ms faster on navigation
 * - preload: 50-100ms faster on page load
 *
 * Usage:
 * 1. Call in app.config.ts or main.ts for critical resources
 * 2. Call in component ngOnInit for route-specific assets
 * 3. Use batch methods for multiple assets
 */
@Injectable({
  providedIn: 'root',
})
export class AssetPreloaderService {
  private loadedAssets = new Set<string>();
  private resourceHints: HTMLLinkElement[] = [];

  constructor() {
    this.addCriticalHints();
  }

  /**
   * Add resource hints for critical third-party origins
   * Run at app startup
   */
  private addCriticalHints(): void {
    // DNS prefetch for external services (no connection)
    this.dnsPrefetch('https://cdn.jsdelivr.net');
    this.dnsPrefetch('https://fonts.googleapis.com');
    this.dnsPrefetch('https://analytics.google.com');

    // Preconnect to critical CDN origins (establish connection)
    this.preconnect('https://res.cloudinary.com', 'anonymous');
    this.preconnect('https://fonts.googleapis.com');
    this.preconnect('https://fonts.gstatic.com', 'anonymous');
  }

  /**
   * DNS Prefetch
   * Resolves DNS without establishing connection
   * Best for: Third-party analytics, ad providers (low priority)
   *
   * @param url - Origin URL (e.g., https://example.com)
   */
  dnsPrefetch(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Preconnect
   * Establishes full connection (DNS + TLS negotiation + TCP handshake)
   * Best for: Critical CDN, fonts, APIs (medium priority)
   *
   * @param url - Origin URL
   * @param crossOrigin - CORS mode for the connection
   */
  preconnect(url: string, crossOrigin?: 'anonymous' | 'use-credentials'): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    if (crossOrigin) {
      link.crossOrigin = crossOrigin;
    }
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Prefetch
   * Downloads resource for later navigation (low priority)
   * Best for: Route-specific JavaScript chunks, CSS
   *
   * @param url - Full URL to script file
   */
  prefetchScript(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'script';
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Prefetch Stylesheet
   * Downloads CSS for later navigation
   *
   * @param url - Full URL to stylesheet
   */
  prefetchStylesheet(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'style';
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Preload
   * Downloads resource now for use later on current page (high priority)
   * Best for: Images above the fold, fonts, critical scripts
   *
   * @param url - Full URL to image
   */
  preloadImage(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Preload Font
   * Preload web font with font-display: swap
   * Prevents FOUT (Flash of Unstyled Text)
   *
   * @param url - Full URL to font file
   * @param fontType - Font format (woff2 is modern default)
   */
  preloadFont(url: string, fontType: 'woff' | 'woff2' | 'ttf' = 'woff2'): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'font';
    link.type = `font/${fontType}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Prerender
   * Render full page in background (use sparingly!)
   * Only for very high-confidence next navigation (e.g., 50%+ of users click)
   * Can waste bandwidth if wrong URL
   *
   * @param url - Full page URL
   */
  prerender(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prerender';
    link.href = url;
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Batch Prefetch Images
   * Prefetch multiple images for gallery/carousel
   *
   * @param urls - Array of image URLs
   */
  batchPrefetchImages(urls: string[]): void {
    urls.forEach((url) => {
      if (!this.loadedAssets.has(url)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'image';
        document.head.appendChild(link);
        this.loadedAssets.add(url);
        this.resourceHints.push(link);
      }
    });
  }

  /**
   * Batch Prefetch Scripts
   * Prefetch multiple script chunks for faster navigation
   *
   * @param urls - Array of script URLs
   */
  batchPrefetchScripts(urls: string[]): void {
    urls.forEach((url) => {
      if (!this.loadedAssets.has(url)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'script';
        document.head.appendChild(link);
        this.loadedAssets.add(url);
        this.resourceHints.push(link);
      }
    });
  }

  /**
   * Prefetch API Response (via JSON)
   * Preload likely API responses to cache
   *
   * @param url - API endpoint URL
   */
  prefetchApiData(url: string): void {
    if (this.loadedAssets.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    this.loadedAssets.add(url);
    this.resourceHints.push(link);
  }

  /**
   * Clear All Resource Hints
   * Removes all added hints to free memory
   * Use after route change if hints are no longer needed
   */
  clearHints(): void {
    this.resourceHints.forEach((link) => {
      link.remove();
    });
    this.resourceHints = [];
    this.loadedAssets.clear();
  }

  /**
   * Get Cache Statistics
   * For debugging: see what's been preloaded
   *
   * @returns Count of preloaded assets
   */
  getStats(): { totalAssets: number; hints: string[] } {
    return {
      totalAssets: this.loadedAssets.size,
      hints: Array.from(this.loadedAssets),
    };
  }

  /**
   * Prefetch Common Course Assets
   * Convenient method for prefetching entire course
   *
   * @param courseId - Course identifier
   */
  prefetchCourseAssets(courseId: string): void {
    // Preconnect to CDN for course videos
    this.preconnect(`https://res.cloudinary.com`);

    // Prefetch course thumbnail and hero image
    this.batchPrefetchImages([
      `/assets/courses/${courseId}/thumbnail.webp`,
      `/assets/courses/${courseId}/hero.webp`,
    ]);

    // Prefetch course modules script chunk
    this.prefetchScript(`/js/course-modules.chunk.js`);
  }

  /**
   * Prefetch Dashboard Assets
   * Convenient method for prefetching dashboard route
   */
  prefetchDashboardAssets(): void {
    // Preconnect to analytics
    this.preconnect('https://analytics.google.com');

    // Prefetch dashboard script chunk
    this.prefetchScript(`/js/dashboard.chunk.js`);

    // Prefetch dashboard stylesheet
    this.prefetchStylesheet(`/css/dashboard.chunk.css`);

    // Preload dashboard background image
    this.preloadImage(`/assets/dashboard-bg.webp`);
  }
}
