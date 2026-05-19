import { Component } from '@angular/core';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  imports: [
    ButtonModule,
    AvatarModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

}
