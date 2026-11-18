import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Testes } from './testes';

describe('Testes', () => {
  let component: Testes;
  let fixture: ComponentFixture<Testes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Testes],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Testes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
