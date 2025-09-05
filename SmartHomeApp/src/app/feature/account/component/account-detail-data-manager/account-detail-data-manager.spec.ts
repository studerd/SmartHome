import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountDetailDataManager } from './account-detail-data-manager';

describe('AccountDetailDataManager', () => {
  let component: AccountDetailDataManager;
  let fixture: ComponentFixture<AccountDetailDataManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDetailDataManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountDetailDataManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
