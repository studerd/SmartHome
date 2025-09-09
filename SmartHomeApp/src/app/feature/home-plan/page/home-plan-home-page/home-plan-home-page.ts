import { Component } from '@angular/core';
import {Viewer3D} from '../../component';

@Component({
  selector: 'app-home-plan-home-page',
  imports: [
    Viewer3D
  ],
  templateUrl: './home-plan-home-page.html',
  standalone: true,
  styleUrl: './home-plan-home-page.scss'
})
export class HomePlanHomePage {

}
