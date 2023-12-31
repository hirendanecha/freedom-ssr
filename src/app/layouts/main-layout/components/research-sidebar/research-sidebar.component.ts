import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BreakpointService } from 'src/app/@shared/services/breakpoint.service';
import { ProfileService } from 'src/app/@shared/services/profile.service';
import { SeoService } from 'src/app/@shared/services/seo.service';

@Component({
  selector: 'app-research-sidebar',
  templateUrl: './research-sidebar.component.html',
  styleUrls: ['./research-sidebar.component.scss']
})
export class ResearchSidebarComponent {

  researches: any = [];
  isResearchTopicCollapse: boolean = false;
  // seoService: any;

  constructor(
    private profileService: ProfileService,
    private spinner: NgxSpinnerService,
    public breakpointService: BreakpointService,
    private seoService: SeoService
  ) {
    this.getGroups();
  }

  getGroups(): void {
    this.spinner.show();

    this.profileService.getGroups().subscribe({
      next: (res: any) => {
        if (res?.length > 0) {
          this.researches = res;
        }

        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }
}
