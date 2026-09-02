import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Telemetry } from '../../core/telemetry';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-telemetry-panel',
  imports: [DecimalPipe, Icon],
  templateUrl: './telemetry-panel.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class TelemetryPanel {
  telemetryService = inject(Telemetry);
}
