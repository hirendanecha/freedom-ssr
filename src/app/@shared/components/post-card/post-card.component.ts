import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { PostService } from 'src/app/@shared/services/post.service';
import { SeeFirstUserService } from 'src/app/@shared/services/see-first-user.service';
import { SocketService } from 'src/app/@shared/services/socket.service';
import { ToastService } from 'src/app/@shared/services/toast.service';
import { UnsubscribeProfileService } from 'src/app/@shared/services/unsubscribe-profile.service';
import { ConfirmationModalComponent } from '../../modals/confirmation-modal/confirmation-modal.component';
import { SharedService } from 'src/app/@shared/services/shared.service';
import { slideUp } from '../../animations/slideUp';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import { ReplyCommentModalComponent } from '../../modals/reply-comment-modal/reply-comment-modal.component';
import { getTagUsersFromAnchorTags } from '../../utils/utils';
import { TokenStorageService } from '../../services/token-storage.service';
import { SeoService } from '../../services/seo.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

declare var jwplayer: any;
@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  animations: [slideUp],
})
export class PostCardComponent implements OnInit, AfterViewInit {
  @Input('post') post: any = {};
  @Input('seeFirstList') seeFirstList: any = [];
  @Output('getPostList') getPostList: EventEmitter<void> =
    new EventEmitter<void>();
  @Output('onEditPost') onEditPost: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('parentPostCommentElement', { static: false })
  parentPostCommentElement: ElementRef;

  profileId = '';
  isOpenCommentsPostId: number = null;

  commentList: any = [];
  replyCommentList: any = [];
  isReply = false;

  commentId = null;
  commentData: any = {
    file: null,
    url: '',
    tags: [],
    meta: {},
  };
  isParent: boolean = false;
  postComment = {};
  isCommentsLoader: boolean = false;
  isPostComment: boolean = false;
  webUrl = environment.webUrl;
  player: any;
  isExpand = false;
  commentCount = 0;
  commentMessageInputValue: string = '';
  commentMessageTags: any[];
  showHoverBox = false;

  constructor(
    private seeFirstUserService: SeeFirstUserService,
    private unsubscribeProfileService: UnsubscribeProfileService,
    private socketService: SocketService,
    private postService: PostService,
    private toastService: ToastService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    public sharedService: SharedService,
    private router: Router,
    private renderer: Renderer2,
    public tokenService: TokenStorageService,
    private seoService: SeoService,
    public breakpointService: BreakpointService
  ) {
    this.profileId = localStorage.getItem('profileId');
  }

  ngOnInit(): void {
    this.socketListner();
    this.viewComments(this.post?.id);
  }

  ngAfterViewInit(): void {
    if (this.post?.posttype === 'V') {
      this.playVideo(this.post?.id);
    }
  }

  removeSeeFirstUser(id: number): void {
    this.seeFirstUserService.remove(Number(this.profileId), id).subscribe({
      next: (res) => {
        this.toastService.warring('See first stop');
        this.getPostList?.emit();
      },
    });
  }

  seeFirst(postProfileId: number): void {
    this.seeFirstUserService
      .create({ profileId: this.profileId, seeFirstProfileId: postProfileId })
      .subscribe({
        next: (res) => {
          this.toastService.success('See first set');
          this.getPostList?.emit();
        },
      });
  }

  unsubscribe(post: any): void {
    // post['hide'] = true;

    this.unsubscribeProfileService
      .create({
        profileId: this.profileId,
        unsubscribeProfileId: post?.profileid,
      })
      .subscribe({
        next: (res) => {
          this.toastService.danger('Unsubscribe successfully');
          this.getPostList.emit();
          return true;
        },
      });
  }

  goToViewProfile(id: any): void {
    this.router.navigate([`settings/view-profile/${id}`]);
  }

  editPost(post): void {
    if (this.onEditPost) {
      this.onEditPost.emit(post);
    }
  }

