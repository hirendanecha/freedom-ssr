import { Component, Input, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-app-qr-modal',
  templateUrl: './app-qr-modal.component.html',
  styleUrls: ['./app-qr-modal.component.scss'],
})
export class AppQrModalComponent {
  @Input() store: string;
  @Input() image: string;
  @Input() title:string | undefined = 'Buzz Ring App'
  showPlayQr :boolean = false
  showStoreQr :boolean = false
  isInnerWidthSmall: boolean;
  playStore = 'https://s3.us-east-1.wasabisys.com/freedom-social/BuzzRing.apk'

  constructor(public activeModal: NgbActiveModal,
    private toastService: ToastService,
    private ngZone:NgZone
  ) {
    this.isInnerWidthSmall = window.innerWidth < 768;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResize.bind(this));
    });
  }

  onResize() {
    this.ngZone.run(() => {
      this.isInnerWidthSmall = window.innerWidth < 768;
    });
  }
  
  togglePlayApp(){
    this.showPlayQr = !this.showPlayQr
  }

  toggleStoreApp(){
    this.showStoreQr = !this.showStoreQr
  }

  handleClick(): void {
    if (this.isInnerWidthSmall) {
      this.downloadApp();
    } else {
      this.togglePlayApp();
    }
  }

  downloadApp(): void {
    const appLink = document.createElement('a');
    appLink.href = this.playStore;
    appLink.click();
    this.toastService.success('Download successfully initiated.');
  }
}
