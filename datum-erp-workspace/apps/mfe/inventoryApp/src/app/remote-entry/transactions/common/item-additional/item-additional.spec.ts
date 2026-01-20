import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemAdditional } from './item-additional';

describe('ItemAdditional', () => {
  let component: ItemAdditional;
  let fixture: ComponentFixture<ItemAdditional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemAdditional],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemAdditional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
