import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderMobileView } from './app-Header-MobileView';

describe('AppHeaderMobileView', () => {
  let component: AppHeaderMobileView;
  let fixture: ComponentFixture<AppHeaderMobileView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderMobileView],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderMobileView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
});
