import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppConfigManager } from './app-config-manager';

describe('AppConfigManager', () => {
  let component: AppConfigManager;
  let fixture: ComponentFixture<AppConfigManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppConfigManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppConfigManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
