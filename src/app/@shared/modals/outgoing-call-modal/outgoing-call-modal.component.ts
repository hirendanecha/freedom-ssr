import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-outgoing-call-modal',
  templateUrl: './outgoing-call-modal.component.html',
  styleUrls: ['./outgoing-call-modal.component.scss'],
})
export class OutGoingCallModalComponent implements OnInit, AfterViewInit {
  @Input() cancelButtonLabel: string = 'Hangup';
  @Input() confirmButtonLabel: string = 'Join';
  @Input() title: string = 'Outgoing call...';
  @Input() calldata: any;
  @Input() sound: any;

  hangUpTimeout: any;
  constructor(
    public activateModal: NgbActiveModal,
    private socketService: SocketService
  ) {}

  ngAfterViewInit(): void {
    const SoundOct = JSON.parse(
      localStorage.getItem('soundPreferences')
    )?.callSoundEnabled;
    if (SoundOct !== 'N') {
      if (this.sound) {
        this.sound?.play();
      }
    }
    this.socketService.socket?.on('notification', (data: any) => {
      if (data?.actionType === 'DC') {
        this.activateModal.close('cancel');
      }
    });
  }

  ngOnInit(): void {}

  pickUpCall(): void {
    this.sound?.stop();
    clearTimeout(this.hangUpTimeout);
    window.open(this.calldata.link, '_blank');
    this.activateModal.close('success');
  }

  hangUpCall(): void {
    this.sound?.stop();
    const data = {
      notificationToProfileId: this.calldata.notificationToProfileId,
      roomId: this.calldata.roomId,
      notificationByProfileId: this.calldata.notificationByProfileId,
    };
    this.socketService?.hangUpCall(data, (data: any) => {
      console.log(data);
      this.activateModal.close('cancel');
    });
  }
}
