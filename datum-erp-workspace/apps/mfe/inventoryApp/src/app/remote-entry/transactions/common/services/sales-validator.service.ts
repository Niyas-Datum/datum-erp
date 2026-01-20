/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

export interface ValidationError {
  /** High-level bucket: 'header' | 'additional' | 'footer' | 'items' */
  scope: 'header' | 'additional' | 'footer' | 'items';
  /** A stable field key you can use for focusing / mapping (e.g. 'customer', 'orderno', 'rows[3].qty') */
  field: string;
  /** Human-friendly message */
  message: string;
  /** Optional: row index when scope === 'items' */
  rowIndex?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Convenience: first error for quick toast/focus */
  firstError?: ValidationError;
}

@Injectable({ providedIn: 'root' })
export class SalesValidatorService {
  /**
   * Main entry—call this in your Save flow.
   * @param headerForm  this.invoiceHeader?.salesForm
   * @param footerForm  this.invoiceFooter?.salesForm
   * @param additionalForm optional: if you split extra fields into another form
   * @param items array from commonService.tempItemFillDetails()
   */
  validateBeforeSave(
    headerForm: FormGroup | null | undefined,
    footerForm: FormGroup | null | undefined,
    additionalForm: FormGroup | null | undefined,
    items: any[] | null | undefined
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Defensive
    const header = headerForm?.getRawValue?.() ?? {};
    const footer = footerForm?.getRawValue?.() ?? {};
    const additional = additionalForm?.getRawValue?.() ?? {};
    const rows = Array.isArray(items) ? items : [];

    // 1) Header checks (based on your example controls)
    this.validateHeader(headerForm, header, errors);

    // 2) Additional details checks (your example marked some as required)
    this.validateAdditional(additionalForm, additional, errors);

    // 3) Footer/summary checks (numbers sanity)
    this.validateFooter(footerForm, footer, errors);

    // 4) Lines/items checks
    this.validateItems(rows, errors);

    const firstError = errors[0];
    return { valid: errors.length === 0, errors, firstError };
  }

  // --------------------- Header ---------------------
  private validateHeader(headerForm: FormGroup | null | undefined, header: any, errors: ValidationError[]) {
    // Debug logging
    
    // Required: purchasedate, customer, warehouse
    // Project is optional
    this.required(header?.purchasedate, 'header', 'purchasedate', 'Purchase Date is required.', errors);
    this.required(header?.customer, 'header', 'customer', 'Customer is required.', errors);
    this.required(header?.warehouse, 'header', 'warehouse', 'Warehouse is required.', errors);
    // this.required(header?.project, 'header', 'project', 'Project is required.', errors);

    // Optional but common: voucher no/name can be disabled/auto
    // If you need validity enforcement on disabled controls:
    this.touchIfInvalid(headerForm);
  }

  // --------------------- Additional ---------------------
  private validateAdditional(additionalForm: FormGroup | null | undefined, add: any, errors: ValidationError[]) {
    // Your example: orderno, partyaddress, creditperiod, vehicleno are marked required
   // this.required(add?.orderno, 'additional', 'orderno', 'Order No. is required.', errors);
   // this.required(add?.partyaddress, 'additional', 'partyaddress', 'Party Address is required.', errors);
  //  this.required(add?.creditperiod, 'additional', 'creditperiod', 'Credit Period is required.', errors);
    //this.required(add?.vehicleno, 'additional', 'vehicleno', 'Vehicle No. is required.', errors);

    // Optional: if invoicedate provided, must be a valid date
    if (add?.invoicedate && !this.isValidDateLike(add.invoicedate)) {
      errors.push({ scope: 'additional', field: 'invoicedate', message: 'Invoice Date is invalid.' });
    }

    this.touchIfInvalid(additionalForm);
  }

  // --------------------- Footer / Summary ---------------------
  private validateFooter(footerForm: FormGroup | null | undefined, footer: any, errors: ValidationError[]) {
    // Net Amount and Grand Total are auto-calculated, so only validate if they exist and are negative
    // Don't fail validation if they're empty/zero
    if (footer?.netamount !== null && footer?.netamount !== undefined && footer?.netamount !== '' && footer?.netamount !== 0) {
      const netAmount = this.num(footer.netamount);
      if (isFinite(netAmount) && !isNaN(netAmount) && netAmount < 0) {
        errors.push({ scope: 'footer', field: 'netamount', message: 'Net Amount cannot be negative.' });
      }
    }

    if (footer?.grandtotal !== null && footer?.grandtotal !== undefined && footer?.grandtotal !== '' && footer?.grandtotal !== 0) {
      const grandTotal = this.num(footer.grandtotal);
      if (isFinite(grandTotal) && !isNaN(grandTotal) && grandTotal < 0) {
        errors.push({ scope: 'footer', field: 'grandtotal', message: 'Grand Total cannot be negative.' });
      }
    }

    // Optional: if duedate provided, must be a valid date
    if (footer?.duedate && !this.isValidDateLike(footer.duedate)) {
      errors.push({ scope: 'footer', field: 'duedate', message: 'Due Date is invalid.' });
    }

    // If paytype is required by your flow, enforce it here:
    // this.required(footer?.paytype, 'footer', 'paytype', 'Pay Type is required.', errors);

    this.touchIfInvalid(footerForm);
  }

