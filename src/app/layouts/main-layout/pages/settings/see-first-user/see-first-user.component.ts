import { Component } from '@angular/core';
import { SeeFirstUserService } from 'src/app/@shared/services/see-first-user.service';
import { ToastService } from 'src/app/@shared/services/toast.service';

@Component({
  selector: 'app-see-first-user',
  templateUrl: './see-first-user.component.html',
  styleUrls: ['./see-first-user.component.scss'],
})
export class SeeFirstUserComponent {
  profiles: any[] = [];

  constructor(
    private seeFirstUserService: SeeFirstUserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.getSeeFirstUsers();
  }

  getSeeFirstUsers(): void {
    const profileId = +localStorage.getItem('profileId');

    if (profileId > 0) {
      this.seeFirstUserService.getByProfileId(profileId).subscribe({
        next: (res: any) => {
          this.profiles = res?.length > 0 ? res : [];
        },
      });
    }
  }

  removeSeeFirstUser(id: number): void {
    this.seeFirstUserService.remove(id).subscribe({
      next: (res: any) => {
        this.getSeeFirstUsers();
        this.toastService.success(res.message);
      },
    });
  }
}
