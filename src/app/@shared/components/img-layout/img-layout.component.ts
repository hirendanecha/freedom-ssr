import { Component, ElementRef, Input, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-img-layout',
  templateUrl: './img-layout.component.html',
  styleUrls: ['./img-layout.component.scss'],
})
export class ImgLayoutComponent {
  @Input('post') post: any = [];

  pdfView(pdfUrl) {
    window.open(pdfUrl);
  }
}
