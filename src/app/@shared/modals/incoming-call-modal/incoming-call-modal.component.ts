import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Howl } from 'howler';
import { SocketService } from '../../services/socket.service';
import { EncryptDecryptService } from '../../services/encrypt-decrypt.service';
import { SoundControlService } from '../../services/sound-control.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incoming-call-modal',
  templateUrl: './incoming-call-modal.component.html',
  styleUrls: ['./incoming-call-modal.component.scss'],
})
export class IncomingcallModalComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() cancelButtonLabel: string = 'Hangup';
  @Input() confirmButtonLabel: string = 'Join';
  @Input() title: string = 'Incoming call...';
  @Input() calldata: any;
  @Input() sound: any;
  hangUpTimeout: any;
  currentURL: any = [];
  profileId: number;
  soundEnabledSubscription: Subscription;

  constructor(
    public activateModal: NgbActiveModal,
    private socketService: SocketService,
    public encryptDecryptService: EncryptDecryptService,
    private soundControlService: SoundControlService,
    private router: Router,
  ) {
    this.profileId = +localStorage.getItem('profileId');
  }

  ngAfterViewInit(): void {
    this.soundControlService.initStorageListener();
    // this.sound?.close();
    this.soundEnabledSubscription =
      this.soundControlService.soundEnabled$.subscribe((soundEnabled) => {
        if (soundEnabled === false) {
          // console.log(soundEnabled);
          this.sound?.stop();
        }
      });
    const SoundOct = JSON.parse(
      localStorage.getItem('soundPreferences')
    )?.callSoundEnabled;
    if (SoundOct !== 'N') {
      if (this.sound) {
        this.sound?.play();
      }
    }
    if (!this.hangUpTimeout) {
      this.hangUpTimeout = setTimeout(() => {
        this.hangUpCall(false);
      }, 60000);
    }
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
      this.currentURL.push(this.calldata.link);
      // window.open(this.calldata.link, '_blank');

      console.log('incomin',this.calldata.link);
      // this.router.navigate([`/appointment-call/${this.calldata.link}`]);  
      const callId = this.calldata.link.replace('https://facetime.tube/', '');
      this.router.navigate([`/freedom-call/${callId}`]);
      this.sound?.stop();
    }
    this.activateModal.close('success');

    const data = {
      notificationToProfileId:
        this.calldata.notificationByProfileId || this.profileId,
      roomId: this.calldata?.roomId,
      groupId: this.calldata?.groupId,
      notificationByProfileId:
        this.calldata.notificationToProfileId || this.profileId,
      link: this.calldata.link,
    };
    this.socketService?.pickUpCall(data, (data: any) => {
      return;
    });
  }

  hangUpCall(isCallCut): void {
    this.sound?.stop();
    clearTimeout(this.hangUpTimeout);
    const data = {
      notificationToProfileId:
        this.calldata.notificationByProfileId || this.profileId,
      roomId: this.calldata?.roomId,
      groupId: this.calldata?.groupId,
      notificationByProfileId:
        this.calldata.notificationToProfileId || this.profileId,
    };
    this.socketService?.hangUpCall(data, (data: any) => {
      if (isCallCut) {
        const message = `I'll call you back.`;
        this.sendMessage(message);
      } else {
        const message = `You have a missed call.`;
        this.sendMessage(message);
      }
      this.activateModal.close('cancel');
    });
  }

  sendMessage(message: string) {
    // const message = this.encryptDecryptService?.encryptUsingAES256(`I'll call you back.`);
    const data = {
      messageText: this.encryptDecryptService?.encryptUsingAES256(message),
      roomId: this.calldata?.roomId || null,
      groupId: this.calldata?.groupId || null,
      sentBy: this.calldata.notificationToProfileId || this.profileId,
      profileId: this.calldata.notificationByProfileId || this.profileId,
    };
    this.socketService.sendMessage(data, async (data: any) => { });
  }

  ngOnDestroy(): void {
    this.soundEnabledSubscription.unsubscribe();
  }
}
