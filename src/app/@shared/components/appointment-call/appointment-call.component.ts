import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

declare var JitsiMeetExternalAPI: any;
@Component({
  selector: 'app-appointment-call',
  templateUrl: './appointment-call.component.html',
  styleUrls: ['./appointment-call.component.scss'],
})
export class AppointmentCallComponent implements OnInit {
  appointmentCall: SafeResourceUrl;
  domain: string = 'facetime.tube';
  options: any;
  api: any;
  conferenceJoinedListener: any;
  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit() {
    const appointmentURLCall = this.route.snapshot['_routerState'].url.split('/freedom-call/')[1];
    this.options = {
      roomName: appointmentURLCall,
      parentNode: document.querySelector('#meet'),
      configOverwrite: {
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        filmStripOnly: false,
        SHOW_JITSI_WATERMARK: false,
      },
      disableModeratorIndicator: true,
    };

    const api = new JitsiMeetExternalAPI(this.domain, this.options);
    const numberOfParticipants = api.getNumberOfParticipants();
    const iframe = api.getIFrame();
    // console.log(numberOfParticipants);

    api.on('readyToClose', () => {
      this.router.navigate(['/profile-chats']).then(() => {
        // api.dispose();
        // console.log('opaaaaa');
      });
    });
  }
}
