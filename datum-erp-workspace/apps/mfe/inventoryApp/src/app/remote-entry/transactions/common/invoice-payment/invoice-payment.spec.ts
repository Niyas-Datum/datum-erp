import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoicePayment } from './invoice-payment';

describe('InvoicePayment', () => {
  let component: InvoicePayment;
  let fixture: ComponentFixture<InvoicePayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePayment],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoicePayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
