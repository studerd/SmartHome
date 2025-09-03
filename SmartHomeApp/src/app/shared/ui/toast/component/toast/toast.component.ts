import {Component, EventEmitter, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Toast} from '@core';
import {TranslateModule} from '@ngx-translate/core';
import {tap, timer} from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  @Input({required: true}) toast!: Toast;
  @Output() remove = new EventEmitter<string>();
  ngOnInit(): void {
    if(this.toast.delay){
      timer(100000).pipe(
        tap(() => this.close())
      ).subscribe();
    }
  }
  close():void{
    this.remove.emit(this.toast.id);
  }

}