  editComment(comment): void {
    if (comment.parentCommentId) {
      const modalRef = this.modalService.open(ReplyCommentModalComponent, {
        centered: true,
      });
      modalRef.componentInstance.title = 'Edit Comment';
      modalRef.componentInstance.confirmButtonLabel = 'Comment';
      modalRef.componentInstance.cancelButtonLabel = 'Cancel';
      modalRef.componentInstance.data = comment;
      modalRef.result.then((res) => {
        if (res) {
          this.commentData['tags'] = res?.tags;
          this.commentData.comment = res?.comment;
          this.commentData.postId = res?.postId;
          this.commentData.profileId = res?.profileId;
          this.commentData['id'] = res?.id;
          this.commentData.parentCommentId = res?.parentCommentId;
          this.commentData['file'] = res?.file;
          this.commentData['imageUrl'] = res?.url;
          this.uploadCommentFileAndAddComment();
        }
      });
    } else {
      // this.renderer.setProperty(
      //   this.parentPostCommentElement?.nativeElement,
      //   'innerHTML',
      //   comment.comment
      // );
      this.isReply = false;
      this.commentMessageInputValue = comment.comment;
      this.commentData['id'] = comment.id;
      if (comment.imageUrl) {
        this.commentData['imageUrl'] = comment.imageUrl;
        this.isParent = true;
      }
    }
    console.log(comment);
  }

  deletePost(post): void {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Delete Post';
    modalRef.componentInstance.confirmButtonLabel = 'Delete';
    modalRef.componentInstance.cancelButtonLabel = 'Cancel';
    modalRef.componentInstance.message =
      'Are you sure want to delete this post?';
    modalRef.result.then((res) => {
      if (res === 'success') {
        // post['hide'] = true;
        this.postService.deletePost(post.id).subscribe({
          next: (res: any) => {
            if (res) {
              this.toastService.success(res.message);
              this.getPostList.emit();
            }
          },
          error: (error) => {
            console.log('error : ', error);
          },
        });
      }
    });
  }

  reactLikeOnPost(post: any) {
    if (post.react != 'L') {
      post.likescount = post?.likescount + 1;
      post.totalReactCount = post?.totalReactCount + 1;
      post.react = 'L';
    }
    const data = {
      postId: post.id,
      profileId: this.profileId,
      likeCount: post.likescount,
      actionType: 'L',
      toProfileId: post.profileid,
    };
    this.likeDisLikePost(data);
  }

  dislikeFeedPost(post) {
    if (post.react == 'L' && post.likescount > 0) {
      post.likescount = post.likescount - 1;
      post.react = null;
      post.totalReactCount = post.totalReactCount - 1;
    }
    const data = {
      postId: post.id,
      profileId: this.profileId,
      likeCount: post.likescount,
      toProfileId: post.profileid,
    };
    this.likeDisLikePost(data);
  }

  likeDisLikePost(data): void {
    this.socketService.likeFeedPost(data, (res) => {
      console.log('likeOrDislike', res);
      return;
    });
  }

  viewComments(id: number): void {
    // this.isExpand = this.isOpenCommentsPostId == id ? false : true;
    // this.isOpenCommentsPostId = id;
    // if (!this.isExpand) {
    //   this.isOpenCommentsPostId = null;
    // } else {
    //   this.isOpenCommentsPostId = id;
    // }

    this.isOpenCommentsPostId = id;
    this.isCommentsLoader = true;
    const data = {
      postId: id,
      profileId: this.profileId,
    };
    this.postService.getComments(data).subscribe({
      next: (res) => {
        if (res) {
          // this.commentList = res.data.commmentsList.filter((ele: any) => {
          //   res.data.replyCommnetsList.some((element: any) => {
          //     if (ele?.id === element?.parentCommentId) {
          //       ele?.replyCommnetsList.push(element);
          //       return ele;
          //     }
          //   });
          // });
          this.commentList = res.data.commmentsList.map((ele: any) => ({
            ...ele,
            replyCommnetsList: res.data.replyCommnetsList.filter((ele1) => {
              return ele.id === ele1.parentCommentId;
            }),
          }));
          const replyCount = res.data.replyCommnetsList.filter((ele1) => {
            return ele1.parentCommentId;
          });
          this.commentCount = this.commentList.length + replyCount.length;
        }
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.isCommentsLoader = false;
      },
    });
  }

