import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-re-post-card',
  templateUrl: './re-post-card.component.html',
  styleUrls: ['./re-post-card.component.scss'],
})
export class RePostCardComponent implements AfterViewInit {
  @Input('id') id: any = {};

  descriptionimageUrl: string;
  post: any = {};

  constructor(private postService: PostService) {}
  ngAfterViewInit(): void {
    this.getPostById(); 
  }

  getPostById(): void {
    this.postService.getPostsByPostId(this.id).subscribe({
      next: (res: any) => {
        this.post = res[0]
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
