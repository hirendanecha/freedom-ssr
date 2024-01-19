import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-profile-chats-list',
  templateUrl: './profile-chats-list.component.html',
  styleUrls: ['./profile-chats-list.component.scss'],
})
export class ProfileChatsListComponent implements AfterViewInit {
  @Input('userChat') userChat: any = {};
  profileId: number;
  constructor() {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    console.log('input', this.userChat);
  }
}
