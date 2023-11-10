import { Component, HostListener, Inject } from '@angular/core';
import { SharedService } from './@shared/services/shared.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'freedom-ssr';
  showButton = false;

  constructor(
    private sharedService: SharedService,
    private spinner: NgxSpinnerService
  ) {
  }

  ngOnInit(): void {
    this.sharedService.getUserDetails();
  }

  ngAfterViewInit(): void {
    this.spinner.hide();
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
}
