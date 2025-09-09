import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Viewer3D } from './viewer3-d';

describe('Viewer3D', () => {
  let component: Viewer3D;
  let fixture: ComponentFixture<Viewer3D>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Viewer3D]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Viewer3D);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
