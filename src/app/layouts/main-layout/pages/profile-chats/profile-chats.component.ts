import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ProfileChatsSidebarComponent } from './profile-chats-sidebar/profile-chats-sidebar.component';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';

@Component({
  selector: 'app-profile-chat-list',
  templateUrl: './profile-chats.component.html',
  styleUrls: ['./profile-chats.component.scss'],
})
export class ProfileChartsComponent implements OnDestroy, OnInit {
  activeIdTab: string = 'local';
  pageList = [];
  profileId: number;
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
    private socketService: SocketService
  ) {
    if (this.sharedService.isNotify) {
      this.sharedService.isNotify = false;
    }
  }
  ngOnInit(): void {
    this.socketService.connect();
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
    console.log(userName);
    this.userChat = userName;
  }

  onNewChatRoom(isRoomCreated) {
    this.isRoomCreated = isRoomCreated;
    return this.sharedService.updateIsRoomCreated(this.isRoomCreated);
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
}
