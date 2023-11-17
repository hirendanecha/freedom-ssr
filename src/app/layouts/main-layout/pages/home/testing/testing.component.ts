import { Component } from '@angular/core';
import { MetafrenzyService } from 'ngx-metafrenzy';

@Component({
  selector: 'app-testing',
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.scss'],
})
export class TestingComponent {
  constructor(private metafrenzyService: MetafrenzyService) {
    this.metafrenzyService.setTitle('data.title');
    this.metafrenzyService.setMetaTag('og:title', 'data.title');
    this.metafrenzyService.setMetaTag('og:description', 'data.description');
  }
}
