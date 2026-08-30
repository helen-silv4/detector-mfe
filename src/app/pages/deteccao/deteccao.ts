import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Telemetry } from '../../core/telemetry';
import { Icon } from '../../shared/icon/icon';
import { TelemetryPanel } from '../../shared/telemetry-panel/telemetry-panel';

@Component({
  selector: 'app-deteccao',
  imports: [DecimalPipe, Icon, TelemetryPanel],
  templateUrl: './deteccao.html',
  styleUrl: './deteccao.scss',
})
export class Deteccao {
  telemetryService = inject(Telemetry);

  toggleConnection() {
    this.telemetryService.toggleConnected();
  }
}
