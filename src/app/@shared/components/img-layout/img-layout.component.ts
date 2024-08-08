import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-img-layout',
  templateUrl: './img-layout.component.html',
  styleUrls: ['./img-layout.component.scss'],
})
export class ImgLayoutComponent {
  @Input('post') post: any = [];
  @ViewChild('carouselTemplate') carouselTemplate!: TemplateRef<any>;
  imageList: any[] = [];
  currentIndex: string;
  constructor(
    private modalService: NgbModal,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}
  pdfView(pdfUrl) {
    window.open(pdfUrl);
  }

  openImagePreview(index: number) {
    this.currentIndex = index.toString();
    console.log(this.imageList, 'imageList');

    // this.modalService.open(this.carouselTemplate, {
    //   size: 'xl',
    //   centered: true,
    // });
    this.renderer.setStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow',
      'hidden'
    );
  }

  closeImagePreview() {
    this.modalService.dismissAll();
    this.imageList = [];
    this.currentIndex = null;
    this.renderer.removeStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow'
    );
  }

  subscribeToEscapeKey(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeImagePreview();
      }
    });
  }

  onSlide(event: NgbSlideEvent) {
    this.currentIndex = event.current;
  }
}
