/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @angular-eslint/prefer-inject */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy } from '@angular/core';

import { EndpointConstant } from '@org/constants';
import { BaseService } from '@org/services';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
interface PrintTemplate {
  header: string;
  item: string;
  footer: string;
  html: string;
}

interface TransactionData {
  transaction: {
    fillTransactions: any;
    fillInvTransItems: any[];
    fillAdditionals: any;
  };
}

interface Totals {
  amount: number;
  tax: number;
  total: number;
  discount: number;
  totalBeforeVat: number;
  amountInWords: string;
  amountInArabicWords: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfGenerationService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private base64QR = '';
  private readonly ITEMS_PER_PAGE = 25;

  constructor(private readonly baseService: BaseService) {}

  // ========== Main Entry Point ==========

  generatePdf(
    transactionId?: number,
    pageId?: number,
    action?: string,
    address?: string,
    isMobile = false,
    isTab = false
  ): void {
    if (!transactionId || !pageId) {
      console.error('❌ Transaction ID and Page ID required');
      return;
    }

    forkJoin({
      template: this.baseService.get(`${EndpointConstant.FETCHPRINTTEMPLETEBYID}${pageId}`),
      transaction: this.baseService.get(`${EndpointConstant.FILLPURCHASEBYID}${transactionId}&pageId=${pageId}`),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => this.handleResponse(response, address, isMobile, isTab),
        error: (err) => console.error('❌ PDF Generation Error:', err),
      });
  }

  // ========== Response Handler ==========

  private handleResponse(response: any, address?: string, isMobile = false, isTab = false): void {
    const template: PrintTemplate = response.template?.data;
    const data: TransactionData = response.transaction?.data;

    if (!template || !data) {
      console.error('❌ Missing template or transaction data');
      return;
    }

    this.processPDF(template, data, address, isMobile, isTab);
  }

  // ========== PDF Processing ==========

  private async processPDF(
    template: PrintTemplate,
    data: TransactionData,
    address?: string,
    isMobile = false,
    isTab = false
  ): Promise<void> {
    const { fillTransactions: transaction, fillInvTransItems: items, fillAdditionals: additionals } = data.transaction;

    this.base64QR = transaction?.invoiceQr ?? '';
    const tranId = transaction.transactionNo;

    // Generate components
    const qrCode = await this.createQRCode(transaction, items);
    const totals = this.calculateTotals(items, transaction);
    const html = this.buildHTML(template, transaction, items, additionals, totals, qrCode, address);

    // Output PDF
    isMobile || isTab ? this.downloadPDF(html, tranId) : this.printPDF(html);
  }

  // ========== QR Code Generation ==========

  private async createQRCode(transaction: any, items: any[]): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const qrData = this.base64QR || JSON.stringify({
          invoiceNo: transaction.transactionNo,
          date: transaction.date,
          customer: transaction.accountName,
        total: items.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
        });