  // --------------------- Items / Lines ---------------------
  private validateItems(rows: any[], errors: ValidationError[]) {
    // Debug logging
    
    // At least one non-empty line
    const validLines = rows.filter(r => (r?.itemCode ?? '').toString().trim() !== '');
    
    if (validLines.length === 0) {
      errors.push({ scope: 'items', field: 'rows', message: 'At least one item line is required.' });
      return;
    }

    validLines.forEach((row, i) => {
      const rowIdx = i; // you may want original rowId; we keep index for messages

      // itemCode
      if (!row?.itemCode || `${row.itemCode}`.trim() === '') {
        errors.push({ scope: 'items', field: `rows[${rowIdx}].itemCode`, message: `Row ${rowIdx + 1}: Item Code is required.`, rowIndex: rowIdx });
      }

      // qty > 0
      const qty = this.num(row?.qty);
      if (!(qty > 0)) {
        errors.push({ scope: 'items', field: `rows[${rowIdx}].qty`, message: `Row ${rowIdx + 1}: Quantity must be greater than 0.`, rowIndex: rowIdx });
      }

      // unit required (string or object)
      const unit = row?.unit;
      if (!unit || (typeof unit === 'string' && unit.trim() === '')) {
        errors.push({ scope: 'items', field: `rows[${rowIdx}].unit`, message: `Row ${rowIdx + 1}: Unit is required.`, rowIndex: rowIdx });
      }

      // rate >= 0
      const rate = this.num(row?.rate);
      if (!(rate >= 0)) {
        errors.push({ scope: 'items', field: `rows[${rowIdx}].rate`, message: `Row ${rowIdx + 1}: Rate must be 0 or more.`, rowIndex: rowIdx });
      }

      // taxPerc within 0..100 (if provided)
      if (row?.taxPerc !== undefined && row?.taxPerc !== null) {
        const tp = this.num(row.taxPerc);
        if (isNaN(tp) || tp < 0 || tp > 100) {
          errors.push({ scope: 'items', field: `rows[${rowIdx}].taxPerc`, message: `Row ${rowIdx + 1}: Tax % must be between 0 and 100.`, rowIndex: rowIdx });
        }
      }

      // amount / totals must be finite (don’t enforce math here—just sanity)
      ['amount', 'taxValue', 'totalAmount'].forEach(k => {
        const v = this.num(row?.[k]);
        if (!isFinite(v) || isNaN(v)) {
          errors.push({ scope: 'items', field: `rows[${rowIdx}].${k}`, message: `Row ${rowIdx + 1}: ${this.pretty(k)} must be a number.`, rowIndex: rowIdx });
        }
      });
    });
  }

  // --------------------- Helpers ---------------------
  private required(v: any, scope: ValidationError['scope'], field: string, message: string, errors: ValidationError[]) {
    // Check if value is empty
    if (v === null || v === undefined) {
      errors.push({ scope, field, message });
      return;
    }

    // Handle string values
    if (typeof v === 'string' && v.trim() === '') {
      errors.push({ scope, field, message });
      return;
    }

    // Handle object values (e.g., Syncfusion dropdown returns {text: 'value', value: 'id'})
    if (typeof v === 'object') {
      // If it's an empty object
      if (Object.keys(v).length === 0) {
        errors.push({ scope, field, message });
        return;
      }
      
      // If it has a 'value' or 'id' property, check if it's empty
      if (v.hasOwnProperty('value') || v.hasOwnProperty('id')) {
        const val = v.value || v.id;
        if (val === null || val === undefined || val === '') {
          errors.push({ scope, field, message });
          return;
        }
      }
      
      // If it has a 'text' or 'name' property, check if it's empty
      if (v.hasOwnProperty('text') || v.hasOwnProperty('name')) {
        const text = v.text || v.name;
        if (text === null || text === undefined || text === '') {
          errors.push({ scope, field, message });
          return;
        }
      }
    }

    // If we reach here, the value is not empty
  }

  private numberNonNegative(v: any, scope: ValidationError['scope'], field: string, message: string, errors: ValidationError[]) {
    const n = this.num(v);
    if (!isFinite(n) || isNaN(n) || n < 0) {
      errors.push({ scope, field, message });
    }
  }

  private num(v: any): number {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '') return Number(v);
    return NaN;
  }

  private isValidDateLike(v: any): boolean {
    if (v instanceof Date) return !isNaN(v.getTime());
    if (typeof v === 'string') {
      // accept ISO, or dd/MM/yyyy from your example (convert tolerance)
      const iso = new Date(v);
      if (!isNaN(iso.getTime())) return true;

      const parts = v.split('/');
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts.map(p => +p);
        const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
        return dt.getFullYear() === yyyy && dt.getMonth() === (mm - 1) && dt.getDate() === dd;
      }
    }
    return false;
  }

  private pretty(k: string): string {
    switch (k) {
      case 'taxValue': return 'Tax';
      case 'totalAmount': return 'Total';
      default: return k.charAt(0).toUpperCase() + k.slice(1);
    }
  }

  /** Marks controls as touched so errors can show in UI if you have mat/hint validation messages */
  private touchIfInvalid(group?: FormGroup | null) {
    if (!group) return;
    this.markAllAsTouched(group);
  }

  private markAllAsTouched(control: AbstractControl) {
    if ('controls' in control) {
      const asAny: any = control;
      for (const key of Object.keys(asAny.controls)) {
        const child: AbstractControl = asAny.controls[key];
        this.markAllAsTouched(child);
      }
    }
    control.markAsTouched({ onlySelf: true });
  }
}
