import { DestroyRef, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AlertService, DataSharingService, FormToolbarService } from '@org/services';

export  class SeviceInjectBase {
  public alertService = inject(AlertService);
  public dataSharingService = inject(DataSharingService);
  public formToolbarService = inject(FormToolbarService);
  public destroyRef = inject(DestroyRef);

}


