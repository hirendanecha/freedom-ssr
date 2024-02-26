import {
  AfterViewChecked,
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
import { MessageDatePipe } from 'src/app/@shared/pipe/message-date.pipe';
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
  @Output('selectedChat') selectedChat: EventEmitter<any> =
    new EventEmitter<any>();
  @ViewChild('chatContent') chatContent!: ElementRef;

  profileId: number;
  chatObj = {
    msgText: null,
    msgMedia: null,
    id: null,
    parentMessageId: null,
  };
  replyMessage = {
    msgText: null,
    msgMedia: null,
    createdDate: null,
    Username: null,
  };
  isFileUploadInProgress: boolean = false;
  selectedFile: any;

  groupData: any = [];
  messageList: any = [];
  filteredMessageList: any = [];
  readMessagesBy: any = [];
  readMessageRoom: string = '';
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
  typingTimeout: any;
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
  originalFavicon: HTMLLinkElement;

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
      this.newRoomCreated.emit(true);
      this.selectedChat.emit(data?.roomId || data?.groupId);
      // this.notificationNavigation();
      if (
        data?.sentBy !== this.profileId &&
        (this.userChat?.roomId === data?.roomId ||
          this.userChat?.groupId === data?.groupId)
      ) {
        let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        if (data?.isDeleted) {
          this.messageList = this.messageList.filter(
            (obj) => obj?.id !== data?.id && obj?.parentMessageId !== data.id
          );
          const array = new MessageDatePipe().transform(this.messageList);
          this.filteredMessageList = array;
        } else if (this.messageList[index]) {
          this.messageList[index] = data;
          const array = new MessageDatePipe().transform(this.messageList);
          this.filteredMessageList = array;
        } else {
          console.log(this.messageList);
          this.scrollToBottom();
          this.messageList.push(data);
          const array = new MessageDatePipe().transform(this.messageList);
          this.filteredMessageList = array;
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
      // console.log('typingData', data)
      this.typingData = data;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.originalFavicon = document.querySelector('link[rel="icon"]');
    if (this.userChat?.groupId) {
      this.activePage = 1;
      this.messageList = [];
      this.hasMoreData = false;
      this.getGroupDetails(this.userChat.groupId);
      this.notificationNavigation();
      this.resetData();
    } else {
      this.groupData = null;
    }
    if (this.userChat?.roomId || this.userChat?.groupId) {
      this.activePage = 1;
      this.messageList = [];
      this.resetData();
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
  ngAfterViewChecked() {}

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  createChatRoom(): void {
    this.socketService.createChatRoom(
      {
        profileId1: this.profileId,
        profileId2: this.userChat?.Id || this.userChat?.profileId,
      },
      (data: any) => {
        console.log(data);
        this.userChat = { ...data?.room };
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
        this.userChat.isAccepted = data.isAccepted;
        this.newRoomCreated.emit(true);
      }
    );
  }

  // send btn
  sendMessage(): void {
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
        parentMessageId: this.chatObj.parentMessageId || null,
      };
      this.socketService?.editMessage(data, (data: any) => {
        this.isFileUploadInProgress = false;
        if (data) {
          let index = this.messageList?.findIndex(
            (obj) => obj?.id === data?.id
          );
          if (this.messageList[index]) {
            this.messageList[index] = data;
            const array = new MessageDatePipe().transform(this.messageList);
            // console.log(array);
            this.filteredMessageList = array;
            this.resetData();
          }
        }
        this.resetData();
      });
    } else {
      const message =
        this.chatObj.msgText !== null
          ? this.encryptDecryptService?.encryptUsingAES256(this.chatObj.msgText)
          : null;

      const data = {
        messageText: message,
        roomId: this.userChat?.roomId || null,
        groupId: this.userChat?.groupId || null,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
        parentMessageId: this.chatObj?.parentMessageId || null,
      };
      this.userChat?.roomId ? (data['isRead'] = 'N') : null;
      console.log(data);
      
      this.socketService.sendMessage(data, async (data: any) => {
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
        }
        this.messageList.push(data);
        if (this.userChat.groupId) {
          this.socketService.readGroupMessage(data, (readUsers)=> {
            this.readMessagesBy = readUsers.filter(item => item.ID !== this.profileId);
          })
        }
        const array = new MessageDatePipe().transform(this.messageList);
        // console.log(array);
        this.filteredMessageList = array;
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
        if (data?.data.length > 0) {
          this.messageList = [...this.messageList, ...data.data];
          this.messageList.sort(
            (a, b) =>
              new Date(a.createdDate).getTime() -
              new Date(b.createdDate).getTime()
          );
          this.readMessagesBy = data?.readUsers?.filter(item => item.ID !== this.profileId);
          this.readMessageRoom = this.messageList[0]?.isRead
        } else {
          this.hasMoreData = false;
        }
        if (this.activePage < data.pagination.totalPages) {
          this.hasMoreData = true;
        }
        if (this.userChat?.groupId) {
          const date = moment(new Date()).utc();
          const oldChat = {
            profileId: this.profileId,
            groupId: this.userChat.groupId,
            date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
          };
          this.socketService.switchChat(oldChat, (data) => {
            console.log(data);
          });
        } else {
          const ids = [];
          this.messageList.map((e: any) => {
            if (e.isRead === 'N' && e.sentBy !== this.profileId) {
              return ids.push(e.id);
            } else {
              return e;
            }
          });
          if (ids.length) {
            const data = {
              ids: ids,
            };
            this.socketService.readMessage(data, (res) => {
              return;
            });
          }
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
          } else {
            return element;
          }
        });

        const array = new MessageDatePipe().transform(this.messageList);
        // console.log(array);
        this.filteredMessageList = array;
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
    const file = event.target?.files?.[0] || {};
    if (file.type.includes('application/')) {
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
  }

  removePostSelectedFile(): void {
    this.selectedFile = null;
    this.pdfName = null;
    this.viewUrl = null;
    this.resetData();
  }

  removeReplay(): void {
    this.replyMessage.msgText = null;
    this.replyMessage.msgMedia = null;
    this.replyMessage.Username = null;
    this.replyMessage.createdDate = null;
    this.chatObj.parentMessageId = null;
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
    this.chatObj['id'] = null;
    this.chatObj.parentMessageId = null;
    this.replyMessage.msgText = null;
    this.replyMessage.Username = null;
    this.replyMessage.createdDate = null;
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
    const fileType =
      media.endsWith('.pdf') ||
      media.endsWith('.doc') ||
      media.endsWith('.docx') ||
      media.endsWith('.xls') ||
      media.endsWith('.xlsx') ||
      media.endsWith('.zip');
    return media && fileType;
    // return media && media.endsWith('.pdf');
  }

  pdfView(pdfUrl) {
    window.open(pdfUrl);
  }

  isFile(media: string): boolean {
    const FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip'];
    return FILE_EXTENSIONS.some((ext) => media.endsWith(ext));
  }

  onCancel(): void {
    if (this.userChat.roomId) {
      const data = {
        roomId: this.userChat?.roomId,
        createdBy: this.userChat.createdBy,
        profileId: this.profileId,
      };
      this.socketService?.deleteRoom(data, (data: any) => {
        this.userChat = {};
        this.newRoomCreated.emit(true);
      });
    } else {
      this.userChat = {};
    }
  }

  isGif(src: string): boolean {
    return src.toLowerCase().endsWith('.gif');
  }

  selectEmoji(emoji: any): void {
    this.chatObj.msgMedia = emoji;
    // this.sendMessage();
  }

  replyMsg(msgObj): void {
    console.log(msgObj);
    this.chatObj.parentMessageId = msgObj?.id;
    this.replyMessage.msgText = msgObj.messageText;
    this.replyMessage.createdDate = msgObj.createdDate;
    this.replyMessage.Username = msgObj.Username;
    const file = msgObj.messageMedia;
    const fileType =
      file.endsWith('.pdf') ||
      file.endsWith('.doc') ||
      file.endsWith('.docx') ||
      file.endsWith('.xls') ||
      file.endsWith('.xlsx') ||
      file.endsWith('.zip');
    if (fileType) {
      this.pdfName = msgObj.messageMedia;
    } else {
      this.viewUrl = msgObj.messageMedia;
    }
  }

  editMsg(msgObj): void {
    this.chatObj['id'] = msgObj?.id;
    this.messageInputValue = this.encryptDecryptService?.decryptUsingAES256(
      msgObj.messageText
    );
    this.chatObj.msgMedia = msgObj.messageMedia;
    this.chatObj.parentMessageId = msgObj?.parentMessageId || null;
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
        this.newRoomCreated.emit(true);
        this.messageList = this.messageList.filter(
          (obj) => obj?.id !== data?.id && obj?.parentMessageId !== data.id
        );
        const array = new MessageDatePipe().transform(this.messageList);
        this.filteredMessageList = array;
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

                // const metaurls = res?.meta?.url || url;
                // const metaursl = Array.isArray(metaurls) ? metaurls?.[0] : metaurls;

                const metaursl = Array.isArray(url) ? url?.[0] : url;
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
    // const originUrl =
    //   'https://facetime.tube/' + `callId-${new Date().getTime()}`;
    const originUrl = `callId-${new Date().getTime()}`;
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
    var callSound = new Howl({
      src: [
        'https://s3.us-east-1.wasabisys.com/freedom-social/famous_ringtone.mp3',
      ],
      loop: true,
    });
    modalRef.componentInstance.calldata = data;
    modalRef.componentInstance.sound = callSound;
    modalRef.componentInstance.title = 'RINGING...';

    this.socketService?.startCall(data, (data: any) => {});
    modalRef.result.then((res) => {
      if (res === 'missCalled') {
        this.chatObj.msgText = 'You have a missed call';
        this.sendMessage();
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
      } else if (imageGif) {
        return content;
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
        this.socketService?.createGroup(res, (data: any) => {
          this.groupData = data;
          this.newRoomCreated.emit(true);
        });
      } else {
        this.newRoomCreated.emit(true);
        this.userChat = {};
      }
    });
  }

  // startTypingChat(isTyping) {
  //   const data = {
  //     groupId: this.userChat?.groupId,
  //     roomId: this.userChat?.roomId,
  //     profileId: this.profileId,
  //     isTyping: isTyping,
  //   };
  //   this.socketService?.startTyping(data, (data: any) => {});
  // }

  startTypingChat(isTyping: boolean) {
    clearTimeout(this.typingTimeout);
    const data = {
      groupId: this.userChat?.groupId,
      roomId: this.userChat?.roomId,
      profileId: this.profileId,
      isTyping: isTyping,
    };
    this.socketService?.startTyping(data, () => {});
    if (isTyping) {
      this.typingTimeout = setTimeout(() => this.startTypingChat(false), 3000);
    }
  }

  delayedStartTypingChat() {
    setTimeout(() => {
      this.startTypingChat(false);
    }, 3000);
  }

  notificationNavigation() {
    const isRead = localStorage.getItem('isRead');
    if (isRead === 'N') {
      this.originalFavicon['href'] = '/assets/images/icon.jpg';
      localStorage.setItem('isRead', 'Y');
      this.sharedService.isNotify = false;
    }
  }
}
