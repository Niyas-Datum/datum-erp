import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PdfColumn, PdfReportData } from '../model/pdfgeneration.model';


@Injectable({ providedIn: 'root' })
export class PdfGenerationService {

  private ITEMS_PER_PAGE = 25;

  preview(data: PdfReportData): void {
    const html = this.buildHtml(data);
    this.print(html);
  }

  // ---------------- HTML ----------------

  private buildHtml(data: PdfReportData): string {

    const pages = this.paginate(data.rows);
    const totals = data.showTotals ? this.calculateTotals(data) : null;

    return `
      <html>
      <head>
        <style>
          body { font-family: Arial; font-size: 12px }
          table { width: 100%; border-collapse: collapse }
          th, td { border: 1px solid #000; padding: 4px }
          th { background: #f2f2f2 }
          .header { text-align: center; font-weight: bold }
          .right { text-align: right }
          .center { text-align: center }
          .bold { font-weight: bold }
        </style>
      </head>
      <body>
        ${pages.map((rows, i) =>
          this.buildPage(
            data,
            rows,
            i + 1,
            i === pages.length - 1,
            totals
          )
        ).join('')}
      </body>
      </html>
    `;
  }

  private buildPage(
    data: PdfReportData,
    rows: any[],
    pageNo: number,
    isLastPage: boolean,
    totals: { debit: number; credit: number } | null
  ): string {

    return `
      <div class="page">
        <div class="header">
          ${data.companyName}<br>
          ${data.address}<br><br>
          <b>${data.pageName}</b><br>
          Period: ${data.fromDate} - ${data.toDate}<br>
          Page ${pageNo}
        </div>

        <table>
          <thead>
            <tr>
              ${data.columns.map(c =>
                `<th class="${this.getAlign(c)}">${c.header}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                ${data.columns.map(c =>
                  `<td class="${this.getAlign(c)}">
                    ${r[c.field] ?? ''}
                  </td>`
                ).join('')}
              </tr>
            `).join('')}

            ${isLastPage && totals ? `
              <tr class="bold">
                <td colspan="${data.columns.length - 2}" class="right">Total</td>
                <td class="right">${totals.debit.toFixed(2)}</td>
                <td class="right">${totals.credit.toFixed(2)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    `;
  }

  // ---------------- Helpers ----------------

  private getAlign(col: PdfColumn): string {
    return col.align === 'right' ? 'right'
         : col.align === 'center' ? 'center'
         : '';
  }

  private paginate(rows: any[]): any[][] {
    const pages: any[][] = [];
    for (let i = 0; i < rows.length; i += this.ITEMS_PER_PAGE) {
      pages.push(rows.slice(i, i + this.ITEMS_PER_PAGE));
    }
    return pages;
  }

  private calculateTotals(data: PdfReportData): { debit: number; credit: number } {
    return data.rows.reduce(
      (t, r) => {
        t.debit += Number(r.debit ?? r.Debit ?? 0);
        t.credit += Number(r.credit ?? r.Credit ?? 0);
        return t;
      },
      { debit: 0, credit: 0 }
    );
  }

  private print(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();

    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  }
}
