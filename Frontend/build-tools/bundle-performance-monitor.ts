/**
 * Build Performance Monitor
 *
 * Tracks and reports on bundle size metrics across builds.
 * Generates performance trends and alerts on size regressions.
 *
 * Usage:
 * - Automatically runs after production builds
 * - Stores metrics in .bundlemetrics.json
 * - Creates reports in /reports/bundle-metrics.html
 */

import * as fs from 'fs';
import * as path from 'path';

interface BundleMetric {
  timestamp: string;
  date: string;
  bundleSize: number;
  bundleSizeKB: number;
  bundleSizeMB: number;
  mainChunks: ChunkMetric[];
  totalSize: number;
  passedBudget: boolean;
}

interface ChunkMetric {
  name: string;
  size: number;
  sizeKB: number;
}

const CONFIG = {
  FRONTEND_DIR: 'Frontend',
  DIST_PATH: 'dist/Frontend/browser',
  METRICS_FILE: '.bundlemetrics.json',
  SIZE_LIMIT_BYTES: 512000, // 500KB
  SIZE_WARN_BYTES: 409600, // 400KB
};

class BundlePerformanceMonitor {
  private metricsFile: string;
  private metrics: BundleMetric[] = [];

  constructor() {
    this.metricsFile = path.join(CONFIG.FRONTEND_DIR, CONFIG.METRICS_FILE);
    this.loadMetrics();
  }

  /**
   * Load existing metrics from file
   */
  private loadMetrics(): void {
    if (fs.existsSync(this.metricsFile)) {
      const data = fs.readFileSync(this.metricsFile, 'utf-8');
      this.metrics = JSON.parse(data);
    }
  }

  /**
   * Save metrics to file
   */
  private saveMetrics(): void {
    fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
  }

  /**
   * Collect bundle size metrics
   */
  async collectMetrics(): Promise<BundleMetric> {
    const distPath = path.join(CONFIG.FRONTEND_DIR, CONFIG.DIST_PATH);

    if (!fs.existsSync(distPath)) {
      throw new Error(`Distribution path not found: ${distPath}`);
    }

    const files = fs.readdirSync(distPath).filter((f) => f.endsWith('.js'));

    if (files.length === 0) {
      throw new Error(`No JavaScript files found in ${distPath}`);
    }

    // Find main bundle
    const mainBundle = files.find((f) => f.startsWith('main'));
    if (!mainBundle) {
      throw new Error('Main bundle not found');
    }

    const mainBundlePath = path.join(distPath, mainBundle);
    const bundleSize = fs.statSync(mainBundlePath).size;

    // Collect all chunks
    const chunks: ChunkMetric[] = files
      .map((file) => {
        const filePath = path.join(distPath, file);
        const size = fs.statSync(filePath).size;
        return {
          name: file,
          size,
          sizeKB: Math.round(size / 1024),
        };
      })
      .sort((a, b) => b.size - a.size)
      .slice(0, 10); // Top 10 chunks

    const totalSize = files.reduce((sum, file) => {
      const filePath = path.join(distPath, file);
      return sum + fs.statSync(filePath).size;
    }, 0);

    const metric: BundleMetric = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      bundleSize,
      bundleSizeKB: Math.round(bundleSize / 1024),
      bundleSizeMB: parseFloat((bundleSize / 1024 / 1024).toFixed(2)),
      mainChunks: chunks,
      totalSize,
      passedBudget: bundleSize <= CONFIG.SIZE_LIMIT_BYTES,
    };

