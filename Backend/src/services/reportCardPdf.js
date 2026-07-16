/**
 * Report Card PDF Service — CBC Education System
 *
 * Generates professional A4 report card PDFs with:
 * - School logo and details
 * - Student information
 * - Subject performance table
 * - Grades and competency levels
 * - Teacher and principal comments
 * - Rankings (class, term, school)
 * - Attendance summary
 * - Signature and verification areas
 *
 * Uses pdfkit for server-side PDF generation.
 */

const PDFDocument = require('pdfkit');
const crypto = require('crypto');

/**
 * Generate a professional report card PDF buffer.
 * @param {object} report - Full report card data (from getFullReportCard)
 * @returns {Promise<Buffer>} PDF as a buffer
 */
async function generateReportCardPdf(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
          Title: `Report Card - ${report.first_name} ${report.last_name}`,
          Author: 'CBC Education System',
          Subject: 'CBC Competency-Based Report Card',
          Keywords: 'CBC, report card, education, assessment',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── Colors ──
      const PRIMARY = '#1e40af';
      const SECONDARY = '#3b82f6';
      const BG_LIGHT = '#f8fafc';
      const BORDER = '#e2e8f0';
      const TEXT_DARK = '#1e293b';
      const TEXT_MUTED = '#64748b';
      const GRADE_COLORS = { EE: '#10B981', AE: '#3B82F6', ME: '#F59E0B', BE: '#EF4444' };

      // ── Page dimensions ──
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      let y = doc.page.margins.top;

      // ══════════════════════════════════════════════════════════════
      // HEADER
      // ══════════════════════════════════════════════════════════════

      // School logo if available
      if (report.logo_url) {
        try {
          doc.image(report.logo_url, doc.page.margins.left, y, {
            width: 60,
            height: 60,
          });
        } catch {
          // Silently skip if logo can't be loaded
        }
      }

      // School name and header
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text(report.school_name || 'School Name', doc.page.margins.left, y, {
          align: 'center',
          width: pageWidth,
        });

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(TEXT_MUTED)
        .text(report.school_address || '', {
          align: 'center',
          width: pageWidth,
        });

      y = doc.y + 4;

      // Separator line
      doc.moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + pageWidth, y)
        .strokeColor(PRIMARY)
        .lineWidth(2)
        .stroke();

      y += 10;

      // Report title
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(TEXT_DARK)
        .text('CBC COMPETENCY-BASED REPORT CARD', {
          align: 'center',
          width: pageWidth,
        });

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(TEXT_MUTED)
        .text(`${report.term_name || ''} - ${report.academic_year_name || ''}`, {
          align: 'center',
          width: pageWidth,
        });

      y = doc.y + 8;

      // ══════════════════════════════════════════════════════════════
      // STUDENT INFORMATION
      // ══════════════════════════════════════════════════════════════

      // Info box background
      doc.rect(doc.page.margins.left, y, pageWidth, 65)
        .fillColor(BG_LIGHT)
        .fill();

      doc.fillColor(TEXT_DARK);

      const infoX = doc.page.margins.left + 8;
      const infoY = y + 6;
      const colWidth = pageWidth / 2 - 16;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Student Information', infoX, infoY, { width: pageWidth - 16, underline: true });

      doc.fontSize(9).font('Helvetica');
      const leftInfo = [
        `Name: ${report.first_name || ''} ${report.last_name || ''}`,
        `Admission No: ${report.admission_number || ''}`,
        `Class: ${report.class_name || ''}`,
        `Grade Level: ${report.grade_level || ''}`,
      ];

      const rightInfo = [
        `Gender: ${report.gender || ''}`,
        `Date of Birth: ${report.date_of_birth ? new Date(report.date_of_birth).toLocaleDateString() : ''}`,
        `Term: ${report.term_name || ''}`,
        `Academic Year: ${report.academic_year_name || ''}`,
      ];

      doc.text(leftInfo.join('\n'), infoX, infoY + 14, { width: colWidth });
      doc.text(rightInfo.join('\n'), infoX + colWidth + 16, infoY + 14, { width: colWidth });

      y = infoY + 65 + 8;

      // ══════════════════════════════════════════════════════════════
      // OVERALL PERFORMANCE SUMMARY
      // ══════════════════════════════════════════════════════════════

      // Score badge
      const gradeColor = GRADE_COLORS[report.overall_grade] || '#6B7280';
      doc.roundedRect(doc.page.margins.left + pageWidth - 120, infoY + 14, 110, 40, 5)
        .fillColor(gradeColor)
        .fill();

      doc.fillColor('#FFFFFF')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(`${report.average_score?.toFixed(1) || '0.0'}%`, doc.page.margins.left + pageWidth - 115, infoY + 16, {
          width: 100,
          align: 'center',
        });

      doc.fontSize(8)
        .font('Helvetica')
        .text(`Grade: ${report.overall_grade || 'N/A'}`, doc.page.margins.left + pageWidth - 115, infoY + 38, {
          width: 100,
          align: 'center',
        });

      // ══════════════════════════════════════════════════════════════
      // SUBJECT PERFORMANCE TABLE
      // ══════════════════════════════════════════════════════════════

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text('Subject Performance', doc.page.margins.left, y);

      y += 4;

      // Table header
      const tableTop = y + 12;
      const tableWidth = pageWidth;
      const cols = [
        { x: 0, width: tableWidth * 0.30, align: 'left' },
        { x: tableWidth * 0.30, width: tableWidth * 0.15, align: 'center' },
        { x: tableWidth * 0.45, width: tableWidth * 0.10, align: 'center' },
        { x: tableWidth * 0.55, width: tableWidth * 0.25, align: 'center' },
        { x: tableWidth * 0.80, width: tableWidth * 0.20, align: 'left' },
      ];

      // Header bg
      doc.rect(doc.page.margins.left, tableTop, tableWidth, 18)
        .fillColor(PRIMARY)
        .fill();

      doc.fillColor('#FFFFFF')
        .fontSize(8)
        .font('Helvetica-Bold');

      const headers = ['Subject', 'Score', 'Grade', 'Competency', 'Remarks'];
      headers.forEach((h, i) => {
        doc.text(h, doc.page.margins.left + cols[i].x, tableTop + 3, {
          width: cols[i].width,
          align: cols[i].align,
        });
      });

      y = tableTop + 18;

      // Table rows
      const subjects = report.subjects || [];
      subjects.forEach((subj, idx) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : BG_LIGHT;
        doc.rect(doc.page.margins.left, y, tableWidth, 18)
          .fillColor(rowBg)
          .fill();

        doc.fillColor(TEXT_DARK)
          .fontSize(8)
          .font('Helvetica');

        doc.text(subj.subject_name || '', doc.page.margins.left + cols[0].x, y + 3, {
          width: cols[0].width, align: cols[0].align,
        });
        doc.text(String(subj.total_score ?? ''), doc.page.margins.left + cols[1].x, y + 3, {
          width: cols[1].width, align: cols[1].align,
        });

        // Grade badge
        const subjGradeColor = GRADE_COLORS[subj.grade_code] || '#6B7280';
        doc.roundedRect(doc.page.margins.left + cols[2].x + 2, y + 2, cols[2].width - 4, 14, 3)
          .fillColor(subjGradeColor)
          .fill();

        doc.fillColor('#FFFFFF')
          .fontSize(7)
          .font('Helvetica-Bold')
          .text(subj.grade_code || '', doc.page.margins.left + cols[2].x, y + 3, {
            width: cols[2].width, align: 'center',
          });

        doc.fillColor(TEXT_DARK)
          .fontSize(7)
          .font('Helvetica')
          .text(subj.competency_level || '', doc.page.margins.left + cols[3].x, y + 3, {
            width: cols[3].width, align: cols[3].align,
          });

        const remark = subj.teacher_remarks || '';
        doc.fontSize(7)
          .text(remark.length > 40 ? remark.substring(0, 38) + '...' : remark,
            doc.page.margins.left + cols[4].x, y + 3, {
              width: cols[4].width, align: cols[4].align,
            });

        y += 18;
      });

      // Table bottom line
      doc.moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + tableWidth, y)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      y += 8;

      // ══════════════════════════════════════════════════════════════
      // SUMMARY STATISTICS
      // ══════════════════════════════════════════════════════════════

      if (y > doc.page.height - 200) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text('Performance Summary', doc.page.margins.left, y);

      y += 16;

      // Stats boxes
      const stats = [
        { label: 'Average Score', value: `${report.average_score?.toFixed(1) || '0.0'}%` },
        { label: 'Overall Grade', value: report.overall_grade || 'N/A' },
        { label: 'Subjects', value: String(report.subject_count || 0) },
        { label: 'Class Rank', value: report.rankings?.classRank ? `#${report.rankings.classRank}` : 'N/A' },
        { label: 'Term Rank', value: report.rankings?.termRank || 'N/A' },
        { label: 'School Rank', value: report.rankings?.schoolRank ? `#${report.rankings.schoolRank}` : 'N/A' },
      ];

      const boxW = (pageWidth - 24) / 3;
      const boxH = 38;

      stats.forEach((stat, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const sx = doc.page.margins.left + col * (boxW + 12);
        const sy = y + row * (boxH + 8);

        doc.roundedRect(sx, sy, boxW, boxH, 4)
          .fillColor(BG_LIGHT)
          .fill()
          .strokeColor(BORDER)
          .lineWidth(1)
          .stroke();

        doc.fillColor(TEXT_MUTED)
          .fontSize(7)
          .font('Helvetica')
          .text(stat.label, sx + 6, sy + 4, { width: boxW - 12, align: 'center' });

        doc.fillColor(TEXT_DARK)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(stat.value, sx + 6, sy + 16, { width: boxW - 12, align: 'center' });
      });

      y += 2 * (boxH + 8) + 12;

      // ══════════════════════════════════════════════════════════════
      // COMMENTS SECTION
      // ══════════════════════════════════════════════════════════════

      if (y > doc.page.height - 160) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text('Comments', doc.page.margins.left, y);

      y += 16;

      // Teacher's comment
      doc.roundedRect(doc.page.margins.left, y, pageWidth, 50, 3)
        .fillColor(BG_LIGHT)
        .fill();

      doc.fillColor(TEXT_DARK)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text("Class Teacher's Comments:", doc.page.margins.left + 6, y + 4);

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(TEXT_MUTED)
        .text(report.teacher_comments || 'No comments.', doc.page.margins.left + 6, y + 18, {
          width: pageWidth - 12,
        });

      y += 56;

      // Principal's comment
      doc.roundedRect(doc.page.margins.left, y, pageWidth, 50, 3)
        .fillColor(BG_LIGHT)
        .fill();

      doc.fillColor(TEXT_DARK)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text("Principal's Comments:", doc.page.margins.left + 6, y + 4);

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(TEXT_MUTED)
        .text(report.principal_comments || 'No comments.', doc.page.margins.left + 6, y + 18, {
          width: pageWidth - 12,
        });

      y += 56;

      // ══════════════════════════════════════════════════════════════
      // ATTENDANCE & PROMOTION
      // ══════════════════════════════════════════════════════════════

      if (y > doc.page.height - 140) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      // Attendance
      const attSummary = report.attendance_summary || {};
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text('Attendance Summary', doc.page.margins.left, y);

      y += 14;

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(TEXT_DARK)
        .text(`Present: ${attSummary.present || 0} days   |   Absent: ${attSummary.absent || 0} days   |   Total: ${(attSummary.present || 0) + (attSummary.absent || 0)} days`,
          doc.page.margins.left, y, { width: pageWidth });

      y += 16;

      if (report.promotion_decision) {
        doc.fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(SECONDARY)
          .text(`Promotion Decision: ${report.promotion_decision.toUpperCase()}`, doc.page.margins.left, y, {
            width: pageWidth,
          });

        if (report.promotion_notes) {
          y += 14;
          doc.fontSize(8)
            .font('Helvetica')
            .fillColor(TEXT_MUTED)
            .text(report.promotion_notes, doc.page.margins.left, y, { width: pageWidth });
        }
      }

      y += 30;

      // ══════════════════════════════════════════════════════════════
      // SIGNATURE & VERIFICATION
      // ══════════════════════════════════════════════════════════════

      if (y > doc.page.height - 100) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      // Signature lines
      const sigY = doc.page.height - doc.page.margins.bottom - 80;
      if (y < sigY) y = sigY;

      const sigWidth = (pageWidth - 40) / 2;

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(TEXT_DARK);

      // Class Teacher signature
      doc.text('Class Teacher:', doc.page.margins.left, y, { width: sigWidth });
      y += 20;
      doc.moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + sigWidth, y)
        .strokeColor(BORDER)
        .stroke();
      doc.fontSize(7)
        .fillColor(TEXT_MUTED)
        .text('Signature & Date', doc.page.margins.left, y + 2, { width: sigWidth, align: 'center' });

      // Principal signature
      doc.fontSize(9)
        .fillColor(TEXT_DARK)
        .font('Helvetica')
        .text('Principal:', doc.page.margins.left + sigWidth + 40, y - 20, { width: sigWidth });
      doc.moveTo(doc.page.margins.left + sigWidth + 40, y)
        .lineTo(doc.page.margins.left + 2 * sigWidth + 40, y)
        .strokeColor(BORDER)
        .stroke();
      doc.fontSize(7)
        .fillColor(TEXT_MUTED)
        .text('Signature & Date', doc.page.margins.left + sigWidth + 40, y + 2, { width: sigWidth, align: 'center' });

      y += 22;

      // School stamp area
      doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(PRIMARY)
        .text('School Stamp', doc.page.margins.left + pageWidth - 80, y, {
          width: 80,
          align: 'center',
        });

      doc.rect(doc.page.margins.left + pageWidth - 85, y + 10, 70, 50)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();

      y += 65;

      // ══════════════════════════════════════════════════════════════
      // FOOTER / VERIFICATION
      // ══════════════════════════════════════════════════════════════

      const footerY = doc.page.height - doc.page.margins.bottom - 25;

      // Separator
      doc.moveTo(doc.page.margins.left, footerY)
        .lineTo(doc.page.margins.left + pageWidth, footerY)
        .strokeColor(BORDER)
        .lineWidth(0.5)
        .stroke();

      doc.fontSize(6)
        .font('Helvetica')
        .fillColor(TEXT_MUTED)
        .text(
          `Generated by CBC Education System | ${doc.options.info.Title} | ${new Date().toLocaleDateString()}` +
          (report.is_finalized ? ' | FINALIZED' : ' | DRAFT'),
          doc.page.margins.left, footerY + 4,
          { width: pageWidth - 80, align: 'left' }
        );

      // QR-like verification code (hex hash)
      const verifyCode = crypto
        .createHash('sha256')
        .update(`${report.id}-${report.learner_id}-${report.average_score}`)
        .digest('hex')
        .substring(0, 12)
        .toUpperCase();

      doc.fontSize(6)
        .font('Courier-Bold')
        .fillColor(TEXT_MUTED)
        .text(`V:${verifyCode}`, doc.page.margins.left + pageWidth - 70, footerY + 4, {
          width: 70,
          align: 'right',
        });

      // Finalize
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReportCardPdf };
