import { DOCUMENT } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as moment from 'moment';
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
export class ProfileChatsListComponent
  implements AfterViewInit, OnChanges, AfterViewChecked {
  @Input('userChat') userChat: any = {};
  @Output('newRoomCreated') newRoomCreated: EventEmitter<any> =
    new EventEmitter<any>();
  @ViewChild('chat-content') private myScrollContainer: ElementRef;

  profileId: number;
  chatObj = {
    msgText: null,
    msgMedia: null,
  };
  selectedFile: any;

  messageList: any = [];

  pdfName: string = '';
  viewUrl: string;
  pdfmsg: string;

  // messageList: any = [];
  constructor(
    private socketService: SocketService,
    public sharedService: SharedService,
    private messageService: MessageService,
    private postService: PostService,
    private toastService: ToastService,
    @Inject(DOCUMENT) private document: any
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    console.log('input', this.userChat);
    if (this.userChat?.roomId) {
      this.getMessageList();
    }
    this.socketService.socket.on('new-message', (data) => {
      console.log('new-message', data);
      this.messageList.push(data);
    });
    this.newRoomCreated.emit(true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.userChat?.roomId) {
      this.getMessageList();
    }
  }

  // scroller down
  ngAfterViewChecked() {
    this.scrollToBottom();
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
        roomId: this.userChat.roomId,
        profileId: this.profileId,
      },
      (data: any) => {
        console.log(data);
      }
    );
  }

  // send btn
  sendMessage(): void {
    const data = {
      messageText: this.chatObj?.msgText,
      roomId: this.userChat.roomId,
      sentBy: this.profileId,
      messageMedia: this.chatObj?.msgMedia,
      profileId: this.userChat.profileId,
    };
    console.log(data, this.chatObj);
    this.socketService.sendMessage(data, (data: any) => {
      console.log(data);
      this.messageList.push(data);
      this.resetData();
    });
    this.newRoomCreated?.emit(true);
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
        console.log(data);
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
      error: (err) => { },
    });
  }

  ngOnInit() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
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
}
