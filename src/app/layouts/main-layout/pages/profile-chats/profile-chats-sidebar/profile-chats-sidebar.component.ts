import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { ProfileService } from 'src/app/@shared/services/profile.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import {
  NgbDropdown,
  NgbModal,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { SharedService } from 'src/app/@shared/services/shared.service';

@Component({
  selector: 'app-profile-chats-sidebar',
  templateUrl: './profile-chats-sidebar.component.html',
  styleUrls: ['./profile-chats-sidebar.component.scss'],
})
export class ProfileChatsSidebarComponent implements AfterViewInit {
  // userSider = [
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Piter Maio',
  //     text: 'Amet minim mollit non....',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Annette Black',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Ralph Edwards',
  //     text: 'Amet minim mollit non....',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Darrell Steward',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Wade Warren',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Kathryn Murphy',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Jacob Jones',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Darrell Steward',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Wade Warren',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Kathryn Murphy',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Piter Maio',
  //     text: 'Amet minim mollit non....',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Annette Black',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Ralph Edwards',
  //     text: 'Amet minim mollit non....',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Darrell Steward',
  //     text: 'You: consequat sunt',
  //   },
  //   {
  //     img: '/assets/images/avtar/placeholder-user.png',
  //     name: 'Wade Warren',
  //     text: 'You: consequat sunt',
  //   },
  // ];

  chatList: any = [];

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  searchText = '';
  userList: any = [];
  profileId: number;

  @Output('onNewChat') onNewChat: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private customerService: CustomerService,
    private socketService: SocketService,
    public sharedService: SharedService
  ) {
    this.getUserList();
    this.profileId = +localStorage.getItem('profileId');
    // this.getChatList();
  }

  ngAfterViewInit(): void {
    if (!this.socketService.socket?.connected) {
      this.socketService.socket?.connect();
    }
    this.socketService.socket?.emit('join', { room: this.profileId });
    this.getChatList();
  }

  getUserList(): void {
    this.customerService.getProfileList(this.searchText).subscribe({
      next: (res: any) => {
        if (res?.data?.length > 0) {
          this.userList = res.data;
          this.userSearchNgbDropdown.open();
        } else {
          this.userList = [];
          this.userSearchNgbDropdown.close();
        }
      },
      error: () => {
        this.userList = [];
        this.userSearchNgbDropdown.close();
      },
    });
  }

  getChatList(): void {
    this.socketService.getChatList({ profileId: this.profileId }, (data) => {
      console.log(data);
      this.chatList = data;
    });
  }

  onChat(userName: any) {
    console.log('userName  : ', userName);
    this.onNewChat?.emit(userName);
  }


 
}
