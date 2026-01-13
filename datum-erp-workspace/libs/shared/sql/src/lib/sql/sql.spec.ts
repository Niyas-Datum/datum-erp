import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sql } from './sql';

describe('Sql', () => {
  let component: Sql;
  let fixture: ComponentFixture<Sql>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sql],
    }).compileComponents();

    fixture = TestBed.createComponent(Sql);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
