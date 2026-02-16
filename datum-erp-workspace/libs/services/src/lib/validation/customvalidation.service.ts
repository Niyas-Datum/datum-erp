import { Injectable } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';      
@Injectable({ providedIn: 'root' })
export class CustomValidationService {
}
 
export function validCompanyName(control: AbstractControl): ValidationErrors | null {
  // Company name: letters, numbers, spaces, &, -, ., and '
  const companyNameRegex = /^[a-zA-Z0-9\s&\-.']{2,100}$/;
  const value = (control.value || '').trim();
  const errors: ValidationErrors = {};
 
  if (!value) {
    errors['required'] = true;
  } else if (!companyNameRegex.test(value)) {
    errors['invalidCompanyName'] = true;
  }
 
  return Object.keys(errors).length ? errors : null;
}
 
export function validPhoneNumber(control: AbstractControl): ValidationErrors | null {
  const phoneRegex = /^[0-9]{10}$/;
  const value = (control.value || '').trim();
  const errors: ValidationErrors = {};
  // return phoneRegex.test(control.value || '') ? null : { invalidPhone: true };
  if (!value) {
    errors['required'] = true;
  } else if (!phoneRegex.test(value)) {
    errors['invalidPhoneNumber'] = true;
  }
   return Object.keys(errors).length ? errors : null;
 
}
 
export function validEmail(control: AbstractControl): ValidationErrors | null {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const value = (control.value || '').trim();
  const errors: ValidationErrors = {};
   if (!value) {
    errors['required'] = true;
  } else if (!emailRegex.test(value)) {
    errors['invalidEmail'] = true;
  }
   return Object.keys(errors).length ? errors : null;
}

export function integerOnly(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return null; // allow empty unless required
  }

  return Number.isInteger(Number(value)) ? null : { integerOnly: true };
}

export function decimalOnly(control: AbstractControl): ValidationErrors | null {
  const value = (control.value || '').toString().trim();

  // allow empty → let required validator handle mandatory
  if (!value) return null;

  // Decimal regex: 123 | 123.45 | 0.5 | 10.0
  const decimalRegex = /^\d+(\.\d+)?$/;

  if (!decimalRegex.test(value)) {
    return { decimalOnly: true };
  }

  return null;
}
 