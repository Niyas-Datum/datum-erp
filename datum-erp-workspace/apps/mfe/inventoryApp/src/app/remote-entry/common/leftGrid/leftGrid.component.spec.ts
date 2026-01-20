import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeftGridComponent } from './leftGrid.component';

describe('LeftGridComponent', () => {
  let component: LeftGridComponent;
  let fixture: ComponentFixture<LeftGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeftGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
