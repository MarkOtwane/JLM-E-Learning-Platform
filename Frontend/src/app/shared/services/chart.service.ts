import { Injectable } from '@angular/core';

/**
 * Chart Service
 *
 * Provides lazy-loaded ApexCharts functionality.
 * ApexCharts is only loaded when a component requests it, reducing initial bundle size.
 * When not used on a page, ApexCharts (~200KB) is not included in the bundle.
 *
 * Usage Example:
 * ```typescript
 * constructor(private chartService: ChartService) {}
 *
 * async ngOnInit() {
 *   try {
 *     const ApexCharts = await this.chartService.loadCharts();
 *     const options: ApexCharts.ApexOptions = { ... };
 *     const chart = new ApexCharts(el, options);
 *     chart.render();
 *   } catch (error) {
 *     console.error('Failed to load charts:', error);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ChartService {
  private chartInstance: any = null;
  private loading: Promise<any> | null = null;

  /**
   * Lazily loads ApexCharts library
   * Caches the module for subsequent calls
   * @returns Promise resolving to ApexCharts module
   */
  async loadCharts(): Promise<any> {
    // Return cached instance if already loaded
    if (this.chartInstance) {
      return this.chartInstance;
    }

    // If already loading, return the existing promise
    if (this.loading) {
      return this.loading;
    }

    // Load ApexCharts dynamically
    this.loading = import('apexcharts').then((module) => {
      this.chartInstance = module;
      this.loading = null;
      return module;
    });

    return this.loading;
  }

  /**
   * Clear cached instance (useful for testing or cleanup)
   */
  clearCache(): void {
    this.chartInstance = null;
    this.loading = null;
  }
}
