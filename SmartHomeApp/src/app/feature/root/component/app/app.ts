import {Component, inject, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {AppService} from '../../app.service';
import {AppConfigManager} from '../app-config-manager/app-config-manager';
import {AccountDataPayload} from '../../../account/data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppConfigManager],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.scss'
})
export class App {
  protected readonly appService: AppService = inject(AppService);

  createConfig(data: AccountDataPayload) {
    this.appService.createConfig(data).subscribe();
  }
}
