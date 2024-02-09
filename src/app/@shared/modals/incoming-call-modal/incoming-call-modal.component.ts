import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Howl } from 'howler';
import { SocketService } from '../../services/socket.service';
import { EncryptDecryptService } from '../../services/encrypt-decrypt.service';

@Component({
  selector: 'app-incoming-call-modal',
  templateUrl: './incoming-call-modal.component.html',
  styleUrls: ['./incoming-call-modal.component.scss'],
})
export class IncomingcallModalComponent implements OnInit, AfterViewInit {
  @Input() cancelButtonLabel: string = 'Hangup';
  @Input() confirmButtonLabel: string = 'Join';
  @Input() title: string = 'Incoming call...';
  @Input() calldata: any;
  @Input() sound: any;
  hangUpTimeout: any;
  currentURL: any = [];
  profileId: number
  constructor(
    public activateModal: NgbActiveModal,
    private socketService: SocketService,
    public encryptDecryptService: EncryptDecryptService,
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    const SoundOct = JSON.parse(
      localStorage.getItem('soundPreferences')
    )?.callSoundEnabled;
    if (SoundOct !== 'N') {
      if (this.sound) {
        this.sound?.play();
      }
    }

    this.hangUpTimeout = setTimeout(() => {
      this.hangUpCall();
    }, 60000);
    this.socketService.socket?.on('notification', (data: any) => {
      if (data?.actionType === 'DC') {
        this.sound.stop();
        this.activateModal.close('cancel');
      }
    });
  }

  ngOnInit(): void { }

  pickUpCall(): void {
    this.sound?.stop();
    clearTimeout(this.hangUpTimeout);
    if (!this.currentURL.includes(this.calldata?.link)) {
      this.currentURL.push(this.calldata.link)
      window.open(this.calldata.link, '_blank');
      this.sound?.stop();
    }
    this.activateModal.close('success');

    const data = {
      notificationToProfileId: this.calldata.notificationByProfileId || this.profileId,
      roomId: this.calldata?.roomId,
      groupId: this.calldata?.groupId,
      notificationByProfileId: this.calldata.notificationToProfileId || this.profileId,
      link: this.calldata.link,
    };
    console.log('pick-up-call', data)
    this.socketService?.pickUpCall(data, (data: any) => {
      console.log(data);
    });
  }

  hangUpCall(): void {
    this.sound?.stop();
    const data = {
      notificationToProfileId: this.calldata.notificationByProfileId || this.profileId,
      roomId: this.calldata?.roomId,
      groupId: this.calldata?.groupId,
      notificationByProfileId: this.calldata.notificationToProfileId || this.profileId,
    };
    this.socketService?.hangUpCall(data, (data: any) => {
      // console.log(data);
      this.sendMessage()
      this.activateModal.close('cancel');
    });
  }

  sendMessage() {
    const message = this.encryptDecryptService?.encryptUsingAES256('You have a missed call.');
    const data = {
      messageText: message,
      roomId: this.calldata?.roomId || null,
      groupId: this.calldata?.groupId || null,
      sentBy: this.calldata.notificationToProfileId || this.profileId,
      profileId: this.calldata.notificationByProfileId || this.profileId,
    };
    this.socketService.sendMessage(data, async (data: any) => { })
  }
}
