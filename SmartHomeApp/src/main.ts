import { bootstrapApplication } from '@angular/platform-browser';
import {App, appConfig} from '@root';


bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
