import { Component, ElementRef, Input, NgZone, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../services/toast.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-app-qr-modal',
  templateUrl: './app-qr-modal.component.html',
  styleUrls: ['./app-qr-modal.component.scss'],
})
export class AppQrModalComponent {
  @Input() store: string;
  @Input() image: string;
  @Input() title:string | undefined = 'BuzzRing App'
  @ViewChild('qrCode', { static: false }) qrCodeElement: ElementRef;
  showPlayQr :boolean = false
  showStoreQr :boolean = false
  isInnerWidthSmall: boolean;
  playStore = 'https://s3.us-east-1.wasabisys.com/freedom-social/BuzzRing.apk';
  appStore = 'https://apps.apple.com/au/app/buzz-ring/id6503036047';
  qrLink = '';

  constructor(public activeModal: NgbActiveModal,
    private toastService: ToastService,
    private ngZone:NgZone
  ) {
    const profileId = +localStorage.getItem('profileId');
    const authToken = localStorage.getItem('auth-token')
    this.qrLink = `${environment.qrLink}${profileId}?token=${authToken}`;
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

  handleClick(store : string): void {
    if (this.isInnerWidthSmall) {
      this.downloadApp(store);
    } else {
      store === 'playStore' ? this.togglePlayApp() : this.toggleStoreApp();
    }
  }

  downloadApp(store: string): void {
    const appLink = document.createElement('a');
    appLink.href = store === 'playStore' ? this.playStore : this.appStore;
    appLink.click();
    this.toastService.success('Download successfully initiated.');
  }

  closePreview(){
    this.showPlayQr = false;
    this.showStoreQr = false;
  }

  saveQRlocally(){
    const qrElement = this.qrCodeElement.nativeElement.querySelector('canvas');
    if (qrElement) {
      const link = document.createElement('a');
      link.href = qrElement.toDataURL('image/png');
      link.download = 'BuzzRing-qr-code.png';
      link.click();
    }
  }
}
