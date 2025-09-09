import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePlanRouter } from './home-plan-router';

describe('HomePlanRouter', () => {
  let component: HomePlanRouter;
  let fixture: ComponentFixture<HomePlanRouter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePlanRouter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePlanRouter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
