import { DOCUMENT } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, takeUntil } from 'rxjs';
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
  implements AfterViewInit, OnChanges, AfterViewChecked, OnDestroy
{
  @Input('userChat') userChat: any = {};
  @Output('newRoomCreated') newRoomCreated: EventEmitter<any> =
    new EventEmitter<any>();
  @ViewChild('chatContent', { static: false }) chatContent: ElementRef;

  profileId: number;
  chatObj = {
    msgText: null,
    msgMedia: null,
    id: null,
  };
  selectedFile: any;

  messageList: any = [];
  metaURL: any = [];
  metaData: any = [];
  ngUnsubscribe: Subject<void> = new Subject<void>();
  isMetaLoader: boolean = false;

  pdfName: string = '';
  viewUrl: string;
  pdfmsg: string;
  messageInputValue: string;
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
    @Inject(DOCUMENT) private document: any
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    if (this.userChat?.roomId) {
      this.getMessageList();
    }
    this.socketService.socket.on('new-message', (data) => {
      console.log('new-message', data);
      this.newRoomCreated.emit(true);
      if (this.userChat?.roomId === data?.roomId) {
        let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        if (data?.isDeleted) {
          this.messageList.splice(index);
        } else if (this.messageList[index]) {
          this.messageList[index] = data;
        } else {
          this.messageList.push(data);
        }
      }
    });
    this.socketService.socket?.emit('online-users');
    this.socketService.socket.on('get-users', (data) => {
      data.map(ele => {
        if (!this.sharedService?.onlineUserList.includes(ele.userId)) {
          this.sharedService.onlineUserList.push(ele.userId)
        }
      })
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getMetaDataFromUrlStr();
    // console.log('input', this.userChat);
    if (this.userChat?.roomId) {
      this.getMessageList();
      this.socketService.socket.on('get-users', (data) => {
        data.map(ele => {
          if (!this.sharedService?.onlineUserList.includes(ele.userId)) {
            this.sharedService.onlineUserList.push(ele.userId)
          }
        })
      })
    }
  }

  // scroller down
  ngAfterViewChecked() {
    // this.getMetaDataFromUrlStr();
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
        console.log(data);
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
    console.log(this.chatObj);
    if (this.chatObj.id) {
      const data = {
        id: this.chatObj.id,
        messageText: this.chatObj?.msgText,
        roomId: this.userChat.roomId,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
      };
      this.socketService?.editMessage(data, (data: any) => {
        // this.userChat = data;
        console.log('edit-message', data);
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
      const data = {
        messageText: this.chatObj?.msgText,
        roomId: this.userChat.roomId,
        sentBy: this.profileId,
        messageMedia: this.chatObj?.msgMedia,
        profileId: this.userChat.profileId,
      };
      this.socketService.sendMessage(data, (data: any) => {
        console.log(data);
        this.newRoomCreated?.emit(true);
        this.messageList.push(data);
        this.resetData();
      });
    }
  }

  // getMessages
  getMessageList(): void {
    const messageObj = {
      page: 1,
      size: 200,
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
        console.log(ids);
        if (ids.length) {
          const data = {
            ids: ids,
          };
          this.socketService.readMessage(data, (res) => {
            console.log(res);
          });
        }
      },
      error: (err) => {},
    });
  }

  ngOnInit() {}

  scrollToBottom() {
    this.chatContent.nativeElement.scrollTop =
      this.chatContent.nativeElement.scrollHeight;
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
    } else {
      this.toastService.success('Post create successfully');
    }
    console.log(this.selectedFile);
  }

  removePostSelectedFile(): void {
    this.selectedFile = null;
    this.pdfName = null;
    this.viewUrl = null;
  }

  uploadPostFileAndCreatePost(): void {
    if (this.chatObj.msgText || this.selectedFile.name) {
      if (this.selectedFile) {
        this.postService.uploadFile(this.selectedFile).subscribe({
          next: (res: any) => {
            // this.spinner.hide();
            if (res?.body?.url) {
              this.chatObj.msgMedia = res?.body?.url;
              this.sendMessage();
            }
          },
          error: (err) => {
            console.log(err);
          },
        });
      } else {
        this.sendMessage();
      }
    } else {
      this.sendMessage();
    }
  }

  resetData(): void {
    this.chatObj.msgMedia = null;
    this.chatObj.msgText = null;
    this.viewUrl = null;
    this.pdfName = null;
    this.selectedFile = null;
    this.messageInputValue = null;
  }

  displayLocalTime(utcDateTime: string): string {
    const localTime = moment.utc(utcDateTime).local();
    return localTime.format('h:mm A');
  }

  isPdf(media: string): boolean {
    this.pdfmsg = media?.split('/')[3].replaceAll('%', '-');
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

  onTagUserInputChangeEvent(data: any): void {
    // // this.postMessageInputValue = data?.html
    // this.extractImageUrlFromContent(data.html);
    // // this.postData.postdescription = data?.html;
    // this.postData.meta = data?.meta;
    // this.postMessageTags = data?.tags;
    console.log(data.html);
    this.chatObj.msgText = data.html;
  }

  selectEmoji(emoji: any): void {
    // let htmlText = this.tagInputDiv?.nativeElement?.innerHTML || '';
    // const text = `${htmlText} <img src=${emoji} width="50" height="50">`;
    // this.setTagInputDivValue(text);
    // this.emitChangeEvent();
    this.chatObj.msgMedia = emoji;
    this.sendMessage();
  }

  editMsg(msgObj): void {
    this.chatObj['id'] = msgObj?.id;
    this.chatObj.msgText = msgObj.messageText;
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
        console.log(data);
        let index = this.messageList?.findIndex((obj) => obj?.id === data?.id);
        if (this.messageList[index]) {
          this.messageList.splice(index);
        }
      }
    );
  }

  getMetaData(messageUrl) {
    const matches = messageUrl?.match(/(?:https?:\/\/|www\.)[^\s]+/g);
    if (matches) {
      if (!this.metaURL.includes(matches?.[0])) {
        this.metaURL.push(matches?.[0]);
        this.getMetaDataFromUrlStr();
      }
    }
    return this.metaURL;
  }

  getMetaDataFromUrlStr(): void {
    // const url = this.metaURL;
    this.metaURL?.forEach((element) => {
      let metaData: any;
      if (element) {
        // if (element !== this.metaData?.url) {
        //   // this.spinner.show();
        this.isMetaLoader = true;
        this.ngUnsubscribe.next();
        this.postService
          .getMetaData({ url: element })
          .pipe(takeUntil(this.ngUnsubscribe))
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

                const metaurls = res?.meta?.url || element;
                const metaursl = Array.isArray(metaurls)
                  ? metaurls?.[0]
                  : metaurls;

                metaData = {
                  title: metatitle,
                  metadescription: res?.meta?.description,
                  metaimage: imgUrl,
                  metalink: metaursl,
                  url: element,
                };
                this.metaData.push(metaData);
                console.log(this.metaData);
              } else {
                metaData.metalink = element;
                this.metaData.push(metaData);
                console.log(this.metaData);
              }
              this.spinner.hide();
            },
            error: () => {
              this.isMetaLoader = false;
              metaData = {};
              this.spinner.hide();
            },
          });
        // }
      } else {
        this.metaData = [];
        this.isMetaLoader = false;
      }
    });
  }
}
