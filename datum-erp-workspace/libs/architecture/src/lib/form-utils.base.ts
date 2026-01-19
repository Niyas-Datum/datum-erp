import { FormGroup, FormControl, Validators } from '@angular/forms';

export class formUtilBase {
  thisForm: FormGroup = new FormGroup({});

  resetForm(form: FormGroup) {
    form.reset();
  }

  public FormInitialize() {
    console.log('form init working');
  }
}
