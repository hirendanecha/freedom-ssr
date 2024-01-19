import { Component, ElementRef, Renderer2 } from '@angular/core';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommunityService } from 'src/app/@shared/services/community.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { ProfileChatsSidebarComponent } from './profile-chats-sidebar/profile-chats-sidebar.component';

@Component({
  selector: 'app-freedom-page',
  templateUrl: './profile-chats.component.html',
  styleUrls: ['./profile-chats.component.scss'],
})
export class ProfileChartsComponent {
  activeIdTab: string = 'local';
  pageList = [];
  profileId: number;
  isPageLoader: boolean = false;

  mobileMenuToggle: boolean = false;

  userChat: any = {};

  sidebar: any = {
    isShowLeftSideBar: true,
    isShowRightSideBar: true,
    isShowResearchLeftSideBar: false,
    isShowChatListSideBar: true,
  };

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private spinner: NgxSpinnerService,
    private communityService: CommunityService,
    private seoService: SeoService,
    private renderer: Renderer2,
    private el: ElementRef,
    private offcanvasService: NgbOffcanvas
  ) {
    // this.profileId = Number(localStorage.getItem('profileId'));
    // this.getPages();
    // const data = {
    //   title: 'Freedom.Buzz Freedom Pages',
    //   url: `${location.href}`,
    //   description: '',
    // };
    // this.seoService.updateSeoMetaData(data);
  }

  mobileMenu(): void {
    this.mobileMenuToggle = !this.mobileMenuToggle;
    this.renderer.setStyle(
      this.el.nativeElement.ownerDocument.body,
      'overflow',
      'hidden'
    );
  }

  onChatPost(userName: any) {
    console.log('userName  : ', userName);
    this.userChat = userName;
  }
  // createCommunity() {
  //   const modalRef = this.modalService.open(AddFreedomPageComponent, {
  //     centered: true,
  //     backdrop: 'static',
  //     keyboard: false,
  //     size: 'lg'
  //   });
  //   modalRef.componentInstance.cancelButtonLabel = 'Cancel';
  //   modalRef.componentInstance.confirmButtonLabel = 'Create';
  //   modalRef.componentInstance.closeIcon = true;
  //   modalRef.result.then(res => {
  //     if (res === 'success') {
  //       this.activeIdTab = 'my';
  //       this.getPages();
  //     }
  //   });
  // }

  // getPages(): void {
  //   let getPagesObs = null;
  //   this.pageList = [];

  //   if (this.activeIdTab === 'joined') {
  //     getPagesObs = this.communityService.getJoinedCommunityByProfileId(
  //       this.profileId,
  //       'page'
  //     );
  //   } else if (this.activeIdTab === 'local') {
  //     getPagesObs = this.communityService.getCommunity(this.profileId, 'page');
  //   } else {
  //     getPagesObs = this.communityService.getCommunityByUserId(
  //       this.profileId,
  //       'page'
  //     );
  //   }

  //   this.isPageLoader = true;
  //   getPagesObs?.subscribe({
  //     next: (res: any) => {
  //       if (res?.data) {
  //         this.pageList = res?.data;
  //       } else {
  //         this.pageList = [];
  //       }
  //     },
  //     error: (error) => {
  //       console.log(error);
  //     },
  //     complete: () => {
  //       this.isPageLoader = false;
  //     },
  //   });
  // }

  // goToFindCommunity() {
  //   this.router.navigate(['/communities-post']);
  // }

  openChatListidebar() {
    this.offcanvasService.open(ProfileChatsSidebarComponent, {
      position: 'start',
      panelClass: 'w-300-px',
    });
  }
}
