import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSide } from './dashboard-side';

describe('DashboardSide', () => {
  let component: DashboardSide;
  let fixture: ComponentFixture<DashboardSide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