  deleteComments(comment): void {
    this.postService.deleteComments(comment.id).subscribe({
      next: (res: any) => {
        this.toastService.success(res.message);
        this.viewComments(comment?.postId);
      },
      error: (error) => {
        console.log(error);
        this.toastService.danger(error.message);
      },
    });
  }

  showReplySection(id) {
    this.isReply = this.commentId == id ? false : true;
    this.commentId = id;
    if (!this.isReply) {
      this.commentId = null;
    }
  }

  likeComments(comment) {
    if (comment.react != 'L') {
      comment.likeCount = comment.likeCount + 1;
      comment.react = 'L';
    }
    const data = {
      postId: comment.postId,
      commentId: comment.id,
      profileId: Number(this.profileId),
      toProfileId: Number(comment.profileId),
      likeCount: comment.likeCount,
      actionType: 'L',
    };
    this.likeDisLikePostComment(data);
  }

  disLikeComments(comment) {
    if (comment.react == 'L' && comment.likeCount > 0) {
      comment.likeCount = comment.likeCount - 1;
      comment.react = null;
    }
    const data = {
      postId: comment.postId,
      commentId: comment.id,
      profileId: Number(this.profileId),
      toProfileId: Number(comment.profileId),
      likeCount: comment.likeCount,
    };
    this.likeDisLikePostComment(data);
    // this.socketService.likeFeedComments(data, (res) => {
    //   return;
    // });
  }

  likeDisLikePostComment(data): void {
    this.socketService.likeFeedComments(data, (res) => {
      return;
    });
  }

  commentOnPost(postId, commentId = null): void {
    // const postComment = parentPostCommentElement.innerHTML;
    this.commentData.tags = getTagUsersFromAnchorTags(this.commentMessageTags);
    console.log(this.commentData);
    if (this.isPostComment === false) {
      if (this.commentData.comment || this.commentData?.file?.name) {
        this.isPostComment = true;
        // this.commentData.comment = postComment;
        this.commentData.postId = postId;
        this.commentData.profileId = this.profileId;
        if (commentId) {
          this.commentData['parentCommentId'] = commentId;
        }
        this.uploadCommentFileAndAddComment();
        // this.commentMessageInputValue = null;
        // parentPostCommentElement.innerHTML = ''
      } else {
        this.toastService.clear();
        this.toastService.danger('Please enter comment');
      }
    }
  }

  uploadCommentFileAndAddComment(): void {
    if (this.commentData?.comment || this.commentData?.file?.name) {
      if (this.commentData?.file?.name) {
        this.spinner.show();
        this.postService
          .upload(this.commentData?.file, this.profileId)
          .subscribe({
            next: (res: any) => {
              this.spinner.hide();
              if (res?.body?.url) {
                this.commentData['file'] = null;
                this.commentData['imageUrl'] = res?.body?.url;
                this.addComment();
                this.commentMessageInputValue = null;
              }
              // if (this.commentData.file?.size < 5120000) {
              // } else {
              //   this.toastService.warring('Image is too large!');
              // }
            },
            error: (err) => {
              this.spinner.hide();
            },
          });
      } else {
        this.addComment();
        this.commentMessageInputValue = null;
      }
    }
  }

  addComment(): void {
    if (this.commentData) {
      this.socketService.commentOnPost(this.commentData, (data) => {
        this.postComment = '';
        this.commentData = {};
        this.commentData.comment = '';
        this.commentData.tags = [];
        this.commentMessageTags = [];
        // childPostCommentElement.innerText = '';
      });
      this.commentMessageInputValue = '';
      setTimeout(() => {
        this.commentMessageInputValue = '';
      }, 100);
      this.commentData = {};
      this.isReply = false;
      this.viewComments(this.post?.id);
    }
    //  else {
    //   this.socketService.commentOnPost(this.commentData, (data) => {
    //     this.toastService.success('comment added on post');
    //     this.commentData.comment = '';
    //     this.commentData = {}
    //     // parentPostCommentElement.innerText = '';
    //     return data;
    //   });
    // }
  }

