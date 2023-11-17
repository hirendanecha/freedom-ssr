import { NgModule } from '@angular/core';
import { RouterModule, Routes, mapToCanActivate } from '@angular/router';
import { HomeComponent } from './home.component';
import { PostDetailComponent } from './post-detail/post-detail.component';
import { AuthenticationGuard } from 'src/app/@shared/guards/authentication.guard';
import { MetafrenzyGuard } from 'ngx-metafrenzy';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: mapToCanActivate([MetafrenzyGuard]),
    data: {
      metafrenzzy: {
        title: 'Home',
        tags: [
          {
            name: 'og:title',
            content: 'Freedom Home Page',
          },
          {
            name: 'og:description',
            content: 'Welcome to freedom buzz home page',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
          {
            name: 'og:image',
            content:
              'https://freedom.buzz/assets/images/banner/freedom-buzz-high-res.jpeg',
          },
        ],
        links: [
          {
            rel: 'canonical',
            href: window.location.href,
          },
        ],
      },
    },
  },
  {
    path: 'communities/:name',
    component: HomeComponent,
    canActivate: mapToCanActivate([MetafrenzyGuard, AuthenticationGuard]),
    data: {
      metafrenzzy: {
        title: 'Community',
        tags: [
          {
            name: 'og:title',
            content: 'Freedom Community',
          },
          {
            name: 'og:description',
            content: 'Freedom local community',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
          {
            name: 'og:image',
            content:
              'https://dev.freedom.buzz/assets/images/freedom-community.jpg',
          },
        ],
        links: [
          {
            rel: 'canonical',
            href: window.location.href,
          },
        ],
      },
    },
  },
  {
    path: 'pages/:name',
    component: HomeComponent,
    canActivate: mapToCanActivate([AuthenticationGuard, MetafrenzyGuard]),
    data: {
      metafrenzzy: {
        title: 'Pages',
        tags: [
          {
            name: 'og:title',
            content: 'Freedom Pages',
          },
          {
            name: 'og:description',
            content: 'Freedom Groups and pages',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
          {
            name: 'og:image',
            content: 'https://dev.freedom.buzz/assets/images/freedom-pages.jpg',
          },
        ],
        links: [
          {
            rel: 'canonical',
            href: window.location.href,
          },
        ],
      },
    },
  },
  {
    path: 'post/:id',
    component: PostDetailComponent,
    canActivate: mapToCanActivate([MetafrenzyGuard]),
    data: {
      metafrenzzy: {
        title: 'Posts',
        tags: [
          {
            name: 'og:title',
            content: 'Freedom Feed Posts',
          },
          {
            name: 'og:description',
            content: 'Freedom Buzz local News Feed Posts',
          },
          {
            name: 'og:url',
            content: window.location.href,
          },
          {
            name: 'og:image',
            content: 'https://dev.freedom.buzz/assets/images/freedom-post.jpg',
          },
        ],
        links: [
          {
            rel: 'canonical',
            href: window.location.href,
          },
        ],
      },
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule { }
