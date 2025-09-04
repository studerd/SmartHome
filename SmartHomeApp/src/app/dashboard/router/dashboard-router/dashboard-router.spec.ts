import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRouter } from './dashboard-router';

describe('DashboardRouter', () => {
  let component: DashboardRouter;
  let fixture: ComponentFixture<DashboardRouter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRouter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRouter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
