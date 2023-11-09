import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProfileService } from 'src/app/@shared/services/profile.service';

@Component({
  selector: 'app-research-details',
  templateUrl: './research-details.component.html',
  styleUrls: ['./research-details.component.scss']
})
export class ResearchDetailsComponent {

  groupDetails: any = {};
  posts: any = [];
  resources: any = [];
  isLoadMorePosts: boolean = true;
  pagination: any = {
    page: 1,
    limit: 12,
  }

  constructor(
    private profileService: ProfileService,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute
  ) {
    this.GetGroupBasicDetails();
  }

  GetGroupBasicDetails(): void {
    this.spinner.show();
    const uniqueLink = this.route.snapshot.paramMap.get('uniqueLink');

    this.profileService.getGroupBasicDetails(uniqueLink).subscribe({
      next: (res: any) => {
        if (res?.ID) {
          this.groupDetails = res;
          this.GetGroupPostById();
        }
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  GetGroupPostById(): void {
    this.spinner.show();

    this.profileService.getGroupPostById(this.groupDetails?.ID, this.pagination?.page, this.pagination?.limit).subscribe({
      next: (res: any) => {
        if (res?.length > 0) {
          this.posts = [...this.posts, ...res];
          this.isLoadMorePosts = res?.length === this.pagination?.limit;
        }
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  GetGroupFileResourcesById(id: string): void {
    this.spinner.show();

    this.profileService.getGroupFileResourcesById(id).subscribe({
      next: (res: any) => {
        if (res?.length > 0) {
          this.resources = res;
        }
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  loadMorePosts(): void {
    this.pagination.page += 1;
    this.GetGroupPostById();
  }
}
