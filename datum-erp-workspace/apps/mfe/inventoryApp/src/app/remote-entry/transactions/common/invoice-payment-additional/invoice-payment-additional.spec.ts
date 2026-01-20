import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoicePaymentAdditional } from './invoice-payment-additional';

describe('InvoicePaymentAdditional', () => {
  let component: InvoicePaymentAdditional;
  let fixture: ComponentFixture<InvoicePaymentAdditional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePaymentAdditional],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePaymentAdditional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
