import { Component, Input } from '@angular/core';

export type IconName =
  | 'camera'
  | 'battery'
  | 'thermometer'
  | 'map'
  | 'trash'
  | 'plane'
  | 'video'
  | 'gauge'
  | 'compass'
  | 'drone'
  | 'power'
  | 'check';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styles: [
    `
      :host {
        display: inline-flex;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class Icon {
  @Input({ required: true }) name!: IconName;
}
