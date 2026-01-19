import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationrecieverComponent } from './notificationreciever.component';

describe('NotificationrecieverComponent', () => {
  let component: NotificationrecieverComponent;
  let fixture: ComponentFixture<NotificationrecieverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationrecieverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationrecieverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
