import {Component, computed, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DashboardAction, DashboardHeader, DashboardModal, DashboardSide} from '../../component';
import {
  DashboardQuickViewAndAction
} from '../../component/dashboard-quick-view-and-action/dashboard-quick-view-and-action';

@Component({
  selector: 'app-dashboard-router',
  imports: [
    RouterOutlet,
    DashboardModal,
    DashboardSide,
    DashboardHeader,
    DashboardQuickViewAndAction
  ],
  templateUrl: './dashboard-router.html',
  standalone: true,
  styleUrl: './dashboard-router.scss'
})
export class DashboardRouter {
  private _modal = signal(false);
  isModalOpen = computed(() => this._modal());
  openModal(){ this._modal.set(true); }
  closeModal(){ this._modal.set(false); }
  onAction(a: DashboardAction){
// TODO: brancher sur AppRoutes / actions réelles
    console.log('Action choisie:', a);
    this.closeModal();
  }
}
