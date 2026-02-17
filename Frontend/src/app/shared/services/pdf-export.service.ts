import { Injectable } from '@angular/core';

/**
 * PDF Export Service
 *
 * Provides lazy-loaded PDF generation functionality using jsPDF.
 * jsPDF is only loaded when a component requests PDF generation,
 * reducing initial bundle size by ~100KB on routes that don't use PDF.
 *
 * Usage Example:
 * ```typescript
 * constructor(private pdfService: PdfExportService) {}
 *
 * async generateCertificate() {
 *   try {
 *     const { jsPDF } = await this.pdfService.loadPDF();
 *     const doc = new jsPDF();
 *     doc.text('Certificate of Completion', 105, 20, { align: 'center' });
 *     doc.save('certificate.pdf');
 *   } catch (error) {
 *     console.error('Failed to generate PDF:', error);
 *   }
 * }
 * ```
 *
 * PDF Configuration:
 * - Format: A4 (210 x 297 mm)
 * - Orientation: Portrait (default) or Landscape
 * - Unit: Millimeters (mm)
 * - Font: Helvetica (default)
 */
@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  private pdfModule: any = null;
  private loading: Promise<any> | null = null;

  /**
   * Lazily loads jsPDF library
   * Caches the module for subsequent calls
   * @returns Promise resolving to { jsPDF } module
   */
  async loadPDF(): Promise<any> {
    // Return cached instance if already loaded
    if (this.pdfModule) {
      return this.pdfModule;
    }

    // If already loading, return the existing promise
    if (this.loading) {
      return this.loading;
    }

    // Load jsPDF dynamically
    this.loading = import('jspdf').then((module) => {
      this.pdfModule = module;
      this.loading = null;
      return module;
    });

    return this.loading;
  }

  /**
   * Generate a simple PDF document
   * @param title - Document title
   * @param content - Array of text lines to add
   * @param filename - Output filename (without .pdf extension)
   */
  async generateSimplePDF(
    title: string,
    content: string[],
    filename: string
  ): Promise<void> {
    const { jsPDF } = await this.loadPDF();
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });

    // Add content
    doc.setFontSize(12);
    let yPosition = 40;
    const lineHeight = 10;
    const pageHeight = doc.internal.pageSize.height;
    const bottomMargin = 20;

    for (const line of content) {
      if (yPosition + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    }

    // Save the document
    doc.save(`${filename}.pdf`);
  }

  /**
   * Generate certificate PDF with custom styling
   * @param recipientName - Name of certificate recipient
   * @param courseName - Name of completed course
   * @param completionDate - Date of course completion
   * @param certificateNumber - Unique certificate identifier
   * @param filename - Output filename
   */
  async generateCertificate(
    recipientName: string,
    courseName: string,
    completionDate: string,
    certificateNumber: string,
    filename: string
  ): Promise<void> {
    const { jsPDF } = await this.loadPDF();
    const doc = new jsPDF();

    // Add decorative border
    doc.setDrawColor(0, 102, 204);
    doc.rect(10, 10, 190, 277, 'S');
    doc.rect(12, 12, 186, 273, 'S');

    // Title
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.text('Certificate of Completion', 105, 50, { align: 'center' });

    // Content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('This is to certify that', 105, 90, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(recipientName, 105, 110, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('has successfully completed the course', 105, 130, {
      align: 'center',
    });

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(courseName, 105, 150, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Certificate #: ${certificateNumber}`, 105, 200, {
      align: 'center',
    });
    doc.text(`Completion Date: ${completionDate}`, 105, 210, {
      align: 'center',
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('JLM E-Learning Platform', 105, 260, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 105, 270, { align: 'center' });

    // Save
    doc.save(`${filename}.pdf`);
  }

  /**
   * Clear cached instance (useful for testing or cleanup)
   */
  clearCache(): void {
    this.pdfModule = null;
    this.loading = null;
  }
}
