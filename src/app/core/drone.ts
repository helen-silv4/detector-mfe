import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_URL = 'http://localhost:8000';

@Injectable({
  providedIn: 'root'
})
export class DroneService {
  private readonly http = inject(HttpClient);

  // executa uma rota de teste que retorna logs em stream (NDJSON)
  async executarTesteStream(
    path: string,
    onLog: (log: string, status?: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_URL}${path}`, { method: 'POST' });
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const linhas = buffer.split('\n');
      buffer = linhas.pop() ?? '';

      for (const linha of linhas) {
        if (!linha.trim()) continue;
        const { log, status } = JSON.parse(linha);
        onLog(log, status);
      }
    }
  }

  // POST /emergencia - Pouso de emergência 
  pousoEmergencia() {
    return this.http.post<{ status: string }>(`${API_URL}/emergencia`, {});
  }

  // POST /controle - Envia comando RC (lr, fb, ud, yv) para o drone 
  enviarControleRC(lr: number, fb: number, ud: number, yv: number) {
    return this.http.post<{ status: string }>(`${API_URL}/controle`, { lr, fb, ud, yv });
  }
}

export { DroneService as Drone };