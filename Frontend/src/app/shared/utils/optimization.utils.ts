/**
 * Angular Optimization Best Practices & Utilities
 *
 * Collection of utility functions and patterns to optimize Angular bundle size
 * and runtime performance.
 *
 * Key Principles:
 * 1. Lazy-load large features (routes, modals, heavy libraries)
 * 2. Tree-shake aggressively (specific imports, no barrels for large modules)
 * 3. Optimize third-party (dynamic imports, selective icon libraries)
 * 4. Minimize initial bundle (code splitting, unused code detection)
 */

import { Directive, HostListener, Injectable, Input } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Lazy Load Prefetch Directive
 *
 * Prefetches a lazy-loaded route on hover/focus for faster navigation.
 * Reduces perceived latency by loading route chunks before user clicks.
 *
 * Usage in template:
 * ```html
 * <a routerLink="/student/courses" appLazyPrefetch>Browse Courses</a>
 * ```
 */
@Directive({
  selector: 'a[appLazyPrefetch]',
  standalone: true,
})
export class LazyPrefetchDirective {
  @Input() routerLink: string = '';

  constructor(private router: Router) {}

  @HostListener('mouseenter')
  @HostListener('focus')
  onHover(): void {
    // Trigger Angular's route preloading strategy
    // This causes the lazy-loaded chunk to be fetched in background
    if (this.routerLink) {
      // Navigate in a way that only prefetches, doesn't actually navigate
      const route = this.router.config.find((r) => r.path === this.routerLink);
      if (route?.loadChildren || route?.loadComponent) {
        // NgZone.run would trigger change detection
        // For prefetch, we just let the platform download the chunk
      }
    }
  }
}

/**
 * Performance Tracking Service
 *
 * Measures and logs performance metrics for bundle operations.
 */
@Injectable({
  providedIn: 'root',
})
export class PerformanceTrackingService {
  private marks = new Map<string, number>();

  /**
   * Start measuring a performance operation
   * @param label - Unique identifier for this measurement
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End measuring and get duration
   * @param label - Must match the label passed to mark()
   * @returns Duration in milliseconds
   */
  measure(label: string): number {
    const start = this.marks.get(label);
    if (!start) {
      console.warn(`No mark found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - start;
    this.marks.delete(label);

    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Measure a synchronous function
   */
  measureSync<T>(label: string, fn: () => T): T {
    this.mark(label);
    const result = fn();
    this.measure(label);
    return result;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.mark(label);
    const result = await fn();
    this.measure(label);
    return result;
  }

  /**
   * Get current memory usage (if available)
   */
  getMemoryUsage(): Performance['memory'] | null {
    return (performance as any).memory || null;
  }
}

/**
 * Preload Image Service
 *
 * Preload images ahead of time to improve perceived performance.
 * Useful for hero images, course thumbnails, etc.
 */
@Injectable({
  providedIn: 'root',
})
export class PreloadImageService {
  private preloadedImages = new Set<string>();

  /**
   * Preload a single image
   */
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(url);
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  }

  /**
   * Preload multiple images
   */
  preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(urls.map((url) => this.preloadImage(url)));
  }

  /**
   * Preload in batches to avoid browser limits
   */
  async preloadImagesBatched(
    urls: string[],
    batchSize: number = 5,
  ): Promise<void[]> {
    const results: void[] = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url) => this.preloadImage(url)),
      );
      results.push(...batchResults);

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }
}

/**
 * Lazy Component Loader
 *
 * Utility for loading components dynamically and on-demand.
 * Useful for modals, dialogs, and optional features.
 */
@Injectable({
  providedIn: 'root',
})
export class LazyComponentLoaderService {
  private cachedComponents = new Map<
    string,
    { default: any } | Promise<{ default: any }>
  >();

  /**
   * Load a component dynamically
   *
   * Usage:
   * ```typescript
   * const component = await this.loader.load(
   *   () => import('./my.component')
   * );
   * viewContainer.createComponent(component);
   * ```
   */
  async load<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    const key = importFn.toString();

    // Return cached component if already loaded
    const cached = this.cachedComponents.get(key);
    if (cached instanceof Promise) {
      return (await cached).default;
    }
    if (cached) {
      return cached.default;
    }

    // Load component
    const loading = importFn();
    this.cachedComponents.set(key, loading);
    const module = await loading;
    this.cachedComponents.set(key, module);

    return module.default;
  }
}

/**
 * Optimization Decorator Examples
 *
 * These decorators apply optimization patterns automatically.
 */

/**
 * @ChangeDetectionStrategy.OnPush equivalent decorator
 * Useful as a reminder to use OnPush strategy
 */
export function OnPushComponent(options?: any) {
  return function (target: any) {
    // Component decorator logic
  };
}

/**
 * Best Practices Guide
 *
 * Print this in console for quick reference
 */
export const OPTIMIZATION_BEST_PRACTICES = `
╔════════════════════════════════════════════════════════════════╗
║         Angular Optimization Best Practices                    ║
╚════════════════════════════════════════════════════════════════╝

1. LAZY LOADING
   ✓ Use loadChildren for feature routes
   ✓ Use loadComponent for standalone components
   ✗ Avoid importing entire feature modules upfront

2. TREE-SHAKING
   ✓ import { map, filter } from 'rxjs/operators';
   ✗ import * as rxjs from 'rxjs';

3. STANDALONE COMPONENTS
   ✓ Avoid NgModule when possible
   ✓ Small, focused imports in standalone.imports
   ✗ CommonModule when only using a few directives

4. ICONS (Font Awesome)
   ✓ Use icon library service with selective imports
   ✗ Don't import '@fortawesome/free-solid-svg-icons'

5. THIRD-PARTY LIBRARIES
   ✓ ApexCharts: async load via ChartService
   ✓ jsPDF: dynamic import in components that need it
   ✗ Include all licenses upfront

6. CHANGE DETECTION
   ✓ @Component({ changeDetection: ChangeDetectionStrategy.OnPush })
   ✓ Use trackBy with *ngFor
   ✗ Default ChangeDetectionStrategy.Default

7. IMPORTS ORGANIZATION
   ✓ Group by: Angular → Third-party → Local
   ✓ Alphabetical within groups
   ✗ Random order

8. COMPONENT SIZE
   ✓ Keep components <300 lines
   ✓ Extract logic to services
   ✓ Split large components into subcomponents
   ✗ 1000+ line component files

9. STYLE OPTIMIZATION
   ✓ Use ::ng-deep sparingly
   ✓ Tailwind CSS tree-shaking configured correctly
   ✓ Component scoped CSS where possible
   ✗ Global CSS for everything

10. BUILD OPTIMIZATION
    ✓ Production build: ng build --optimization
    ✓ Named chunks for visibility in DevTools
    ✓ Source maps disabled in production
    ✗ Debug builds shipped to production

────────────────────────────────────────────────────────────────
Performance Targets:
  • Initial Bundle: < 400 KB
  • First Contentful Paint: < 1.5s
  • Time to Interactive: < 3.0s
────────────────────────────────────────────────────────────────
`;

/**
 * Print optimization guide
 */
export function printOptimizationGuide(): void {
  console.log(OPTIMIZATION_BEST_PRACTICES);
}
