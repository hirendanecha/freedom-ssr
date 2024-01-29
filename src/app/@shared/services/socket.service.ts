import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  public socket: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object,) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem("auth-token");
      if (token) {
        const customHeaders = {
          Authorization: `Bearer ${token}`
        };
        this.socket = io(environment.socketUrl, {
          reconnectionDelay: 100,
          reconnectionDelayMax: 300,
          // reconnection: true,
          randomizationFactor: 0.2,
          // timeout: 120000,
          reconnectionAttempts: 50000,
          transports: ['websocket'],
          auth: customHeaders
        });
      }
    }
  }

  // socket for posts //
  getPost(params, callback: (post: any) => void) {
    this.socket?.emit('get-new-post', params, callback);
  }

  createOrEditPost({ file, ...params }) {
    if (this.socket?.connected) {
      this.socket?.emit('create-new-post', params);
    } else {
      this.socket?.connect();
      this.socket?.emit('create-new-post', params);
    }
  }

  editPost(params, callback: (post: any) => void) {
    this.socket?.emit('create-new-post', params, callback);
  }

  // socket for community //
  getCommunityPost(params, callback: (post: any) => void) {
    this.socket?.emit('get-community-post', params, callback);
  }

  createCommunityPost(params, callback: (post: any) => void) {
    this.socket?.emit('create-community-post', params, callback);
  }

  createCommunity(params, callback: (post: any) => void) {
    this.socket?.emit('create-new-community', params, callback);
  }

  getCommunity(params, callback: (post: any) => void) {
    this.socket?.emit('get-new-community', params, callback);
  }

  likeFeedPost(params, callback: (post: any) => void) {
    this.socket?.emit('likeOrDislike', params, callback);
  }

  likeFeedComments(params, callback: (post: any) => void) {
    this.socket?.emit('likeOrDislikeComments', params, callback);
  }

  disLikeFeedPost(params, callback: (post: any) => void) {
    this.socket?.emit('likeOrDislike', params, callback);
  }

  commentOnPost(params, callback: (data: any) => void) {
    this.socket?.emit('comments-on-post', params, callback);
  }

  readNotification(params, callback: (data: any) => void) {
    this.socket?.emit('isReadNotification', params, callback);
  }

  getMeta(params) {
    this.socket?.emit('get-meta', params);
  }

  // socket for chat

  getChatList(params, callback: (data: any) => void) {
    this.socket?.emit('get-chat-list', params, callback);
  }

  createChatRoom(params, callback: (data: any) => void) {
    this.socket.emit('create-room', params, callback);
  }

  acceptRoom(params, callback: (data: any) => void) {
    this.socket.emit('accept-room', params, callback);
  }

  sendMessage(params, callback: (data: any) => void) {
    this.socket.emit('send-message', params, callback);
  }

  readMessage(params, callback: (data: any) => void) {
    this.socket.emit('read-message', params, callback);
  }

  editMessage(params, callback: (data: any) => void) {
    this.socket.emit('edit-message', params, callback);
  }

  deleteMessage(params, callback: (data: any) => void) {
    this.socket.emit('delete-message', params, callback);
  }
}
