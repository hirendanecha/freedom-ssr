import { NgModule } from '@angular/core';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { SharedModule } from 'src/app/@shared/shared.module';
import { PostDetailComponent } from './post-detail/post-detail.component';


@NgModule({
  declarations: [
    HomeComponent,
    PostDetailComponent,
  ],
  exports: [],
  imports: [HomeRoutingModule, PickerModule, SharedModule],
})
export class HomeModule {}
