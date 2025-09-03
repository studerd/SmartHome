import {Component, effect, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToastService} from '../../../../core/service/toast.service';
import {ToastComponent} from '../toast/toast.component';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.scss']
})
export class ToasterComponent {
  protected readonly toastService:ToastService = inject(ToastService);
  remove(id:string):void{
    this.toastService.remove(id);
  }
}
