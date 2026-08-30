import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, signal } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

type RunState = 'idle' | 'running' | 'done';

@Component({
  selector: 'app-routine-card',
  imports: [Icon],
  templateUrl: './routine-card.html',
})
export class RoutineCard implements OnChanges, OnDestroy {
  @Input({ required: true }) icon!: IconName;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() loading = false;
  @Input() logs: string[] = [];
  @Output() run = new EventEmitter<void>();

  state = signal<RunState>('idle');

  private doneTimeout?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['loading']) return;

    if (this.loading) {
      clearTimeout(this.doneTimeout);
      this.state.set('running');
    } else if (this.state() === 'running') {
      this.state.set('done');
      this.doneTimeout = setTimeout(() => this.state.set('idle'), 1800);
    }
  }

  ngOnDestroy() {
    clearTimeout(this.doneTimeout);
  }

  onRun() {
    if (this.state() === 'idle') this.run.emit();
  }
}
