import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceHeader } from './invoice-header';

describe('InvoiceHeader', () => {
  let component: InvoiceHeader;
  let fixture: ComponentFixture<InvoiceHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