  onPostFileSelect(event: any, type: string): void {
    if (type === 'parent') {
      this.isParent = true;
    } else {
      this.isParent = false;
    }
    const file = event.target?.files?.[0] || {};
    if (file.type.includes('image/')) {
      this.commentData['file'] = file;
      this.commentData['imageUrl'] = URL.createObjectURL(file);
    } else {
      this.toastService.danger(`sorry ${file.type} are not allowed!`);
    }
    // if (file?.size < 5120000) {
    // } else {
    //   this.toastService.warring('Image is too large!');
    // }
  }

  removePostSelectedFile(): void {
    this.commentData['file'] = null;
    this.commentData['imageUrl'] = '';
  }

  playVideo(id: any) {
    if (this.player) {
      this.player.remove();
    }
    const config = {
      file: this.post?.streamname,
      image: this.post?.thumbfilename,
      mute: false,
      autostart: false,
      volume: 30,
      height: '300px',
      width: 'auto',
      pipIcon: 'disabled',
      displaydescription: true,
      playbackRateControls: false,
      aspectratio: '16:9',
      autoPause: {
        viewability: false,
      },
      controls: true,
    };
    if (id) {
      const jwPlayer = jwplayer('jwVideo-' + id);
      if (jwPlayer) {
        this.player = jwPlayer?.setup({
          ...config,
        });
        this.player?.load();
      }
    }
  }

  onTagUserInputChangeEvent(data: any): void {
    // console.log('comments-data', data)
    this.commentData.comment = data?.html;
    this.commentData.meta = data?.meta;
    this.commentMessageTags = data?.tags;
    console.log(this.commentData);
  }

  socketListner(): void {
    this.socketService.socket.on('likeOrDislike', (res) => {
      if (res[0]) {
        if (this.post.id === res[0]?.id) {
          this.post.likescount = res[0]?.likescount;
        }
      }
    });

    this.socketService.socket.on('likeOrDislikeComments', (res) => {
      console.log('likeOrDislikeComments', res);
      if (res[0]) {
        if (res[0].parentCommentId) {
          // let index = this.commentList.findIndex(obj => obj.id === res[0].parentCommentId);
          // let index1 = this.commentList.findIndex(obj => obj.replyCommnetsList.findIndex(ele => ele.id === res[0].id));
          // if (index1 !== -1 && index !== -1) {
          //   this.commentList[index].replyCommnetsList[index1].likeCount = res[0]?.likeCount;
          // }
          this.commentList.map((ele: any) =>
            res.filter((ele1) => {
              if (ele.id === ele1.parentCommentId) {
                let index = ele?.['replyCommnetsList']?.findIndex(
                  (obj) => obj?.id === res[0]?.id
                );
                if (index !== -1) {
                  return (ele['replyCommnetsList'][index].likeCount =
                    res[0]?.likeCount);
                } else {
                  return ele;
                }
              }
            })
          );
        } else {
          let index = this.commentList.findIndex(
            (obj) => obj?.id === res[0]?.id
          );
          if (index !== -1) {
            this.commentList[index].likeCount = res[0]?.likeCount;
          }
        }
        // if (this.post.id === res[0]?.id) {
        //   this.post.likescount = res[0]?.likescount;
        // }
      }
    });

    this.socketService.socket.on('comments-on-post', (data: any) => {
      this.isPostComment = false;
      console.log('comments-on-post', data[0]);
      if (data[0]?.parentCommentId) {
        this.commentList.map((ele: any) =>
          data.filter((ele1) => {
            if (ele.id === ele1.parentCommentId) {
              if (ele?.replyCommnetsList) {
                let index = ele?.['replyCommnetsList']?.findIndex(
                  (obj) => obj.id === data[0].id
                );
                if (!ele?.['replyCommnetsList'][index]) {
                  ele?.['replyCommnetsList'].push(ele1);
                  return ele;
                } else {
                  return ele;
                }
              } else {
                return ele;
              }
            }
          })
        );
      } else {
        let index = this.commentList.findIndex(
          (obj) => obj?.id === data[0]?.id
        );
        if (!this.commentList[index]) {
          this.commentList.push(data[0]);
        }
        this.viewComments(data[0]?.postId);
      }
    });
  }
}
