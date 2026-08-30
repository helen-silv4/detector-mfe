import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:8000';

@Injectable({
  providedIn: 'root'
})
export class Drone {
  constructor(private http: HttpClient) {}

  testeVoo() {
    return this.http.post<{ status: string; logs: string[] }>(`${API_URL}/testes/voo`, {});
  }

  testeVideo() {
    return this.http.post<{ status: string; logs: string[] }>(`${API_URL}/testes/video`, {});
  }

  testeVooVideo() {
    return this.http.post<{ status: string; logs: string[] }>(`${API_URL}/testes/voo-video`, {});
  }
}