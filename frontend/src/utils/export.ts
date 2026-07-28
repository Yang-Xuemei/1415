import type { Transaction, Category } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function exportToCSV(transactions: Transaction[], categories: Category[], filename = 'transactions.csv') {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const header = ['日期', '类型', '分类', '金额', '备注'];
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? '收入' : '支出',
    categoryMap.get(t.category_id) || '未知',
    t.amount.toFixed(2),
    t.note || '',
  ]);

  const csvContent = [
    header.join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Add BOM for Excel compatibility with Chinese characters
  const bom = '﻿';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(
  element: HTMLElement,
  filename = 'report.pdf'
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
