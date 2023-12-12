import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { DeleteAccountComponent } from './delete-account/delete-account.component';
import { SeeFirstUserComponent } from './see-first-user/see-first-user.component';
import { UnsubscribedUsersComponent } from './unsubscribed-users/unsubscribed-users.component';
// import { MetafrenzyGuard } from 'ngx-metafrenzy';

const routes: Routes = [
  {
    path: 'edit-profile/:id',
    component: EditProfileComponent,
    data: {
      isShowLeftSideBar: false,
      isShowRightSideBar: false
    }
  },
  {
    path: 'view-profile/:id',
    component: ViewProfileComponent,
    // canActivate: mapToCanActivate([MetafrenzyGuard]),
    // data: {
    //   metafrenzy: {
    //     title: 'View Profile',
    //     tags: [
    //       {
    //         name: 'og:title',
    //         content: 'View Profile'
    //       }, {
    //         name: 'og:description',
    //         content: 'User Profile Page'
    //       }, {
    //         name: 'og:url',
    //         content: window.location.href
    //       }, {
    //         name: 'og:image',
    //         content: 'https://dev.freedom.buzz/assets/images/freedom-profile.jpg'
    //       }
    //     ],
    //     links: [
    //       {
    //         rel: 'canonical',
    //         href: window.location.href
    //       }
    //     ]
    //   }
    // }
  },
  {
    path: 'delete-profile',
    component: DeleteAccountComponent,
  },
  {
    path: 'see-first-users',
    component: SeeFirstUserComponent,
  },
  {
    path: 'unsubscribed-users',
    component: UnsubscribedUsersComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule { }
