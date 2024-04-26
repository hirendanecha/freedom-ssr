import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';


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

  constructor(public activeModal: NgbActiveModal) {}
  
  togglePlayApp(){
    this.showPlayQr = !this.showPlayQr
  }

  toggleStoreApp(){
    this.showStoreQr = !this.showStoreQr
  }
}
