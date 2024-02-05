import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-create-group-modal',
  templateUrl: './create-group-modal.component.html',
  styleUrls: ['./create-group-modal.component.scss'],
})
export class CreateGroupModalComponent implements OnInit {
  @Input() cancelButtonLabel: string = 'Cancel';
  @Input() confirmButtonLabel: string = 'Done';
  @Input() title: string = 'Add to Group';
  @Input() message: string;
  @Input() data: any;
  profileId: number;
  searchText = '';
  userList: any = [];

  addedInvitesList: any[] = [];

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  isOpenUserMenu = false;

  constructor(
    public activateModal: NgbActiveModal,
    private customerService: CustomerService
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngOnInit(): void {
    this.addedInvitesList.push(this.data);
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

  addProfile(user) {
    this.addedInvitesList.push(user);
    this.searchText = '';
  }

  removeUser(item) {
    this.addedInvitesList = this.addedInvitesList.filter(
      (user) => user.Id !== item.Id
    );
  }

  createGroup() {
    let groupMembers = this.addedInvitesList.map((item) => item.Id);
    let groupMembersName = this.addedInvitesList.map((item) => item.Username);
    let commaSeparatedString = groupMembersName.join(', ');
    console.log(commaSeparatedString);
    
    const groupData = {
      profileId: this.profileId,
      groupName: commaSeparatedString,
      profileIds: groupMembers,
    };
    this.activateModal.close(groupData);
  }
}
