import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingLabelV2 } from './floating-label-v2';

describe('FloatingLabelV2', () => {
  let component: FloatingLabelV2;
  let fixture: ComponentFixture<FloatingLabelV2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingLabelV2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingLabelV2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
