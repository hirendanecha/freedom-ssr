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
  @Input() cancelButtonLabel: string | undefined = 'Hangup';
  @Input() confirmButtonLabel: string | undefined = 'Join';
  @Input() title: string | undefined = 'Incoming call...';
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

    this.hangUpTimeout = setTimeout(() => {
      this.hangUpCall();
    }, 60000);
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
