import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInFace } from './sign-in-face';

describe('SignInFace', () => {
  let component: SignInFace;
  let fixture: ComponentFixture<SignInFace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInFace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignInFace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
