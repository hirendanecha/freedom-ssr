import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Howl } from 'howler';
import { SocketService } from '../../services/socket.service';

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
  constructor(
    public activateModal: NgbActiveModal,
    private socketService: SocketService
  ) { }

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
    window.open(this.calldata.link, '_blank');
    this.activateModal.close('success');

    const data = {
      notificationToProfileId: this.calldata.notificationByProfileId,
      roomId: this.calldata.roomId,
      notificationByProfileId: this.calldata.notificationToProfileId,
      link: this.calldata.link,
    };
    this.socketService?.pickUpCall(data, (data: any) => {
      console.log(data);
    });
  }

  hangUpCall(): void {
    this.sound?.stop();
    const data = {
      notificationToProfileId: this.calldata.notificationByProfileId,
      roomId: this.calldata.roomId,
      notificationByProfileId: this.calldata.notificationToProfileId,
    };
    this.socketService?.hangUpCall(data, (data: any) => {
      // console.log(data);
      this.activateModal.close('cancel');
    });
  }
}
