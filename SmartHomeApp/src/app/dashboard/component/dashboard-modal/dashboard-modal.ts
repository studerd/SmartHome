import {Component, EventEmitter, Input, Output} from '@angular/core';


export type DashboardAction = 'lights' | 'climate' | 'security' | 'pool' | 'energy' | 'media';

@Component({
  selector: 'app-dashboard-modal',
  imports: [],
  templateUrl: './dashboard-modal.html',
  standalone: true,
  styleUrl: './dashboard-modal.scss'
})
export class DashboardModal {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<DashboardAction>();


  onBackdrop() {
    this.close.emit();
  }

  pick(a: DashboardAction) {
    this.action.emit(a);
  }
}
