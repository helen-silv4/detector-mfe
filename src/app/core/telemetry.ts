import { Injectable, signal } from '@angular/core';

export interface DroneTelemetry {
  connected: boolean;
  battery: number;
  temperature: number;
  altitude: number;
  latitude: number;
  longitude: number;
}

const BASE: DroneTelemetry = {
  connected: true,
  battery: 78,
  temperature: 55,
  altitude: 42.3,
  latitude: -23.55052,
  longitude: -46.633308,
};

function jitter(value: number, amount: number) {
  return value + (Math.random() - 0.5) * amount;
}

@Injectable({
  providedIn: 'root',
})
export class Telemetry {
  telemetry = signal<DroneTelemetry>(BASE);

  private intervalId?: ReturnType<typeof setInterval>;

  constructor() {
    this.startIfConnected();
  }

  toggleConnected() {
    clearInterval(this.intervalId);
    this.telemetry.update((prev) => ({ ...prev, connected: !prev.connected }));
    this.startIfConnected();
  }

  private startIfConnected() {
    if (!this.telemetry().connected) return;

    this.intervalId = setInterval(() => {
      this.telemetry.update((prev) => ({
        ...prev,
        battery: Math.max(0, Math.min(100, prev.battery - Math.random() * 0.15)),
        temperature: Math.max(20, jitter(prev.temperature, 1.2)),
        altitude: Math.max(0, jitter(prev.altitude, 0.6)),
        latitude: jitter(prev.latitude, 0.0004),
        longitude: jitter(prev.longitude, 0.0004),
      }));
    }, 2000);
  }
}
