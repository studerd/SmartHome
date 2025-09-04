import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-dashboard-router',
  imports: [
    RouterOutlet
  ],
  templateUrl: './dashboard-router.html',
  standalone: true,
  styleUrl: './dashboard-router.scss'
})
export class DashboardRouter {

}
