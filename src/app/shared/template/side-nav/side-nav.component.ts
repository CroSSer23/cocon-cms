import { Component } from '@angular/core';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { LoginService } from '../../services/login.service';
// import * as firebase from 'firebase/app';
// import 'firebase/database';
import { environment } from 'src/environments/environment';
// import * as moment from 'moment';
import { WebService } from '../../services/web.service';
import { CookieService } from 'ngx-cookie-service';
import { ChatService } from '../../services/chat.service';
import {
    faBuilding
  
  } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html',
    styleUrls: ['./side-nav.css'],
})

export class SideNavComponent {

    public menuItems: any[]
    isFolded: boolean;
    isSideNavDark: boolean;
    typeAgent: boolean;

    userUnreads = 0;
    staffUnreads = 0;
    faBuilding=faBuilding;
    userType:any
    // userMessagesRef: firebase.database.Reference;
    // staffMessagesRef: firebase.database.Reference;
    // BASE_REF: string;
    // userList: any[];
    // staffList: any[];
    // USER_REF = "users";
    // STAFF_REF = "therapist";
    // USER_MESSAGES_REF = "messages/user/";
    // STAFF_MESSAGES_REF = "messages/therapist/";
    newBookings = 0;
    // showBookingDot: boolean;
    // showChatDot: boolean;

    constructor(
        private themeService: ThemeConstantService,
        private loginService: LoginService,
        private webapi: WebService,
        private cookieService: CookieService,
        private chatService: ChatService
    ) {
        // this.BASE_REF = environment.FIREBASE_BASE_REF;
        // this.userList = [];
        // this.staffList = [];
        this.userType=this.loginService.getCookie("type")
    }

    ngOnInit(): void {
        this.menuItems = ROUTES.filter(menuItem => menuItem);
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
        if (parseInt(this.loginService.getCookie("type")) === 1) {
            const tempList = this.menuItems.filter(menu => menu.type !== "0");
            this.menuItems = [];
            this.menuItems = tempList;
        }else if(parseInt(this.loginService.getCookie("type")) === 2){
            const tempList = this.menuItems.filter(menu => menu.type == "2");
            this.menuItems = [];
            this.menuItems = tempList;
        }else{
            const tempList = this.menuItems.filter(menu => menu.type != "2");
            this.menuItems = [];
            this.menuItems = tempList;
        }
       
        this.chatService.userUnreadChanges.subscribe(unreads => this.userUnreads = unreads);
        this.chatService.staffUnreadChanges.subscribe(unreads => this.staffUnreads = unreads);
        // setInterval(f => {
        //     this.checkUserUnreads();
        //     this.checkStaffUnreads();
        // }, 100)
        // this.fetchMessages();
        if (parseInt(this.loginService.getCookie("type")) !=2) {
            console.log("in cookie")
            this.checkBookingCount();
        }
        
        setInterval(f => {
            this.newBookings = parseInt(this.cookieService.get("bookCount"));
        }, 1000)
    }

    // fetchMessages() {
    //     firebase.database().ref(this.BASE_REF + this.USER_REF).on("value", res => {
    //         this.userList = [];
    //         if (res.val()) {
    //             Object.keys(res.val()).forEach(element => {
    //                 this.userList.push({
    //                     UserId: element,
    //                     ...res.val()[element],
    //                     ImageURL: environment.BUCKET_URL + res.val()[element].ImagePath
    //                 })
    //             })
    //             this.waitUserList();
    //         }
    //     })
    //     firebase.database().ref(this.BASE_REF + this.STAFF_REF).on("value", res => {
    //         this.staffList = [];
    //         if (res.val()) {
    //             Object.keys(res.val()).forEach(element => {
    //                 this.staffList.push({
    //                     StaffId: element,
    //                     ...res.val()[element],
    //                     ImageURL: environment.BUCKET_URL + res.val()[element].ImagePath
    //                 })
    //             })
    //             this.waitStaffList();
    //         }
    //     })
    // }

    // waitUserList() {
    //     this.setUserLastMessageListener();
    //     this.checkUserUnreads();
    // }

    // waitStaffList() {
    //     this.setStaffLastMessageListener();
    //     this.checkStaffUnreads();
    // }

    // checkUserUnreads() {
    //     this.userUnreads = 0;
    //     this.userList.forEach(f => {
    //         if (f.isRead === false) {
    //             this.userUnreads += 1;
    //         }
    //     })
    //     // this.setChatDot();
    // }

    // checkStaffUnreads() {
    //     this.staffUnreads = 0;
    //     this.staffList.forEach(f => {
    //         if (f.isRead === false) {
    //             this.staffUnreads += 1;
    //         }
    //     })
    //     // this.setChatDot();
    // }
    // // setChatDot() {
    // //     if (this.userUnreads || this.staffUnreads) {
    // //         this.showChatDot = true;
    // //     } else {
    // //         this.showChatDot = false;
    // //     }
    // // }

    // setUserLastMessageListener() {
    //     for (let userInc = 0; userInc < this.userList.length; userInc++) {
    //         const user = this.userList[userInc];
    //         firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + user.UserId).limitToLast(1).on("child_added", val => {
    //             if (val.val()) {
    //                 let tempUserLastMessage = val.val();
    //                 let adminLastRead = moment(user.LastAdminRead);
    //                 let userLastMessageTime = moment(tempUserLastMessage.timestamp)
    //                 let found = this.userList.find(f => f.UserId === user.UserId);
    //                 found.LastMessage = tempUserLastMessage;
    //                 if (adminLastRead.isBefore(userLastMessageTime) && tempUserLastMessage.sender !== 1) {
    //                     found.isRead = false;
    //                 }
    //                 this.checkUserUnreads();
    //             }
    //         })
    //     }
    // }

    // setStaffLastMessageListener() {
    //     this.staffList.forEach(staff => {
    //         firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + staff.StaffId).limitToLast(1).on("child_added", val => {
    //             if (val.val()) {
    //                 let staffLastMessage = val.val()
    //                 const adminLastRead = moment(staff.LastAdminRead);
    //                 const staffLastMessageTime = moment(staffLastMessage.timestamp)
    //                 let found = this.staffList.find(f => f.StaffId === staff.StaffId);
    //                 found.LastMessage = staffLastMessage;
    //                 if (adminLastRead.isBefore(staffLastMessageTime) && staffLastMessage.sender !== 1) {
    //                     found.isRead = false;
    //                 }
    //                 this.checkStaffUnreads();
    //             }
    //         })
    //     })
    // }

    checkBookingCount() {
        if (this.loginService.getCookie("lastBookingCheck")) {
            let obj = {
                LastBookingCheck: this.loginService.getCookie("lastBookingCheck")
            }
            this.webapi.request("bookingBadgeCount", obj)
                .subscribe(
                    data => {
                        this.newBookings = data.body.Data.BookingCount;
                        this.cookieService.set('bookCount', this.newBookings.toString(), null, "/");
                        // this.newBookings ? this.showBookingDot = true : this.showBookingDot = false;
                        setTimeout(() => {
                            this.checkBookingCount();
                        }, environment.BOOKING_BADGE_INTERVAL);
                    },
                    error => {
                        console.warn(error.headers.get("message"))
                        setTimeout(() => {
                            this.checkBookingCount();
                        }, environment.BOOKING_BADGE_INTERVAL);
                    }
                )
        }
    }
}