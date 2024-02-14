import { DOCUMENT } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, take, takeUntil } from 'rxjs';
import { OutGoingCallModalComponent } from 'src/app/@shared/modals/outgoing-call-modal/outgoing-call-modal.component';
import { EncryptDecryptService } from 'src/app/@shared/services/encrypt-decrypt.service';
import { MessageService } from 'src/app/@shared/services/message.service';
import { PostService } from 'src/app/@shared/services/post.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { Howl } from 'howler';
import { CreateGroupModalComponent } from 'src/app/@shared/modals/create-group-modal/create-group-modal.component';
import { EditGroupModalComponent } from 'src/app/@shared/modals/edit-group-modal/edit-group-modal.component';
@Component({
  selector: 'app-profile-chats-list',
  templateUrl: './profile-chats-list.component.html',
  styleUrls: ['./profile-chats-list.component.scss'],
})
// changeDetection: ChangeDetectionStrategy.OnPush,
export class ProfileChatsListComponent
  implements OnInit, OnChanges, AfterViewChecked, OnDestroy
{
  @Input('userChat') userChat: any = {};
  @Output('newRoomCreated') newRoomCreated: EventEmitter<any> =
    new EventEmitter<any>();
  @ViewChild('chatContent') chatContent!: ElementRef;

  profileId: number;
  chatObj = {
    msgText: null,
    msgMedia: null,
    id: null,
  };
  isFileUploadInProgress: boolean = false;
  selectedFile: any;

  groupData: any = [];
  messageList: any = [];
  metaURL: any = [];
  metaData: any = {};
  ngUnsubscribe: Subject<void> = new Subject<void>();
  isMetaLoader: boolean = false;

  pdfName: string = '';
  viewUrl: string;
  pdfmsg: string;
  messageInputValue: string = '';
  firstTimeScroll = false;
  activePage = 1;
  hasMoreData = false;

  typingData: any = {};
  isTyping = false;
  emojiPaths = [
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Heart.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Cool.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Anger.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Censorship.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Hug.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Kiss.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/LOL.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Party.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Poop.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Sad.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Thumbs-UP.gif',
    'https://s3.us-east-1.wasabisys.com/freedom-social/freedom-emojies/Thumbs-down.gif',
  ];

  // messageList: any = [];
  constructor(
    private socketService: SocketService,
    public sharedService: SharedService,
    private messageService: MessageService,
    private postService: PostService,
    private toastService: ToastService,
    private spinner: NgxSpinnerService,
    public encryptDecryptService: EncryptDecryptService,
    private modalService: NgbModal
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngOnInit(): void {
    if (this.userChat?.roomId || this.userChat?.groupId) {
      this.getMessageList();
    }
    this.socketService.socket?.on('new-message', (data) => {
      console.log('new-message', data);
      this.newRoomCreated.emit(true);
      if (
        data?.sentBy !== this.profileId &&
        (this.userChat?.roomId === data?.roomId ||
          this.userChat?.groupId === data?.groupId)
      ) {
        let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        if (data?.isDeleted) {
          this.messageList = this.messageList.filter(
            (obj) => obj?.id !== data?.id
          );
        } else if (this.messageList[index]) {
          this.messageList[index] = data;
        } else {
          this.scrollToBottom();
          this.messageList.push(data);
        }
      }
    });
    this.socketService.socket?.on('get-users', (data) => {
      data.map((ele) => {
        if (!this.sharedService?.onlineUserList.includes(ele.userId)) {
          this.sharedService.onlineUserList.push(ele.userId);
        }
      });
    });
    this.socketService.socket?.emit('online-users');
    this.socketService.socket?.on('typing', (data) => {
      console.log(data);
      this.typingData = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.userChat?.groupId) {
      // console.log('input', this.userChat);
      this.activePage = 1;
      this.messageList = [];
      this.hasMoreData = false;
      this.getGroupDetails(this.userChat.groupId);
      this.resetData();
    } else {
      // console.log('input', this.userChat);
      this.groupData = null;
    }
    if (this.userChat?.roomId || this.userChat?.groupId) {
      this.activePage = 1;
      this.messageList = [];
      this.getMessageList();
      this.hasMoreData = false;
      this.socketService.socket.on('get-users', (data) => {
        data.map((ele) => {
          if (!this.sharedService?.onlineUserList.includes(ele.userId)) {
            this.sharedService.onlineUserList.push(ele.userId);
          }
        });
      });
    }
  }

  // scroller down
  ngAfterViewChecked() {
    // if (this.userChat?.roomId) {
    //   this.scrollToBottom();
    // }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // invite btn
  createChatRoom(): void {
    this.socketService.createChatRoom(
      {
        profileId1: this.profileId,
        profileId2: this.userChat?.Id || this.userChat?.profileId,
      },
      (data: any) => {
        this.userChat = { ...data?.room };
        // console.log(data);
        this.newRoomCreated.emit(true);
      }
    );
  }

  // accept btn
  acceptRoom(): void {
    this.socketService?.acceptRoom(
      {
        roomId: this.userChat?.roomId,
        profileId: this.profileId,
      },
      (data: any) => {
        console.log(data);
        this.userChat.isAccepted = data.isAccepted;
        // this.userChat = { ...data };
        this.newRoomCreated.emit(true);
      }
    );
  }

  // send btn
  sendMessage(): void {
    // console.log(this.chatObj);
    if (this.chatObj.id) {
      const message =
        this.chatObj.msgText !== null
          ? this.encryptDecryptService?.encryptUsingAES256(this.chatObj.msgText)
          : null;
      const data = {
        id: this.chatObj.id,
        messageText: message,
        roomId: this.userChat?.roomId,
        groupId: this.userChat?.groupId,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
      };
      this.socketService?.editMessage(data, (data: any) => {
        // this.userChat = data;
        // console.log('edit-message', data);
        this.isFileUploadInProgress = false;
        if (data) {
          let index = this.messageList?.findIndex(
            (obj) => obj?.id === data?.id
          );
          if (this.messageList[index]) {
            this.messageList[index] = data;
          }
        }
        // this.messageList[data.id] = data;
        this.resetData();
      });
    } else {
      const message =
        this.chatObj.msgText !== null
          ? this.encryptDecryptService?.encryptUsingAES256(this.chatObj.msgText)
          : null;
      // console.log('encrypted-message', message);
      const data = {
        messageText: message,
        roomId: this.userChat?.roomId || null,
        groupId: this.userChat?.groupId || null,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
      };

      console.log(data);

      this.socketService.sendMessage(data, async (data: any) => {
        // console.log(data);
        this.isFileUploadInProgress = false;
        this.scrollToBottom();
        this.newRoomCreated?.emit(true);

        const url =
          data.messageText != null
            ? this.encryptDecryptService?.decryptUsingAES256(data.messageText)
            : null;
        const text = url?.replace(/<br\s*\/?>|<[^>]*>/g, '');
        const matches = text?.match(
          /(?:https?:\/\/|www\.)[^\s<]+(?:\s|<br\s*\/?>|$)/
        );
        if (matches?.[0]) {
          data['metaData'] = await this.getMetaDataFromUrlStr(matches?.[0]);
          // console.log(data);
        } else {
          this.messageList.push(data);
          this.resetData();
          return data;
        }
        this.messageList.push(data);
        this.resetData();
      });
    }
    this.startTypingChat(false);
  }

  loadMoreChats() {
    this.activePage = this.activePage + 1;
    this.getMessageList();
  }

  // getMessages
  getMessageList(): void {
    const messageObj = {
      // page: 1,
      page: this.activePage,
      size: 50,
      roomId: this.userChat?.roomId || null,
      groupId: this.userChat?.groupId || null,
    };
    this.messageService.getMessages(messageObj).subscribe({
      next: (data: any) => {
        if (this.activePage === 1) {
          this.scrollToBottom();
        }
        // this.messageList = data.data;
        if (data?.data.length > 0) {
          this.messageList = [...this.messageList, ...data.data];

          this.messageList.sort(
            (a, b) =>
              new Date(a.createdDate).getTime() -
              new Date(b.createdDate).getTime()
          );
          // console.log(this.messageList);
        } else {
          this.hasMoreData = false;
        }
        if (this.activePage < data.pagination.totalPages) {
          this.hasMoreData = true;
        }
        const ids = [];
        this.messageList.map((e: any) => {
          if (e.isRead === 'N' && e.sentBy !== this.profileId) {
            return ids.push(e.id);
          } else {
            return e;
          }
        });
        // console.log(ids);
        if (ids.length) {
          const data = {
            ids: ids,
          };
          this.socketService.readMessage(data, (res) => {
            console.log(res);
          });
        }
        this.messageList.map(async (element: any) => {
          const url =
            element.messageText != null
              ? this.encryptDecryptService?.decryptUsingAES256(
                  element?.messageText
                )
              : null;
          const text = url?.replace(/<br\s*\/?>|<[^>]*>/g, '');
          const matches = text?.match(
            /(?:https?:\/\/|www\.)[^\s<]+(?:\s|<br\s*\/?>|$)/
          );
          if (matches?.[0]) {
            element['metaData'] = await this.getMetaDataFromUrlStr(
              matches?.[0]
            );
            // console.log(element);
          } else {
            return element;
          }
        });
      },
      error: (err) => {},
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatContent) {
        this.chatContent.nativeElement.scrollTop =
          this.chatContent.nativeElement.scrollHeight;
      }
    });
  }

  onPostFileSelect(event: any): void {
    console.log('event  : ', event);
    const file = event.target?.files?.[0] || {};
    // console.log(file)
    if (file.type.includes('application/pdf')) {
      this.selectedFile = file;
      this.pdfName = file?.name;
      this.chatObj.msgText = null;
      this.viewUrl = URL.createObjectURL(file);
    } else if (file.type.includes('video/mp4*')) {
      this.selectedFile = file;
      this.viewUrl = URL.createObjectURL(file);
    } else if (file.type.includes('image/')) {
      this.selectedFile = file;
      this.viewUrl = URL.createObjectURL(file);
    }
    // console.log(this.selectedFile);
  }

  removePostSelectedFile(): void {
    this.selectedFile = null;
    this.pdfName = null;
    this.viewUrl = null;
    this.resetData();
  }

  onTagUserInputChangeEvent(data: any): void {
    this.chatObj.msgText = this.extractImageUrlFromContent(data?.html);
    if (data.html === '') {
      this.resetData();
    }
  }

  uploadPostFileAndCreatePost(): void {
    if (!this.isFileUploadInProgress) {
      if (this.chatObj.msgText || this.selectedFile.name) {
        if (this.selectedFile) {
          this.isFileUploadInProgress = true;
          this.postService.uploadFile(this.selectedFile).subscribe({
            next: (res: any) => {
              // this.spinner.hide();
              if (res?.body?.url) {
                this.isFileUploadInProgress = false;
                this.chatObj.msgMedia = res?.body?.url;
                this.sendMessage();
              }
            },
            error: (err) => {
              this.isFileUploadInProgress = false;
              console.log(err);
            },
          });
        } else {
          this.isFileUploadInProgress = true;
          this.sendMessage();
        }
      } else {
        this.isFileUploadInProgress = true;
        this.sendMessage();
      }
    }
  }

  resetData(): void {
    // console.log('in');
    // this.startTypingChat(false);
    this.chatObj['id'] = null;
    this.chatObj.msgMedia = null;
    this.chatObj.msgText = null;
    this.viewUrl = null;
    this.pdfName = null;
    this.selectedFile = null;
    this.messageInputValue = '';
    if (this.messageInputValue !== null) {
      setTimeout(() => {
        this.messageInputValue = null;
      }, 10);
    }
  }

  displayLocalTime(utcDateTime: string): string {
    const localTime = moment.utc(utcDateTime).local();
    return localTime.format('h:mm A');
  }

  isPdf(media: string): boolean {
    this.pdfmsg = media?.split('/')[3]?.replaceAll('%', '-');
    return media && media.endsWith('.pdf');
  }

  pdfView(pdfUrl) {
    window.open(pdfUrl);
  }

  onCancel(): void {
    const data = {
      roomId: this.userChat?.roomId,
      createdBy: this.userChat.createdBy,
      profileId: this.profileId,
    };
    this.socketService?.deleteRoom(data, (data: any) => {
      // console.log(data);
      this.userChat = {};
      this.newRoomCreated.emit(true);
    });
  }

  isGif(src: string): boolean {
    return src.toLowerCase().endsWith('.gif');
  }

  selectEmoji(emoji: any): void {
    this.chatObj.msgMedia = emoji;
    this.sendMessage();
  }

  editMsg(msgObj): void {
    this.chatObj['id'] = msgObj?.id;
    this.messageInputValue = this.encryptDecryptService?.decryptUsingAES256(
      msgObj.messageText
    );
    this.chatObj.msgMedia = msgObj.messageMedia;
  }

  deleteMsg(msg): void {
    this.socketService?.deleteMessage(
      {
        groupId: msg?.groupId,
        roomId: msg?.roomId,
        sentBy: msg.sentBy,
        id: msg.id,
        profileId: this.userChat?.profileId,
      },
      (data: any) => {
        // console.log(data);
        this.newRoomCreated.emit(true);
        this.messageList = this.messageList.filter(
          (obj) => obj?.id !== data?.id
        );

        // let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        // if (this.messageList[index]) {
        //   this.messageList.splice(index);
        // }
      }
    );
  }

  getMetaDataFromUrlStr(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (url !== this.metaData?.url) {
        this.isMetaLoader = true;
        this.ngUnsubscribe.next();
        const unsubscribe$ = new Subject<void>();

        this.postService
          .getMetaData({ url })
          .pipe(takeUntil(unsubscribe$))
          .subscribe({
            next: (res: any) => {
              this.isMetaLoader = false;
              if (res?.meta?.image) {
                const urls = res.meta?.image?.url;
                const imgUrl = Array.isArray(urls) ? urls?.[0] : urls;

                const metatitles = res?.meta?.title;
                const metatitle = Array.isArray(metatitles)
                  ? metatitles?.[0]
                  : metatitles;

                const metaurls = res?.meta?.url || url;
                const metaursl = Array.isArray(metaurls)
                  ? metaurls?.[0]
                  : metaurls;

                this.metaData = {
                  title: metatitle,
                  metadescription: res?.meta?.description,
                  metaimage: imgUrl,
                  metalink: metaursl,
                  url: url,
                };
                resolve(this.metaData);
              } else {
                this.metaData.metalink = url;
                resolve(this.metaData);
              }
            },
            error: (err) => {
              this.metaData.metalink = url;
              this.isMetaLoader = false;
              this.spinner.hide();
              reject(err);
            },
            complete: () => {
              unsubscribe$.next();
              unsubscribe$.complete();
            },
          });
      } else {
        resolve(this.metaData);
      }
    });
  }

  startCall(): void {
    const modalRef = this.modalService.open(OutGoingCallModalComponent, {
      centered: true,
      size: 'sm',
      backdrop: 'static',
    });
    const originUrl =
      'https://facetime.tube/' + `callId-${new Date().getTime()}`;

    const data = {
      ProfilePicName:
        this.groupData?.ProfileImage || this.userChat?.ProfilePicName,
      Username: this.groupData?.groupName || this?.userChat.Username,
      roomId: this.userChat?.roomId || null,
      groupId: this.userChat?.groupId || null,
      notificationByProfileId: this.profileId,
      link: originUrl,
    };
    if (!data?.groupId) {
      data['notificationToProfileId'] = this.userChat.profileId;
    }
    console.log('outgoing-data', data);
    var callSound = new Howl({
      src: [
        'https://s3.us-east-1.wasabisys.com/freedom-social/famous_ringtone.mp3',
      ],
      loop: true,
    });
    modalRef.componentInstance.calldata = data;
    // modalRef.componentInstance.sound = callSound;
    modalRef.componentInstance.title = 'RINGING...';

    this.socketService?.startCall(data, (data: any) => {
      // console.log(data);
    });
    modalRef.result.then((res) => {
      if (res === 'cancel') {
        this.chatObj.msgText = 'Your call has been ended';
        this.sendMessage();
      }
      // if (res === 'missCalled') {
      //   this.chatObj.msgText = 'You have a missed call';
      //   this.sendMessage();
      // }
    });
  }

  extractImageUrlFromContent(content: string) {
    const contentContainer = document.createElement('div');
    contentContainer.innerHTML = content;
    const imgTag = contentContainer.querySelector('img');
    if (imgTag) {
      const imgTitle = imgTag.getAttribute('title');
      const imgStyle = imgTag.getAttribute('style');
      const imageGif = imgTag
        .getAttribute('src')
        .toLowerCase()
        .endsWith('.gif');
      if (!imgTitle && !imgStyle && !imageGif) {
        const copyImage = imgTag.getAttribute('src');
        let copyImageTag = '<img\\s*src\\s*=\\s*""\\s*alt\\s*="">';
        const messageText = `<div>${content
          ?.replace(copyImage, '')
          ?.replace(/\<br\>/gi, '')
          ?.replace(new RegExp(copyImageTag, 'g'), '')}</div>`;
        const base64Image = copyImage
          .trim()
          ?.replace(/^data:image\/\w+;base64,/, '');
        try {
          const binaryString = window.atob(base64Image);
          const uint8Array = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([uint8Array], { type: 'image/jpeg' });
          const fileName = `copyImage-${new Date().getTime()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          this.selectedFile = file;
          this.viewUrl = URL.createObjectURL(file);
        } catch (error) {
          console.error('Base64 decoding error:', error);
        }
        if (messageText !== '<div></div>') {
          return messageText;
        }
      }
    } else {
      return content;
    }
    return null;
  }

  createGroup() {
    const modalRef = this.modalService.open(CreateGroupModalComponent, {
      centered: true,
      size: 'md',
    });
    if (!this.userChat.groupId) {
      const data = {
        Id: this.userChat.profileId,
        ProfilePicName: this.userChat.ProfilePicName,
        Username: this.userChat.Username,
      };
      modalRef.componentInstance.data = data;
    }
    modalRef.componentInstance.groupId = this.userChat?.groupId;
    modalRef.result.then((res) => {
      if (res) {
        // console.log(res);
        this.socketService?.createGroup(res, (data: any) => {
          this.newRoomCreated.emit(true);
        });
      }
    });
  }

  getGroupDetails(id): void {
    this.socketService?.getGroupData({ groupId: id }, (data: any) => {
      this.groupData = data;
    });
  }

  groupEditDetails(data): void {
    const modalRef = this.modalService.open(EditGroupModalComponent, {
      centered: true,
      size: 'md',
    });
    modalRef.componentInstance.data = data;
    modalRef.componentInstance.groupId = this.userChat?.groupId;
    modalRef.result.then((res) => {
      if (res !== 'cancel') {
        // console.log(res);
        this.socketService?.createGroup(res, (data: any) => {
          // console.log(data);
          this.groupData = data;
          this.newRoomCreated.emit(true);
        });
      } else {
        this.newRoomCreated.emit(true);
        this.userChat = {};
      }
    });
  }

  startTypingChat(isTyping) {
    // console.log(isTyping);
    const data = {
      groupId: this.userChat?.groupId,
      roomId: this.userChat?.roomId,
      profileId: this.userChat?.roomId
        ? this.userChat.profileId
        : this.profileId,
      isTyping: isTyping,
    };
    this.socketService?.startTyping(data, (data: any) => {
    });
  }

  delayedStartTypingChat() {
    setTimeout(() => {
      this.startTypingChat(false);
    }, 2000);
  }
}