    return metric;
  }

  /**
   * Record a new metric
   */
  async recordMetric(): Promise<BundleMetric> {
    const metric = await this.collectMetrics();
    this.metrics.push(metric);
    this.saveMetrics();

    return metric;
  }

  /**
   * Get metrics for the last N builds
   */
  getRecentMetrics(count: number = 10): BundleMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * Check for size regression
   */
  detectRegression(currentMetric: BundleMetric): {
    hasRegression: boolean;
    increase: number;
    percentIncrease: number;
    previousSize: number;
  } | null {
    if (this.metrics.length < 2) {
      return null;
    }

    const previousMetric = this.metrics[this.metrics.length - 2];
    const increase = currentMetric.bundleSize - previousMetric.bundleSize;
    const percentIncrease = (increase / previousMetric.bundleSize) * 100;

    // Flag as regression if > 5% increase
    const hasRegression = percentIncrease > 5;

    return {
      hasRegression,
      increase,
      percentIncrease: parseFloat(percentIncrease.toFixed(2)),
      previousSize: previousMetric.bundleSize,
    };
  }

  /**
   * Generate HTML report
   */
  generateReport(): string {
    const recent = this.getRecentMetrics(20);

    const sizes = recent.map((m) => m.bundleSizeKB.toString()).join(',');
    const labels = recent
      .map((m) => new Date(m.timestamp).toLocaleDateString())
      .join(',');

    const tableRows = recent
      .reverse()
      .map(
        (m) => `
      <tr>
        <td>${m.date}</td>
        <td>${m.bundleSize.toLocaleString()} bytes</td>
        <td><strong>${m.bundleSizeKB} KB</strong></td>
        <td>${m.bundleSizeMB} MB</td>
        <td>${m.passedBudget ? '✓ Pass' : '✗ Fail'}</td>
      </tr>
    `,
      )
      .join('');

    const topChunks = recent[recent.length - 1]?.mainChunks || [];
    const chunksHtml = topChunks
      .map(
        (c) => `
      <tr>
        <td>${c.name}</td>
        <td>${c.size.toLocaleString()} bytes</td>
        <td><strong>${c.sizeKB} KB</strong></td>
      </tr>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Performance Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 30px; }
        h2 { color: #555; margin: 30px 0 15px; font-size: 18px; }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 24px; font-weight: bold; color: #0066cc; margin: 10px 0; }
        .stat-unit { font-size: 12px; color: #666; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }
        tr:hover { background: #f8f9fa; }
        canvas { max-height: 300px; }
        .chart-container { position: relative; height: 300px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bundle Performance Report</h1>
        <p style="color: #666; margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>

        <div class="card">
            <h2>Current Metrics</h2>
            <div class="metric">
                <div class="stat">
                    <div class="stat-label">Initial Bundle</div>
                    <div class="stat-value">${recent[recent.length - 1]?.bundleSize.toLocaleString()} <span style="font-size: 14px;">bytes</span></div>
                    <div class="stat-unit"><strong>${recent[recent.length - 1]?.bundleSizeKB} KB</strong></div>
                </div>
                <div class="stat">
                    <div class="stat-label">Size Limit</div>
                    <div class="stat-value">500 <span style="font-size: 14px;">KB</span></div>
                    <div class="stat-unit">Status: <span class="${recent[recent.length - 1]?.passedBudget ? 'pass' : 'fail'}">
                        ${recent[recent.length - 1]?.passedBudget ? '✓ Pass' : '✗ Fail'}
                    </span></div>
                </div>
                <div class="stat">
                    <div class="stat-label">Total Assets</div>
                    <div class="stat-value">${(recent[recent.length - 1]?.totalSize / 1024 / 1024).toFixed(1)} <span style="font-size: 14px;">MB</span></div>
                    <div class="stat-unit">All chunks combined</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Bundle Size Trend</h2>
            <div class="chart-container">
                <canvas id="trendsChart"></canvas>
            </div>
        </div>

        <div class="card">
            <h2>Top 10 Chunks</h2>
            <table>
                <thead>
                    <tr>
                        <th>Filename</th>
                        <th>Bytes</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    ${chunksHtml}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>Build History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Bytes</th>
                        <th>Size</th>
                        <th>MB</th>
                        <th>Budget Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('trendsChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: [${labels}],
                datasets: [{
                    label: 'Bundle Size (KB)',
                    data: [${sizes}],
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 500,
                        ticks: { callback: v => v + ' KB' }
                    }
                }
            }
        });
    </script>
</body>
</html>
    `;
  }

  /**
   * Print formatted console output
   */
  printSummary(metric: BundleMetric): void {
    const regression = this.detectRegression(metric);

    console.log('\n' + '='.repeat(50));
    console.log('Bundle Performance Summary');
    console.log('='.repeat(50));
    console.log(`Initial Bundle: ${metric.bundleSize.toLocaleString()} bytes`);
    console.log(`Size: ${metric.bundleSizeKB} KB (${metric.bundleSizeMB} MB)`);
    console.log(`Budget Status: ${metric.passedBudget ? '✓ PASS' : '✗ FAIL'}`);

    if (regression) {
      console.log(`\nRegression Detection:`);
      console.log(
        `  Previous: ${regression.previousSize.toLocaleString()} bytes`,
      );
      console.log(`  Increase: +${regression.increase.toLocaleString()} bytes`);
      console.log(`  Percent: ${regression.percentIncrease}%`);

      if (regression.hasRegression) {
        console.log(`  Status: ⚠️  REGRESSION DETECTED (>5%)`);
      }
    }

    console.log('\nTop Chunks:');
    metric.mainChunks.forEach((chunk) => {
      console.log(`  ${chunk.name}: ${chunk.sizeKB} KB`);
    });

    console.log('='.repeat(50) + '\n');
  }
}

// Export for use
export { BundleMetric, BundlePerformanceMonitor, ChunkMetric };

// Run if executed directly
if (require.main === module) {
  const monitor = new BundlePerformanceMonitor();

  monitor
    .recordMetric()
    .then((metric) => {
      monitor.printSummary(metric);

      // Generate report
      const report = monitor.generateReport();
      const reportPath = path.join(
        CONFIG.FRONTEND_DIR,
        'bundle-metrics-report.html',
      );
      fs.writeFileSync(reportPath, report);
      console.log(`Report saved: ${reportPath}`);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
