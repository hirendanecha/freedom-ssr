import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: any = io(environment.socketUrl, { transports: ["websocket"] });

  constructor() {
    this.socket = io(environment.socketUrl,  { transports: ["websocket"] });
  }

  // socket for posts //
  getPost(params, callback: (post: any) => void) {
    this.socket.emit('get-new-post', params, callback);
  }

  createOrEditPost({file, ...params}) {
    console.log(this.socket.connected, params);
    if (this.socket.connected){
      this.socket.emit('create-new-post', params);
    } else{
      this.socket.connect();
      this.socket.emit('create-new-post', params);
    }
    
  }

  editPost(params, callback: (post: any) => void) {
    this.socket.emit('create-new-post', params, callback);
  }

  // socket for community //
  getCommunityPost(params, callback: (post: any) => void) {
    this.socket.emit('get-community-post', params, callback);
  }

  createCommunityPost(params, callback: (post: any) => void) {
    this.socket.emit('create-community-post', params, callback);
  }

  createCommunity(params, callback: (post: any) => void) {
    this.socket.emit('create-new-community', params, callback);
  }

  getCommunity(params, callback: (post: any) => void) {
    this.socket.emit('get-new-community', params, callback);
  }

  likeFeedPost(params, callback: (post: any) => void) {
    this.socket.emit('likeOrDislike', params, callback);
  }

  likeFeedComments(params, callback: (post: any) => void) {
    this.socket.emit('likeOrDislikeComments', params, callback);
  }

  disLikeFeedPost(params, callback: (post: any) => void) {
    this.socket.emit('likeOrDislike', params, callback);
  }

  commentOnPost(params, callback: (data: any) => void) {
    this.socket.emit('comments-on-post', params, callback);
  }
}
