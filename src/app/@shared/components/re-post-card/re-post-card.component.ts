import { AfterViewInit, Component, Input, OnInit, afterNextRender } from '@angular/core';
import { PostService } from '../../services/post.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { TokenStorageService } from '../../services/token-storage.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { Router } from '@angular/router';

declare var jwplayer: any;
@Component({
  selector: 'app-re-post-card',
  templateUrl: './re-post-card.component.html',
  styleUrls: ['./re-post-card.component.scss'],
})
export class RePostCardComponent implements AfterViewInit, OnInit {
  @Input('id') id: any = {};

  descriptionimageUrl: string;
  post: any = {};

  webUrl = environment.webUrl;
  tubeUrl = environment.tubeUrl;

  sharedPost: string
  player: any
  showHoverBox = false;
  profileId = '';

  constructor(private postService: PostService,
    private spinner: NgxSpinnerService,
    public tokenService: TokenStorageService,
    public breakpointService: BreakpointService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.getPostById();
  }

  ngAfterViewInit(): void {
  }

  getPostById(): void {
    this.spinner.show();
    this.postService.getPostsByPostId(this.id).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.post = res[0];
      },
      error: (err) => {
        this.spinner.hide();
        console.log(err);
      },
    });
  }

  redirectToParentProfile(post) {
    if (this.post.streamname) {
      this.sharedPost = this.tubeUrl + 'video/' + post.id;
    } else {
      this.sharedPost = this.webUrl + 'post/' + post.id;
    }
    const url = this.sharedPost;
    window.open(url, '_blank');
  }

  selectMessaging(data) {
    const userData = {
      Id: data.profileid,
      ProfilePicName: data.ProfilePicName,
      Username: data.Username,
    };
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    const url = this.router
      .createUrlTree(['/profile-chats'], {
        queryParams: { chatUserData: encodedUserData },
      })
      .toString();
    window.open(url, '_blank');
  }
}
