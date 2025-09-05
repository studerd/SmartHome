import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-dashboard-header',
  imports: [],
  templateUrl: './dashboard-header.html',
  standalone: true,
  styleUrl: './dashboard-header.scss'
})
export class DashboardHeader {
  @Output() openDashboard = new EventEmitter<void>();
  @Output() brandClick = new EventEmitter<void>();
  brandName = 'SmartHome';
  userInitials = 'NL';
}

