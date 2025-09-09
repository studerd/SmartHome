import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePlanHomePage } from './home-plan-home-page';

describe('HomePlanHomePage', () => {
  let component: HomePlanHomePage;
  let fixture: ComponentFixture<HomePlanHomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePlanHomePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePlanHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
