import {Component, inject, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss']
})
export class LinkComponent {
  @Input({required: true}) routerLink!: string;
  private readonly router: Router = inject(Router);

  onClick(): void {
    this.router.navigate([this.routerLink]).then();
  }
}
