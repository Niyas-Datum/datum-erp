import { FormGroup } from "@angular/forms";

export class  ValidationBase{

       validateDate(form: FormGroup, controlName: string, value: string) {
                const control = form.get(controlName);
                if (!control) return;

                if (!this.isValidDate(value)) {
                    console.log('Invalid date format', value);
                    control.setErrors({ invalidDate: true });
                } else {
                    control.setErrors(null);
                }
        }

        isValidDate(value: string): boolean {
                return !isNaN(Date.parse(value));
        }


}