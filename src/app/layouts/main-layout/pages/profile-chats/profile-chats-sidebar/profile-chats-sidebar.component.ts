import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { ProfileService } from 'src/app/@shared/services/profile.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import {
  NgbActiveOffcanvas,
  NgbDropdown,
  NgbModal,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-chats-sidebar',
  templateUrl: './profile-chats-sidebar.component.html',
  styleUrls: ['./profile-chats-sidebar.component.scss'],
})
export class ProfileChatsSidebarComponent implements AfterViewInit, OnChanges {
  chatList: any = [];
  pendingChatList: any = [];

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  searchText = '';
  userList: any = [];
  profileId: number;
  selectedChatUser: any;

  isMessageSoundEnabled: boolean = true;
  isCallSoundEnabled: boolean = true;

  @Output('onNewChat') onNewChat: EventEmitter<any> = new EventEmitter<any>();
  @Input('isRoomCreated') isRoomCreated: boolean = false;
  constructor(
    private customerService: CustomerService,
    private socketService: SocketService,
    public sharedService: SharedService,
    private activeOffcanvas: NgbActiveOffcanvas,
    private router: Router
  ) {
    // this.getUserList();
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    if (!this.socketService.socket?.connected) {
      this.socketService.socket?.connect();
    }
    this.socketService.socket?.emit('join', { room: this.profileId });
    this.getChatList();
    if (this.isRoomCreated) {
      this.getChatList();
    }
    this.socketService.socket?.on('accept-invitation', (data) => {
      console.log(data);
      if (data) {
        this.onChat(data);
        this.getChatList();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('on chan', this.isRoomCreated);
    if (this.isRoomCreated) {
      this.getChatList();
    }
    const notificationSound = JSON.parse(localStorage.getItem('soundPreferences')) || {};
    if (notificationSound?.messageSoundEnabled === 'N') {
      this.isMessageSoundEnabled  = false
    }
    if (notificationSound?.callSoundEnabled === 'N') {
      this.isCallSoundEnabled = false
    }
  }

  getUserList(): void {
    this.customerService.getProfileList(this.searchText).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0) {
          this.userList = res.data.filter(
            (user: any) => user.Id !== this.sharedService?.userData?.UserID
          );
          this.userList = this.userList.filter(
            (user: any) =>
              user.Username !== this.searchText &&
              !this.chatList.some(
                (chatUser: any) => chatUser.profileId === user.Id
              )
          );
          this.userSearchNgbDropdown?.open();
        } else {
          this.userList = [];
          this.userSearchNgbDropdown?.close();
        }
      },
      error: () => {
        this.userList = [];
        this.userSearchNgbDropdown?.close();
      },
    });
  }

  getChatList(): void {
    this.socketService?.getChatList({ profileId: this.profileId }, (data) => {
      this.chatList = data
        .filter(
          (user: any) => user.Username != this.sharedService?.userData?.Username
        )
        .filter((user: any) => user.isAccepted === 'Y');
      this.pendingChatList = data.filter(
        (user: any) => user.isAccepted === 'N'
      );
    });
  }

  onChat(item: any) {
    this.selectedChatUser = item;
    // console.log(item);
    item.unReadMessage = 0;
    this.onNewChat?.emit(item);
    this.activeOffcanvas?.dismiss();
    if (this.searchText) {
      this.searchText = null;
    }
  }

  goToViewProfile(): void {
    this.router.navigate([`settings/view-profile/${this.profileId}`]);
  }

  toggleSoundPreference(property: string, ngModelValue: boolean): void {
    const soundPreferences = JSON.parse(localStorage.getItem('soundPreferences')) || {};
    soundPreferences[property] = ngModelValue ? 'Y' : 'N';
    localStorage.setItem('soundPreferences', JSON.stringify(soundPreferences));
  }
}
