import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceRecognitionSignIn } from './face-recognition-sign-in';

describe('FaceRecognitionSignIn', () => {
  let component: FaceRecognitionSignIn;
  let fixture: ComponentFixture<FaceRecognitionSignIn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceRecognitionSignIn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceRecognitionSignIn);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
