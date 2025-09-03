import { TestBed } from '@angular/core/testing';

import { GeoLocService } from './geo-loc.service';

describe('GeoLocService', () => {
  let service: GeoLocService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoLocService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
