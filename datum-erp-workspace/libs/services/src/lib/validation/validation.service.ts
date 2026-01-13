import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


export class ValidationService{


  static integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
     
      if (value === null || value === '') return null;

      const isValid = /^-?\d+$/.test(value.toString());

      return !isValid ? { invalidInteger: true } : null;
    };
  }

  static stringValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const isValid = /^[A-Za-z\s-]+$/.test(value);
      return value && !isValid ? { invalidString: true } : null;
    };
  }

   static required(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value == null || control.value === '' ? { required: true } : null;
    };
  }
}