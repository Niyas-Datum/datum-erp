import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceFooter } from './invoice-footer';

describe('InvoiceFooter', () => {
  let component: InvoiceFooter;
  let fixture: ComponentFixture<InvoiceFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceFooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
