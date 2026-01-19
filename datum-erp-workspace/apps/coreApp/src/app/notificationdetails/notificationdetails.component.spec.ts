import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationdetailsComponent } from './notificationdetails.component';

describe('NotificationdetailsComponent', () => {
  let component: NotificationdetailsComponent;
  let fixture: ComponentFixture<NotificationdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationdetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
