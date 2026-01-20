import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentpopupComponent } from './paymentpopup.component';

describe('PaymentpopupComponent', () => {
  let component: PaymentpopupComponent;
  let fixture: ComponentFixture<PaymentpopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentpopupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


