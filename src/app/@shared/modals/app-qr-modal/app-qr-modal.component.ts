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

  constructor(public activeModal: NgbActiveModal) {}
  
}
