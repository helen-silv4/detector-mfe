import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Deteccao } from './deteccao';

describe('Deteccao', () => {
  let component: Deteccao;
  let fixture: ComponentFixture<Deteccao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deteccao],
    }).compileComponents();

    fixture = TestBed.createComponent(Deteccao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
