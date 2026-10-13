/**
 * Client-side document export utilities for DOCX and PDF (Clean Printable HTML / Word formats)
 */

export const exportToDocx = (title: string, contentHtml: string, filename?: string) => {
  const safeFilename = (filename || `${title.replace(/[^a-zA-Z0-9а-яА-ЯөӨүҮ_-]/g, '_')}`).slice(0, 50) + '.doc';

  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body {
    font-family: 'Calibri', 'Times New Roman', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #111827;
    margin: 20mm;
  }
  h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px; margin-top: 20px; }
  h2 { font-size: 14pt; font-weight: bold; color: #1e40af; margin-top: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
  h3 { font-size: 12pt; font-weight: bold; color: #1f2937; margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
  th, td { border: 1px solid #94a3b8; padding: 6px 10px; text-align: left; }
  th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
  .badge { display: inline-block; padding: 2px 8px; font-size: 9pt; font-weight: bold; background: #e0f2fe; color: #0369a1; border-radius: 4px; }
  .box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 25px;">
    <p style="font-size: 10pt; color: #64748b; margin: 0;">МОНГОЛ УЛСЫН БОЛОВСРОЛЫН САЛБАР · ЕРӨНХИЙ БОЛОВСРОЛЫН СУРГУУЛЬ</p>
    <p style="font-size: 11pt; font-weight: bold; color: #334155; margin: 2px 0;">Газарзүйн Цахим Сургалтын Хөтөлбөр ба Даалгаврын Нэгдсэн Портал</p>
    <h1 style="margin: 10px 0; font-size: 16pt;">${title}</h1>
    <p style="font-size: 9pt; color: #64748b;">Үүсгэсэн огноо: ${new Date().toLocaleDateString('mn-MN')} · AI сургалтын туслах систем</p>
  </div>
  ${contentHtml}
  <hr style="margin-top: 40px; border: 0; border-top: 1px solid #cbd5e1;" />
  <p style="font-size: 9pt; color: #94a3b8; text-align: center;">Газарзүйн хичээлийн дидактик төлөвлөлтийн цахим систем · Багш, сурагчдад зориулав</p>
</body>
</html>`;

  const blob = new Blob([header], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToPdf = (title: string, contentHtml: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Хэвлэх цонх нээгдэх боломжгүй байна. Popup blocker-оо шалгана уу.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
      padding: 10px;
    }
    h1 { font-size: 18pt; font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px; margin-top: 15px; }
    h2 { font-size: 14pt; font-weight: bold; color: #1e40af; margin-top: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
    h3 { font-size: 12pt; font-weight: bold; color: #1f2937; margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
    .badge { display: inline-block; padding: 2px 8px; font-size: 9pt; font-weight: bold; background: #e0f2fe; color: #0369a1; border-radius: 4px; }
    .box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
    ul, ol { margin: 8px 0; padding-left: 24px; }
    li { margin-bottom: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 20px;">
    <p style="font-size: 9pt; color: #64748b; margin: 0; letter-spacing: 0.5px;">МОНГОЛ УЛСЫН БОЛОВСРОЛЫН САЛБАР · ЕРӨНХИЙ БОЛОВСРОЛЫН СУРГУУЛЬ</p>
    <p style="font-size: 11pt; font-weight: bold; color: #1e293b; margin: 2px 0;">Газарзүйн Цахим Сургалтын Хөтөлбөр ба Даалгаврын Нэгдсэн Портал</p>
    <h1 style="margin: 8px 0; font-size: 16pt;">${title}</h1>
    <p style="font-size: 9pt; color: #64748b;">Үүсгэсэн огноо: ${new Date().toLocaleDateString('mn-MN')}</p>
  </div>
  ${contentHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
};
