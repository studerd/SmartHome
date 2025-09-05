import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardQuickViewAndAction } from './dashboard-quick-view-and-action';

describe('DashboardQuickViewAndAction', () => {
  let component: DashboardQuickViewAndAction;
  let fixture: ComponentFixture<DashboardQuickViewAndAction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardQuickViewAndAction]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardQuickViewAndAction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
