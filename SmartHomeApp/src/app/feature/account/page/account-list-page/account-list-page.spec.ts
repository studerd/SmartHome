import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountListPage } from './account-list-page';

describe('AccountListPage', () => {
  let component: AccountListPage;
  let fixture: ComponentFixture<AccountListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
