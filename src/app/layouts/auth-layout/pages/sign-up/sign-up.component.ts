import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Customer } from 'src/app/@shared/constant/customer';
import { CustomerService } from 'src/app/@shared/services/customer.service';
import { UploadFilesService } from 'src/app/@shared/services/upload-files.service';
import { environment } from 'src/environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, AfterViewInit {
  customer = new Customer();
  isRegister = false;
  registrationMessage = '';
  userId = '';
  submitted = false;
  allCountryData: any;
  type = 'danger';
  defaultCountry = 'US';
  allStateData: any;
  profilePic: string;
  profileImg = { 
    file: null, 
    url: '',
  };
  theme = localStorage.getItem('theme') || '';
  passwordHidden = true;
  confirmpasswordHidden = true;

  @ViewChild('zipCode') zipCode: ElementRef;
  @ViewChild('captcha', { static: false }) captchaElement: ElementRef;

  registerForm = new FormGroup({
    FirstName: new FormControl(''),
    LastName: new FormControl(''),
    Username: new FormControl('', [Validators.required]),
    Email: new FormControl('', [Validators.required]),
    Password: new FormControl('', [Validators.required]),
    confirm_password: new FormControl('', [Validators.required]),
    MobileNo: new FormControl(''),
    Country: new FormControl('US', [Validators.required]),
    Zip: new FormControl(''),
    State: new FormControl(''),
    City: new FormControl(''),
    County: new FormControl(''),
    TermAndPolicy: new FormControl(false, Validators.requiredTrue),
    Anonymous: new FormControl(false),
  });
  
  constructor(
    private spinner: NgxSpinnerService,
    private customerService: CustomerService,
    private router: Router,
    private uploadService: UploadFilesService,
  ) {}

  ngOnInit(): void {
    this.getAllCountries();
  }

  ngAfterViewInit(): void {
    this.loadCloudFlareWidget();
  }

  loadCloudFlareWidget() {
    turnstile?.render(this.captchaElement.nativeElement, {
      sitekey: environment.siteKey,
      theme: this.theme === 'dark' ? 'light' : 'dark',
      callback: function (token) {
        localStorage.setItem('captcha-token', token);
        if (!token) {
          this.showMessage('Invalid captcha, kindly try again!', 'danger');
        }
      },
    });
  }

  togglePasswordVisibility(passwordInput: HTMLInputElement) {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    this.passwordHidden = !this.passwordHidden;
  }

  toggleConfirmPasswordVisibility(confirmpasswordInput: HTMLInputElement) {
    confirmpasswordInput.type =
      confirmpasswordInput.type === 'password' ? 'text' : 'password';
    this.confirmpasswordHidden = !this.confirmpasswordHidden;
  }

  selectFiles(event) {
    this.profileImg = event;
  }

  upload(file: any = {}) {
    if (file) {
      this.spinner.show();
      this.uploadService.uploadFile(file).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          if (res.body) {
            this.profilePic = res?.body?.url;
            this.createProfile(this.registerForm.value);
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.profileImg = { file: null, url: '' };
          this.showMessage('Could not upload the file', 'danger');
        },
      });
    } else {
      this.createProfile(this.registerForm.value);
    }
  }

  save() {
    const token = localStorage.getItem('captcha-token');
    if (!token) {
      this.showMessage('Invalid captcha, kindly try again!', 'danger');
      return;
    }
    if (this.registerForm.valid) {
      this.spinner.show();
      this.customerService.createCustomer(this.registerForm.value).subscribe({
        next: (data: any) => {
          this.spinner.hide();
          if (!data.error) {
            this.submitted = true;
            sessionStorage.setItem('user_id', data.data);
            this.registrationMessage = 'Account registered successfully! Please log in.';
            this.isRegister = true;
            this.upload(this.profileImg?.file);
            this.router.navigateByUrl('/login?isVerify=false');
          }
        },
        error: (err) => {
          this.showMessage(err.error.message, 'danger');
          this.spinner.hide();
        },
      });
    } else {
      this.showMessage('Please fill in the required fields.', 'danger');
    }
  }

  validateEmail() {
    const emailControl = this.registerForm.get('Email');
    const emailError = Validators.email(emailControl);
    if (emailError) {
      this.showMessage('Please enter a valid email address.', 'danger');
      return false;
    }
    return true;
  }

  validatepassword(): boolean {
    const pattern = '.{5,}';
    if (!this.registerForm.get('Password').value.match(pattern)) {
      this.showMessage('Password must be a minimum of 5 characters', 'danger');
      return false;
    }
    if (
      this.registerForm.get('Password').value !== 
      this.registerForm.get('confirm_password').value
    ) {
      this.showMessage('Passwords do not match', 'danger');
      return false;
    }
    return true;
  }

  onSubmit(): void {
    if (!this.validateEmail()) {
      return;
    }
    if (!this.validatepassword()) {
      return;
    }
    if (this.registerForm.valid) {
      this.save();
    } else {
      this.showMessage('Please fill in all required fields.', 'danger');
    }
  }

  changeCountry() {
    this.registerForm.get('Zip').setValue('');
    this.registerForm.get('State').setValue('');
    this.registerForm.get('City').setValue('');
    this.registerForm.get('County').setValue('');
  }

  getAllCountries() {
    this.spinner.show();
    this.customerService.getCountriesData().subscribe({
      next: (result) => {
        this.spinner.hide();
        this.allCountryData = result;
        this.getAllState(this.registerForm.get('Country').value);
      },
      error: (error) => {
        this.spinner.hide();
        console.log(error);
      },
    });
  }

  onCountryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.getAllState(target.value);
  }
  getAllState(country: string) {
    this.customerService.getStateData(country).subscribe({
      next: (result) => {
        this.allStateData = result;
        this.registerForm.get('State').setValue(result[0]?.state);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  showMessage(msg: string, type: string) {
    this.registrationMessage = msg;
    this.type = type;
    this.scrollTop();
  }

  changetopassword(event) {
    event.target.setAttribute('type', 'password');
  }

  createProfile(data) {
    this.spinner.show();
    const profile = {
      Username: data?.Username,
      FirstName: data?.FirstName,
      LastName: data?.LastName,
      Address: data?.Address,
      Country: data?.Country,
      City: data?.City,
      State: data?.State,
      County: data?.County,
      Zip: data?.Zip,
      MobileNo: data?.MobileNo,
      UserID: window?.sessionStorage?.user_id,
      IsActive: 'N',
      ProfilePicName: this.profilePic || null,
    };

    this.customerService.createProfile(profile).subscribe({
      next: (data: any) => {
        this.spinner.hide();

        if (data) {
          const profileId = data.data;
          localStorage.setItem('profileId', profileId);
        }
      },
      error: (err) => {
        this.spinner.hide();
      },
    });
  }

  scrollTop() {
    window.scrollTo({ 
      top: 0, 
      left: 0, 
      behavior: 'smooth',
    });
  }
  onChangeTag(event) {
    this.registerForm.get('Username').setValue(event.target.value.replaceAll(' ', '').replaceAll(/\s*,+\s*/g, ','));
  }

  convertToUppercase(event: any) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = inputElement.value.replace(/\s/g, '').toUpperCase();
  }
}
