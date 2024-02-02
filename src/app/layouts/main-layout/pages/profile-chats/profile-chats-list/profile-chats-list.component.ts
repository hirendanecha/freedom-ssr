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
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil } from 'rxjs';
import { OutGoingCallModalComponent } from 'src/app/@shared/modals/outgoing-call-modal/outgoing-call-modal.component';
import { EncryptDecryptService } from 'src/app/@shared/services/encrypt-decrypt.service';
import { MessageService } from 'src/app/@shared/services/message.service';
import { PostService } from 'src/app/@shared/services/post.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { ToastService } from 'src/app/@shared/services/toast.service';

@Component({
  selector: 'app-profile-chats-list',
  templateUrl: './profile-chats-list.component.html',
  styleUrls: ['./profile-chats-list.component.scss'],
})
// changeDetection: ChangeDetectionStrategy.OnPush,
export class ProfileChatsListComponent
  implements AfterViewInit, OnChanges, AfterViewChecked, OnDestroy {
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

  ngAfterViewInit(): void {
    if (this.userChat?.roomId) {
      this.getMessageList();
    }
    this.socketService.socket?.on('new-message', (data) => {
      console.log('new-message', data);
      this.newRoomCreated.emit(true);
      if (this.userChat?.roomId === data?.roomId) {
        let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        if (data?.isDeleted) {
          this.messageList = this.messageList.filter(
            (obj) => obj?.id !== data?.id
          );
        } else if (this.messageList[index]) {
          this.messageList[index] = data;
        } else {
          this.messageList.push(data);
        }
      }
    });
    this.socketService.socket?.emit('online-users');
    this.socketService.socket?.on('get-users', (data) => {
      data.map((ele) => {
        if (!this.sharedService?.onlineUserList.includes(ele.userId)) {
          this.sharedService.onlineUserList.push(ele.userId);
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // console.log('input', this.userChat);
    if (this.userChat?.roomId) {
      this.getMessageList();
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
        // console.log(data);
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
        roomId: this.userChat.roomId,
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
        roomId: this.userChat.roomId,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
      };
      // console.log(data);

      this.socketService.sendMessage(data, async (data: any) => {
        // console.log(data);
        this.isFileUploadInProgress = false;
        this.scrollToBottom();
        this.newRoomCreated?.emit(true);

        const url =
          data.messageText !== null
            ? this.encryptDecryptService.decryptUsingAES256(data.messageText)
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
  }

  // getMessages
  getMessageList(): void {
    const messageObj = {
      page: 1,
      size: 500,
      roomId: this.userChat.roomId,
    };
    this.messageService.getMessages(messageObj).subscribe({
      next: (data: any) => {
        this.scrollToBottom();
        this.messageList = data.data;
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
            element.messageText !== null
              ? this.encryptDecryptService.decryptUsingAES256(
                element.messageText
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
      error: (err) => { },
    });
  }

  ngOnInit() { }

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
    // this.chatObj.msgText = data.html;
    this.chatObj.msgText = this.extractImageUrlFromContent(data?.html);
    // this.extractImageUrlFromContent(data?.html);
    // this.postData.postdescription = data?.html;
    // this.postMessageTags = data?.tags;
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
    this.userChat = {};
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
      ProfilePicName: this.userChat.ProfilePicName,
      Username: this.userChat.Username,
      notificationToProfileId: this.userChat.profileId,
      roomId: this.userChat.roomId,
      notificationByProfileId: this.profileId,
      link: originUrl,
    };
    modalRef.componentInstance.calldata = data;
    modalRef.componentInstance.title = 'RINGING...';

    this.socketService?.startCall(data, (data: any) => {
      // console.log(data);
    });
    modalRef.result.then((res) => {
      if (res === 'cancel') {
        this.chatObj.msgText = 'Your call has been ended';
        // this.sendMessage();
      }
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
}
