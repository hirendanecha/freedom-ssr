import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  NgbActiveModal,
  NgbDropdown,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from '../../services/customer.service';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { PostService } from '../../services/post.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-edit-group-modal',
  templateUrl: './edit-group-modal.component.html',
  styleUrls: ['./edit-group-modal.component.scss'],
})
export class EditGroupModalComponent implements OnInit {
  @Input() cancelButtonLabel: string = 'Cancel';
  @Input() confirmButtonLabel: string = 'Done';
  @Input() title: string = 'Edit Group Details';
  @Input() message: string;
  @Input() data: any;
  @Input() groupId: number;
  profileId: number;
  searchText = '';
  userList: any = [];
  chanageGroupName: string;
  addedInvitesList: any[] = [];
  showInputField: boolean = false;
  profileImg: any = {
    file: null,
    url: '',
  };

  @ViewChild('userSearchDropdownRef', { static: false, read: NgbDropdown })
  userSearchNgbDropdown: NgbDropdown;
  isOpenUserMenu = false;

  constructor(
    public activateModal: NgbActiveModal,
    private customerService: CustomerService,
    private postService: PostService,
    private socketService: SocketService,
    private modalService: NgbModal
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngOnInit(): void {
    if (this.data) {
      this.profileImg.url = this.data.profileImage;
      this.chanageGroupName = this.data.groupName;
    }
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

  selectFiles(event) {
    this.profileImg = event;
  }

  clearProfileImg(event: any): void {
    event.stopPropagation();
    event.preventDefault();
    this.profileImg = {
      file: null,
      url: '',
    };
  }

  editGroupName() {
    this.showInputField = !this.showInputField;
  }

  upload() {
    if (this.profileImg.file) {
      this.postService.uploadFile(this.profileImg.file).subscribe({
        next: (res: any) => {
          if (res?.body?.url) {
            this.profileImg.url = res?.body?.url;
            this.editGroup();
          }
        },
      });
    } else {
      this.editGroup();
    }
  }

  editGroup() {
    let groupMembers = this.addedInvitesList.map((item) => item.Id);
    const groupData = {
      profileId: this.profileId,
      profileImage: this.profileImg.url,
      groupName: this.chanageGroupName,
      profileIds: groupMembers,
      groupId: this.groupId,
    };
    this.activateModal.close(groupData);
  }

  removeGroupUser(id) {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.title = 'Remove user from conversation';
    modalRef.componentInstance.confirmButtonLabel = 'Remove';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message = 'Are you sure want to remove?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        const data = {
          profileId: id,
          groupId: this.groupId,
        };
        this.socketService.removeGroupMember(data, (res) => {
          // console.log(res);
          this.data = res;
        });
      }
    });
  }
}
