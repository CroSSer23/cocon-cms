import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CustomValidators } from "ng2-validation";
import { WebService } from '../shared/services/web.service';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import { CookieService } from "ngx-cookie-service";
import { AuthService } from '../shared/services/auth.service';
import { FirebaseService } from '../shared/services/firebase.service';
import * as moment from 'moment';
import { ChatService } from '../shared/services/chat.service';
import { BookingService } from '../shared/services/booking.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  passwordVisible = false;
  isSpinning: boolean;
  isLoggingIn: boolean;

  constructor(
    private fb: FormBuilder,
    private webapi: WebService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private cookieService: CookieService,
    private firebaseService: FirebaseService,
    private chatService: ChatService,
    private bookingService: BookingService
  ) { }

  ngOnInit(): void {
    this.toast.success({
      title: "Success",
      msg: "Successfully Logged In",
      timeout: 3000,
      theme: "bootstrap",
    });

    this.loginForm = this.fb.group({
      Email: [null, [Validators.required, CustomValidators.email]],
      Password: [null, [Validators.required]],
    });
  }

  submitForm() {
    // this.isSpinning = true;
    this.isLoggingIn = true;
    let obj = {
      Email: this.loginForm.controls.Email.value,
      Password: this.loginForm.controls.Password.value,
    };
    this.webapi.request("adminLogin", obj)
      .subscribe(
        data => {
          let userData = data.body.Data;
          console.log(userData);
          this.cookieService.set("loginStatus", "1", null, '/');
          this.cookieService.set("adminId", userData.AdminId, null, "/");
          this.cookieService.set("adminName", userData.Name, null, "/");
          this.cookieService.set("adminEmail", userData.Email, null, "/");
          this.cookieService.set("anonymousToken", userData.AnonymousToken, null, "/");
          this.cookieService.set("type", userData.Type, null, "/");
          this.cookieService.set("lastBookingCheck", moment().utc().format(), null, "/");
          this.cookieService.set("profileurl", userData.ProfileImageURL, null,"/");
          
          if (userData.Type !=2){
            this.bookingService.setInitialBookingData();
          this.firebaseService
            .signInWithEmailAndPassword(userData.Email, this.loginForm.controls.Password.value)
            .then(value => {
              this.toast.success({
                title: "Success",
                msg: data.headers.get('message'),
                timeout: 3000,
                theme: "bootstrap",
              });
              this.isLoggingIn = false;
              // this.isSpinning = false;
              if (userData.Type === 1) {
                this.router.navigate(['/support'])
              } else {
                this.router.navigate(['/dashboard'])
              }
              this.chatService.fetchMessages();
            })
          }else{
            console.log(userData)
            this.cookieService.set("organisationlocationId",userData.OrganisationLocationId , null, "/");
          this.cookieService.set("reachouttime",userData.ReachOutTime , null, "/");
          this.cookieService.set("imageurl",userData.ImageURL , null, "/");
          this.cookieService.set("imagepath",userData.ImagePath , null, "/");
            this.router.navigate(['/checkavailability'])
          }
          
        },
        error => {
          this.isLoggingIn = false;
          // this.isSpinning = false;
          // this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap",
          });
        }
      );
  }
}