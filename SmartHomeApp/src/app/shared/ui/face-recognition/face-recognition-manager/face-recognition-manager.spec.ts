import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceRecognitionManager } from './face-recognition-manager';

describe('FaceRecognitionManager', () => {
  let component: FaceRecognitionManager;
  let fixture: ComponentFixture<FaceRecognitionManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceRecognitionManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceRecognitionManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
