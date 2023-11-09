import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'freedom-ssr';

  openLoginPage() {
    console.log('Login Button Clicked!!');
  }

  openSignPage() {
    console.log('Sign Up Button Clicked!!');
  }
}
