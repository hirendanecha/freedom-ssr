import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { NgbActiveOffcanvas, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { Router } from '@angular/router';
import { EncryptDecryptService } from 'src/app/@shared/services/encrypt-decrypt.service';

@Component({
  selector: 'app-profile-chats-sidebar',
  templateUrl: './profile-chats-sidebar.component.html',
  styleUrls: ['./profile-chats-sidebar.component.scss'],
})
export class ProfileChatsSidebarComponent
  implements AfterViewInit, OnChanges, OnInit {
  chatList: any = [];
  pendingChatList: any = [];
  groupList: any = [];

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  searchText = '';
  userList: any = [];
  profileId: number;
  selectedChatUser: any;

  isMessageSoundEnabled: boolean = true;
  isCallSoundEnabled: boolean = true;
  isChatLoader = false;
  selectedButton: string = 'chats';
  newChatList = [];

  @Output('onNewChat') onNewChat: EventEmitter<any> = new EventEmitter<any>();
  @Input('isRoomCreated') isRoomCreated: boolean = false;
  constructor(
    private customerService: CustomerService,
    private socketService: SocketService,
    public sharedService: SharedService,
    private activeOffcanvas: NgbActiveOffcanvas,
    private router: Router,
    public encryptDecryptService: EncryptDecryptService
  ) {
    this.profileId = +localStorage.getItem('profileId');

    const notificationSound =
      JSON.parse(localStorage.getItem('soundPreferences')) || {};
    if (notificationSound?.messageSoundEnabled === 'N') {
      this.isMessageSoundEnabled = false;
    }
    if (notificationSound?.callSoundEnabled === 'N') {
      this.isCallSoundEnabled = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.sharedService
      .getIsRoomCreatedObservable()
      .subscribe((isRoomCreated) => {
        this.isRoomCreated = isRoomCreated;
        this.getChatList();
        this.getGroupList();
      });
  }

  ngOnInit(): void {
    this.socketService.connect();
    this.getChatList();
    this.getGroupList();
  }

  ngAfterViewInit(): void {
    this.getGroupList();
    if (this.isRoomCreated) {
      this.getChatList();
      this.getGroupList();
    }
    this.socketService.socket?.on('accept-invitation', (data) => {
      if (data) {
        this.onChat(data);
        this.getChatList();
      }
    });
  }

  getUserList(): void {
    this.customerService.getProfileList(this.searchText).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0) {
          this.userList = res.data.filter(
            (user: any) => user.Id !== this.sharedService?.userData?.Id
          );
          this.userList = this.userList.filter(
            (user: any) =>
              !this.chatList.some(
                (chatUser: any) => chatUser.profileId === user.Id
              ) &&
              !this.pendingChatList.some(
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

  getChatList() {
    this.isChatLoader = true;
    this.socketService?.getChatList({ profileId: this.profileId }, (data) => {
      this.isChatLoader = false;
      this.chatList = data?.filter(
        (user: any) =>
          user.Username != this.sharedService?.userData?.Username &&
          user?.isAccepted === 'Y'
      );
      this.mergeUserChatList();
      this.pendingChatList = data.filter(
        (user: any) => user.isAccepted === 'N'
      );
    });
    return this.chatList;
  }

  onChat(item: any) {
    this.selectedChatUser = item;
    item.unReadMessage = 0;
    if (item.groupId) {
      item.isAccepted = 'Y';
    }
    // console.log(item);
    this.notificationNavigation()
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
    const soundPreferences =
      JSON.parse(localStorage.getItem('soundPreferences')) || {};
    soundPreferences[property] = ngModelValue ? 'Y' : 'N';
    localStorage.setItem('soundPreferences', JSON.stringify(soundPreferences));
  }

  clearChatList() {
    this.onNewChat?.emit({});
  }

  selectButton(buttonType: string): void {
    this.selectedButton = this.selectedButton === buttonType ? buttonType : buttonType;
  }

  getGroupList() {
    this.isChatLoader = true;
    this.socketService?.getGroup({ profileId: this.profileId }, (data) => {
      this.isChatLoader = false;
      this.groupList = data;
      this.mergeUserChatList();
    });
  }

  notificationNavigation() {
    const isRead = localStorage.getItem('isRead');
    if (isRead === 'N') {
      localStorage.setItem('isRead', 'Y');
      this.sharedService.isNotify = false;
    }
  }

  mergeUserChatList(): void {
    const chatList = this.chatList;
    const groupList = this.groupList;
    const mergeChatList = [...chatList, ...groupList];
    mergeChatList.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
    if (mergeChatList?.length) {
      this.newChatList = mergeChatList;
    }
  }
}
