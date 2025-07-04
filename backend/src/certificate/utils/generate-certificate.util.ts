/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';

export async function generateCertificate(
  res: Response,
  studentName: string,
  courseTitle: string,
  issueDate: Date,
) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe PDF to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${courseTitle}-certificate.pdf"`,
  );
  doc.pipe(res);

  // Design layout
  doc
    .fontSize(26)
    .text('Certificate of Completion', { align: 'center' })
    .moveDown(1.5);

  doc
    .fontSize(20)
    .text(`This certifies that`, { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(24)
    .font('Times-Bold')
    .text(studentName, { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(18)
    .font('Times-Roman')
    .text(`has successfully completed the course`, { align: 'center' })
    .moveDown(0.5);

  doc.fontSize(22).text(courseTitle, { align: 'center' }).moveDown(2);

  doc
    .fontSize(16)
    .text(`Issued on: ${issueDate.toDateString()}`, { align: 'center' });

  // End PDF
  doc.end();
}