      await QRCode.toCanvas(canvas, qrData, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 100,
        color: { dark: '#000000', light: '#ffffff' }
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('QR Code Error:', error);
      return '';
    }
  }

  // ========== Calculations ==========

  private calculateTotals(items: any[], transaction: any): Totals {
    const amount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = items.reduce((sum, item) => sum + (item.taxValue || 0), 0);
    const total = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const discount = transaction.discount || 0;

    return {
      amount,
      tax,
      total,
      discount,
      totalBeforeVat: amount - discount,
      amountInWords: this.toWords(total),
      amountInArabicWords: this.toArabicWords(total),
    };
  }

  // ========== HTML Building ==========

  private buildHTML(
    template: PrintTemplate,
    transaction: any,
    items: any[],
    additionals: any,
    totals: Totals,
    qrCode: string,
    address?: string
  ): string {
    const totalPages = Math.ceil(items.length / this.ITEMS_PER_PAGE);
    const pages = Array.from({ length: totalPages }, (_, i) => this.buildPage(
      template, transaction, items, additionals, totals, qrCode, address, i, totalPages
    )).join('');

    return `
      <!DOCTYPE html>
      <html lang="ar-SA" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ضريبية - VAT Invoice</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          ${template.html}
          
         
        </style>
      </head>
      <body>${pages}</body>
      </html>
    `;
  }

  private buildPage(
    template: PrintTemplate,
    transaction: any,
    items: any[],
    additionals: any,
    totals: Totals,
    qrCode: string,
    address: string | undefined,
    pageIndex: number,
    totalPages: number
  ): string {
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === totalPages - 1;
    const pageItems = items.slice(pageIndex * this.ITEMS_PER_PAGE, (pageIndex + 1) * this.ITEMS_PER_PAGE);

    return `
      <div class="page">
        ${isFirst ? this.buildHeader(template.header, transaction, additionals, address) : ''}
        ${this.buildItemsTable(template.item, pageItems, pageIndex * this.ITEMS_PER_PAGE)}
        ${isLast ? this.buildFooter(template.footer, totals, qrCode) : ''}
      </div>
    `;
  }

  private buildHeader(template: string, transaction: any, additionals: any, address?: string): string {
    const processedTemplate = this.fixArabicPlaceholders(template);
    return this.replacePlaceholders(processedTemplate, {
      accountCode: transaction?.accountCode || '',
      accountName: transaction?.accountName || 'Cash Customer',
      address: address || transaction?.address || '',
      vatNo: additionals?.vatNo || transaction?.vatNo || '',
      invoiceDate: transaction?.date ? this.formatDate(transaction.date) : '',
      transactionNo: transaction?.transactionNo || '',
      paymentType: transaction?.paymentType || 'CREDIT',
      dueDate: transaction?.dueDate ? this.formatDate(transaction.dueDate) : '-',
    });
  }

  private buildItemsTable(template: string, items: any[], startIndex: number): string {
    // Build proper table structure with API-provided item template
    const rows = items.map((item, i) => this.buildItemRow(template, item, startIndex + i + 1)).join('');
    
    // Wrap rows in proper table structure
    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>SI No</th>
            <th>Item Code</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>U/PRICE</th>
            <th>DISC</th>
            <th>NET Amt.</th>
            <th>VAT VALUE</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  private buildItemRow(template: string, item: any, siNo: number): string {
    return this.replacePlaceholders(template, {
      siNo: siNo.toString(),
      itemCode: item?.itemCode || '-',
      itemName: item?.itemName || item?.arabicName || '-',
      qty: item?.qty?.toString() || '0',
      unit: item?.unit || 'PCS',
      rate: item?.rate?.toFixed(2) || '0.00',
      discount: item?.discount?.toString() || '0',
      amount: item?.amount?.toFixed(2) || '0.00',
      taxValue: item?.taxValue?.toFixed(2) || '0.00',
      totalAmount: item?.totalAmount?.toFixed(2) || '0.00',
    });
  }

  private buildFooter(template: string, totals: Totals, qrCode: string): string {
    const processedTemplate = this.fixArabicPlaceholders(template);
    return this.replacePlaceholders(processedTemplate, {
      totalWithoutTax: totals.amount.toFixed(2),
      discount: totals.discount.toFixed(2),
      totalBeforeVat: totals.totalBeforeVat.toFixed(2),
      taxAmount: totals.tax.toFixed(2),
      extraDiscount: '0.00',
      netAmount: totals.total.toFixed(2),
      amountInWords: totals.amountInWords,
      amountInArabicWords: totals.amountInArabicWords,
      qrCodeDataURL: qrCode,
      footerLogoUrl: '', // Will be provided by API
    });
  }

  private replacePlaceholders(template: string, data: Record<string, string>): string {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      result = result.split(`{{${key}}}`).join(value);
    });
    return result;
  }

  private fixArabicPlaceholders(template: string): string {
    // Replace Arabic placeholder characters with proper Arabic text
    let result = template;
    
    // Replace specific patterns found in the API templates
    result = result.replace(/\?\?\?\?\?\? \?\?\?\?\?\?/g, 'فاتورة ضريبية');
    result = result.replace(/\?\?\?\?\?\?\?\? \?\?\?\? \?\?\?\?\?\?/g, 'الإجمالي بدون ضريبة');
    result = result.replace(/\?\?\?\?\?/g, 'خصم');
    result = result.replace(/\?\?\?\?\?\?\?\? \?\?\? \?\?\?\?\?\? \?\?\?\?\?\?\?\?/g, 'الإجمالي قبل الضريبة');
    result = result.replace(/\?\?\?\?\?\? \?\?\?\?\?\?\?/g, 'ضريبة القيمة المضافة');
    result = result.replace(/\?\?\? \?\?\?\?\?/g, 'خصم إضافي');
    
    // Handle the duplicate pattern for "المبلغ الصافي" by using a more specific context
    result = result.replace(/Net Amount[\s\S]*?\?\?\?\?\?\? \?\?\?\?\?\?/g, (match) => {
      return match.replace(/\?\?\?\?\?\? \?\?\?\?\?\?/g, 'المبلغ الصافي');
    });

    return result;
  }

  // ========== PDF Output ==========

  private downloadPDF(html: string, fileName: string): void {
    const iframe = this.createIframe();
    this.writeToIframe(iframe, html);

    setTimeout(() => {
      html2canvas(iframe.contentWindow!.document.body, {
        scale: (navigator as any).deviceMemory < 2 ? 2 : 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      }).then((canvas) => {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 210, 297, '', 'FAST');
        
        try {
          pdf.save(`invoice-${fileName}.pdf`);
        } catch {
          this.fallbackDownload(pdf, fileName);
        }

        document.body.removeChild(iframe);
      });
    }, 1000);
  }

  private printPDF(html: string): void {
    const iframe = this.createIframe();
    this.writeToIframe(iframe, html);

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }

  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;top:-10000px;width:210mm;height:297mm';
    document.body.appendChild(iframe);
    return iframe;
  }

  private writeToIframe(iframe: HTMLIFrameElement, html: string): void {
    const doc = iframe.contentWindow?.document;
    doc?.open();
    doc?.write(html);
    doc?.close();
  }

  private fallbackDownload(pdf: jsPDF, fileName: string): void {
            const blob = pdf.output('blob');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
    link.download = `invoice-${fileName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }

  // ========== Utilities ==========

  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private toWords(total: number): string {
    const riyals = Math.floor(total);
    const halalas = Math.round((total % 1) * 100);
    return `${this.numberToWords(riyals)} Riyals and ${halalas} Halalas Only`;
  }

  private toArabicWords(total: number): string {
    const riyals = Math.floor(total);
    const halalas = Math.round((total % 1) * 100);
    return `${this.numberToArabicWords(riyals)} ريال و ${halalas} هللة فقط`;
  }

  private numberToWords(num: number): string {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convert = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    };

    const parts = [];
    if (num >= 1000000000) parts.push(convert(Math.floor(num / 1000000000)) + ' Billion');
    if (num >= 1000000) parts.push(convert(Math.floor((num % 1000000000) / 1000000)) + ' Million');
    if (num >= 1000) parts.push(convert(Math.floor((num % 1000000) / 1000)) + ' Thousand');
    if (num % 1000) parts.push(convert(num % 1000));

    return parts.filter(p => p).join(' ').trim();
  }

  private numberToArabicWords(num: number): string {
    if (num === 0) return 'صفر';

    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

    const convert = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 100) {
        const digit = n % 10;
        const ten = Math.floor(n / 10);
        return digit ? ones[digit] + ' و' + tens[ten] : tens[ten];
      }
      return hundreds[Math.floor(n / 100)] + (n % 100 ? ' و' + convert(n % 100) : '');
    };

    const parts = [];
    if (num >= 1000000000) parts.push(convert(Math.floor(num / 1000000000)) + ' مليار');
    if (num >= 1000000) parts.push(convert(Math.floor((num % 1000000000) / 1000000)) + ' مليون');
    if (num >= 1000) parts.push(convert(Math.floor((num % 1000000) / 1000)) + ' ألف');
    if (num % 1000) parts.push(convert(num % 1000));

    return parts.filter(p => p).join(' ').trim();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
