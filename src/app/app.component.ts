import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { SharedService } from './@shared/services/shared.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { SocketService } from './@shared/services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'freedom-ssr';
  showButton = false;
  tab: any;

  constructor(
    private sharedService: SharedService,
    private spinner: NgxSpinnerService,
    private socketService: SocketService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {

    this.checkDocumentFocus()
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.sharedService.getUserDetails();
    }
  }

  ngAfterViewInit(): void {
    this.spinner.hide();
    setTimeout(() => {
      const splashScreenLoader = document.getElementById('splashScreenLoader');
      if (splashScreenLoader) {
        splashScreenLoader.style.display = 'none';
      }
    }, 1000);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (window.scrollY > 300) {
      this.showButton = true;
    } else {
      this.showButton = false;
    }
  }

  scrollToTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  @HostListener('document:visibilitychange', ['$event']) checkDocumentFocus() {
    if (!window.document.hidden) {
      if (this.tab) {
        clearInterval(this.tab);  
      }
      if (!this.socketService.socket?.connected) {
        this.socketService.socket?.connect();
        const profileId = +localStorage.getItem('profileId');
        this.socketService.socket?.emit('join', { room: profileId });
      }
    } else {
      this.tab = setInterval(() => {
        if (!this.socketService.socket?.connected) {
          this.socketService.socket?.connect();
          const profileId = +localStorage.getItem('profileId');
          this.socketService.socket?.emit('join', { room: profileId });
        }
      }, 3000)

    }
  }
}
