import { TestBed } from '@angular/core/testing';

import { Drone } from './drone';

describe('Drone', () => {
  let service: Drone;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Drone);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
