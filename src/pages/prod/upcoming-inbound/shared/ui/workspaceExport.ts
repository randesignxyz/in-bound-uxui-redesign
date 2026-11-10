export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type ExportRows = (string | number | undefined | null)[][];

const cellText = (value: ExportRows[number][number]) => String(value ?? '');

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  bytes.forEach(byte => {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  const write16 = (view: DataView, at: number, value: number) => view.setUint16(at, value, true);
  const write32 = (view: DataView, at: number, value: number) => view.setUint32(at, value, true);
  files.forEach(file => {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write32(localView, 14, crc);
    write32(localView, 18, data.length);
    write32(localView, 22, data.length);
    write16(localView, 26, name.length);
    local.set(name, 30);
    parts.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write32(centralView, 16, crc);
    write32(centralView, 20, data.length);
    write32(centralView, 24, data.length);
    write16(centralView, 28, name.length);
    write32(centralView, 42, offset);
    central.set(name, 46);
    directory.push(central);
    offset += local.length + data.length;
  });
  const directorySize = directory.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 8, files.length);
  write16(endView, 10, files.length);
  write32(endView, 12, directorySize);
  write32(endView, 16, offset);
  return new Blob([...parts, ...directory, end].map(part => new Uint8Array(part).buffer), {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function excelBlob(rows: ExportRows) {
  const sheetRows = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
    const column = String.fromCharCode(65 + columnIndex % 26);
    const numeric = typeof value === 'number' && Number.isFinite(value);
    const safeText = cellText(value);
    // Store external text as strings, including values Excel could interpret as formulas.
    return `<c r="${column}${rowIndex + 1}"${numeric ? '' : ' t="inlineStr"'}>${numeric ? `<v>${value}</v>` : `<is><t xml:space="preserve">${xmlEscape(safeText)}</t></is>`}</c>`;
  }).join('')}</row>`).join('');
  return zip([
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', content: `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>` },
  ]);
}

function pdfLines(rows: ExportRows, chunkSize: number) {
  const headers = rows[0] || [];
  const lines: string[] = [];
  rows.slice(1).forEach((row, index) => {
    lines.push(`Record ${index + 1}`);
    row.forEach((value, column) => {
      const label = cellText(headers[column]) || `Column ${column + 1}`;
      const characters = Array.from(`${label}: ${cellText(value)}`);
      for (let start = 0; start < characters.length; start += chunkSize) {
        lines.push(characters.slice(start, start + chunkSize).join(''));
      }
    });
    lines.push('');
  });
  return lines.length ? lines : ['No records'];
}

function pdfBlob(filename: string, rows: ExportRows) {
  if ([filename, ...rows.flat().map(cellText)].some(value => /[^\x00-\x7f]/.test(value))) {
    const rendered = renderedPdfBlob(filename, rows);
    if (rendered) return rendered;
  }
  const clean = (value: string) => value.normalize('NFKD').replace(/[^\x20-\x7e]/g, '?').replace(/[\\()]/g, '\\$&');
  const lines = pdfLines(rows, 125);
  const pageRows = 44;
  const pages = Math.max(1, Math.ceil(lines.length / pageRows));
  const objects: string[] = [];
  const add = (value: string) => { objects.push(value); return objects.length; };
  const catalog = add('');
  const pageTree = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds: number[] = [];
  for (let page = 0; page < pages; page += 1) {
    const visible = lines.slice(page * pageRows, (page + 1) * pageRows);
    const commands = [`BT /F1 14 Tf 36 555 Td (${clean(filename)}) Tj ET`];
    visible.forEach((line, rowIndex) => {
      commands.push(`BT /F1 ${line.startsWith('Record ') ? 9 : 8} Tf 36 ${530 - rowIndex * 11} Td (${clean(line)}) Tj ET`);
    });
    const stream = commands.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pageTree} 0 R >>`;
  objects[pageTree - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function renderedPdfBlob(filename: string, rows: ExportRows): Blob | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;
  canvas.width = 1684;
  canvas.height = 1190;
  const lines = pdfLines(rows, 85);
  const pageRows = 39;
  const pages = Math.max(1, Math.ceil(lines.length / pageRows));
  const images: { bytes: string; width: number; height: number }[] = [];
  for (let page = 0; page < pages; page += 1) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111827';
    context.font = 'bold 28px Arial, sans-serif';
    context.fillText(filename, 72, 74);
    const visible = lines.slice(page * pageRows, (page + 1) * pageRows);
    visible.forEach((line, rowIndex) => {
      const top = 105 + rowIndex * 26;
      if (line.startsWith('Record ')) {
        context.fillStyle = '#f1f5f9';
        context.fillRect(72, top - 21, 1540, 26);
      }
      context.font = `${line.startsWith('Record ') ? 'bold ' : ''}17px Arial, sans-serif`;
      context.fillStyle = '#111827';
      context.fillText(line, 78, top, 1530);
    });
    const encoded = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
    images.push({ bytes: atob(encoded), width: canvas.width, height: canvas.height });
  }
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  const objects: string[] = ['', ''];
  images.forEach(image => {
    const imageId = objects.length + 1;
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n${image.bytes}\nendstream`);
    const content = 'q 842 0 0 595 0 0 cm /Im0 Do Q';
    const contentId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  });
  const pageIds = images.map((_, index) => 5 + index * 3);
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([Uint8Array.from(pdf, character => character.charCodeAt(0)).buffer], { type: 'application/pdf' });
}

export function exportWorkspace(filename: string, rows: ExportRows, format: ExportFormat) {
  if (format === 'excel') return download(`${filename}.xlsx`, excelBlob(rows));
  if (format === 'pdf') return download(`${filename}.pdf`, pdfBlob(filename, rows));
  const csv = rows.map(row => row.map(value => {
    const valueText = cellText(value);
    const safe = /^[\s]*[=+@-]/.test(valueText) ? `'${valueText}` : valueText;
    return `"${safe.replace(/"/g, '""')}"`;
  }).join(',')).join('\r\n');
  return download(`${filename}.csv`, new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
}
