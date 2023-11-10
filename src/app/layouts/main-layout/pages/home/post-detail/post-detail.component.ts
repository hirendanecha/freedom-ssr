import {
  Component,
  OnInit,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PostService } from 'src/app/@shared/services/post.service';
import { SeoService } from 'src/app/@shared/services/seo.service';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit {

  postId: string = '';
  post: any = {};

  constructor(
    private spinner: NgxSpinnerService,
    private postService: PostService,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private metaService: Meta
  ) {
    this.postId = this.route.snapshot.paramMap.get('id');
    console.log('route', this.route);
    if (this.postId) {
      this.getPostsByPostId();
    }
  }


  addTag() {
    const html = document.createElement('div');
    html.innerHTML = this.post?.postdescription || this.post?.metadescription;
    this.metaService.updateTag({ property: 'og:description', content: html.textContent });
    this.metaService.updateTag({ property: 'twitter:description', content: html.textContent });
    this.metaService.updateTag({ name: 'description', content: html.textContent });
    this.metaService.addTag({ name: 'robots', content: 'index,follow' });
    this.metaService.updateTag({ property: 'og:title', content: this.post?.title });
    this.metaService.updateTag({ property: 'twitter:title', content: this.post?.title });
    this.metaService.updateTag({ property: 'og:url', content: window.location.href });
    this.metaService.updateTag({ property: 'twitter:url', content: window.location.href });
    this.metaService.updateTag({ property: 'og:image', content: (this.post?.imageUrl || this.post?.metaimage || this.post?.thumbfilename) });
    this.metaService.updateTag({ property: 'twitter:image', content: (this.post?.imageUrl || this.post?.metaimage || this.post?.thumbfilename) });
  }

  ngOnInit(): void {

  }

  getPostsByPostId(): void {
    this.spinner.show();

    this.postService.getPostsByPostId(this.postId).subscribe(
      {
        next: (res: any) => {
          this.spinner.hide();
          if (res?.[0]) {
            this.post = res?.[0];
            const html = document.createElement('div');
            html.innerHTML = this.post?.postdescription || this.post?.metadescription;
            // this.addTag();
            const data = {
              title: this.post?.title,
              url: `${environment.webUrl}post/${this.postId}`,
              description: html.textContent,
              image: this.post?.imageUrl,
              video: this.post?.streamname
            }
            this.seoService.updateSeoMetaData(data, true);
          }
        },
        error:
          (error) => {
            this.spinner.hide();
            console.log(error);
          }
      });
  }
}
