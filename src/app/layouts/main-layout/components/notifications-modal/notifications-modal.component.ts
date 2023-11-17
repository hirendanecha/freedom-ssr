import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { SharedService } from 'src/app/@shared/services/shared.service';

@Component({
  selector: 'app-notifications-modal',
  templateUrl: './notifications-modal.component.html',
  styleUrls: ['./notifications-modal.component.scss']
})
export class NotificationsModalComponent {

  constructor(
    public sharedService: SharedService,
    private activeModal: NgbActiveModal,
    private activeOffcanvas: NgbActiveOffcanvas,
    private customerService: CustomerService,
    private router: Router,
  ) {
    this.sharedService.getNotificationList();
  }

  readUnreadNotification(postId: string, notificationId: number): void {
    this.customerService.readUnreadNotification(notificationId, 'Y').subscribe({
      next: (res) => {
        this.router.navigate([`post/${postId}`]);
        // window.open(`post/${postId}`.toString(), '_blank')
        this.closeModal();
      },
    });
  }

  closeModal(): void {
    this.activeModal?.dismiss();
    this.activeOffcanvas?.dismiss();
  }
}
