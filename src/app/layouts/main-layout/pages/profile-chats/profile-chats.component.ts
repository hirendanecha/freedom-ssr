import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ProfileChatsSidebarComponent } from './profile-chats-sidebar/profile-chats-sidebar.component';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { ConfirmationModalComponent } from 'src/app/@shared/modals/confirmation-modal/confirmation-modal.component';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-profile-chat-list',
  templateUrl: './profile-chats.component.html',
  styleUrls: ['./profile-chats.component.scss'],
})
export class ProfileChartsComponent implements OnDestroy, OnInit {
  activeIdTab: string = 'local';
  pageList = [];
  profileId: number;
  selectedRoomId: number;
  isPageLoader: boolean = false;
  isRoomCreated: boolean = false;

  mobileMenuToggle: boolean = false;

  userChat: any = {};
  messageList: any = [];

  sidebar: any = {
    isShowLeftSideBar: true,
    isShowRightSideBar: true,
    isShowResearchLeftSideBar: false,
    isShowChatListSideBar: true,
  };

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private offcanvasService: NgbOffcanvas,
    private sharedService: SharedService,
    private socketService: SocketService,
    private modalService: NgbModal,
    public breakpointService: BreakpointService
  ) {
    if (this.sharedService.isNotify) {
      this.sharedService.isNotify = false;
    }
  }
  ngOnInit(): void {
    this.socketService.connect();

    const isMobilePopUp = localStorage.getItem('isMobilePopShow');
    if (isMobilePopUp !== 'N') {
      this.breakpointService.screen.pipe(take(1)).subscribe((screen) => {
        if (screen?.md?.lessThen) {
          this.mobileShortCutPopup();
        }
      });
    }
  }

  mobileMenu(): void {
    this.mobileMenuToggle = !this.mobileMenuToggle;
    this.renderer.setStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow',
      'hidden'
    );
  }

  onChatPost(userName: any) {
    this.userChat = userName;
  }

  onNewChatRoom(isRoomCreated) {
    this.isRoomCreated = isRoomCreated;
    return this.sharedService.updateIsRoomCreated(this.isRoomCreated);
  }

  onSelectChat(id) {
    this.selectedRoomId = id;
  }

  openChatListSidebar() {
    const offcanvasRef = this.offcanvasService.open(
      ProfileChatsSidebarComponent,
      this.userChat
    );
    offcanvasRef.componentInstance.onNewChat.subscribe((emittedData: any) => {
      this.onChatPost(emittedData);
    });
  }

  ngOnDestroy(): void {
    this.isRoomCreated = false;
    if (this.socketService?.socket) {
      this.socketService.socket?.disconnect();
    }
  }

  mobileShortCutPopup() {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Mobile screen detected';
    modalRef.componentInstance.confirmButtonLabel = 'Yes';
    modalRef.componentInstance.cancelButtonLabel = 'No';
    modalRef.componentInstance.message =
      'World you like to add a Freedom.buzz icon to your mobile Home screen?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        const modalRef = this.modalService.open(ConfirmationModalComponent, {
          centered: true,
        });
        modalRef.componentInstance.title = 'Add freedom chats on home';
        modalRef.componentInstance.confirmButtonLabel = 'Do not display again';
        modalRef.componentInstance.cancelButtonLabel = 'Close';
        modalRef.componentInstance.message =
          'On your browser click on browser menu, then click Add to Home Screen';
        modalRef.result.then((res) => {
          if (res === 'success') {
            localStorage.setItem('isMobilePopShow', 'N');
          }
        });
      }
    });
  }
}
