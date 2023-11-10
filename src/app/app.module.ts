import { NgModule } from '@angular/core';
import {
  BrowserModule,
  Meta,
  provideClientHydration,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ToastsContainerComponent } from './@shared/components/toasts-container/toasts-container.component';
import { LandingPageComponent } from './layouts/auth-layout/pages/landing-page/landing-page.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationGuard } from './@shared/guards/authentication.guard';
import { SharedModule } from './@shared/shared.module';
import { SeoService } from './@shared/services/seo.service';

@NgModule({
  declarations: [AppComponent, ToastsContainerComponent, LandingPageComponent],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  providers: [
    AuthenticationGuard,
    CookieService,
    Meta,
    SeoService,
    provideClientHydration(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
