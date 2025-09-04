import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceRecognition } from './face-recognition';

describe('FaceRecognition', () => {
  let component: FaceRecognition;
  let fixture: ComponentFixture<FaceRecognition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceRecognition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceRecognition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
