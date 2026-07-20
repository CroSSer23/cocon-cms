import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import 'firebase/database';
import { CookieService } from 'ngx-cookie-service';
import { FirebaseService } from './firebase.service';

@Injectable()
export class ChatService {

    userUnreads = 0;
    staffUnreads = 0;
    userMessagesRef: firebase.database.Reference;
    staffMessagesRef: firebase.database.Reference;
    BASE_REF: string;
    userList: any[];
    staffList: any[];
    USER_REF = "users";
    STAFF_REF = "therapist";
    USER_MESSAGES_REF = "messages/user/";
    STAFF_MESSAGES_REF = "messages/therapist/";
    newBookings = 0;
    showBookingDot: boolean;
    showChatDot: boolean;

    constructor(
        private cookieService: CookieService,
        private firebaseService: FirebaseService
    ) {
        this.BASE_REF = environment.FIREBASE_BASE_REF;
        this.userList = [];
        this.staffList = [];
        setInterval(f => {
            this.checkUserUnreads();
            this.checkStaffUnreads();
        }, 500);
        this.fetchMessages();
    }

    private userUnreadsActived = new BehaviorSubject<number>(this.userUnreads);
    userUnreadChanges: Observable<number> = this.userUnreadsActived.asObservable();

    private staffUnreadsActived = new BehaviorSubject<number>(this.staffUnreads);
    staffUnreadChanges: Observable<number> = this.staffUnreadsActived.asObservable();

    fetchMessages() {
        this.userList = [];
        this.staffList = [];
        let lastMonth = moment();
        firebase.database().ref(this.BASE_REF + this.USER_REF).on("value", res => {
            let response = res.val();
            if (response) {
                Object.keys(response).forEach(element => {
                    if (moment(response[element].LastUserRead).isAfter(lastMonth)) {
                        let userExist = this.userList.find(f=> f.UserId === element);
                        if (!userExist) {
                            this.userList.push({
                                UserId: element,
                                ...response[element],
                                ImageURL: environment.BUCKET_URL + response[element].ImagePath
                            })
                        } else {
                            userExist.LastAdminRead = response[element].LastAdminRead;
                        }
                    }
                })
                this.waitUserList();
            }
        }, (errorCall) => {
            console.log(errorCall)
            if (this.cookieService.get("adminEmail")) {
                this.firebaseService.signInWithEmailAndPassword(this.cookieService.get("adminEmail"), window.localStorage.getItem("FRBCL"))
                    .then((val) => {
                        this.fetchMessages();
                    });
            }
        })
        firebase.database().ref(this.BASE_REF + this.STAFF_REF).on("value", res => {
            let response = res.val();
            if (response) {
                Object.keys(response).forEach(element => {
                    let staffExist = this.staffList.find(f=> f.StaffId === element);
                    if (!staffExist) {
                        this.staffList.push({
                            StaffId: element,
                            ...response[element],
                            ImageURL: environment.BUCKET_URL + response[element].ImagePath
                        })
                    }
                })
                this.waitStaffList();
            }
        })
    }

    waitUserList() {
        this.setUserLastMessageListener();
        // this.checkUserUnreads();
    }

    waitStaffList() {
        this.setStaffLastMessageListener();
        // this.checkStaffUnreads();
    }

    checkUserUnreads() {
        this.userUnreads = 0;
        this.userList.forEach(f => {
            if (f.LastAdminRead && f.LastMessage && f.LastMessage.timestamp) {
                if (moment(f.LastAdminRead).isBefore(moment(f.LastMessage.timestamp)) && f.LastMessage.sender !== 1) {
                    this.userUnreads += 1;
                }
            }
            else if (!f.LastAdminRead) {
                this.userUnreads += 1;
            }
            // if (f.isRead === false) {
            //     this.userUnreads += 1;
            // }
        })
        this.userUnreadsActived.next(this.userUnreads);
        // this.setChatDot();
    }

    checkStaffUnreads() {
        this.staffUnreads = 0;
        this.staffList.forEach(f => {
            if (f.LastAdminRead && f.LastMessage && f.LastMessage.timestamp) {
                if (moment(f.LastAdminRead).isBefore(moment(f.LastMessage.timestamp)) && f.LastMessage.sender !== 1) {
                    this.staffUnreads += 1;
                }
            }
            // if (f.isRead === false) {
            //     this.staffUnreads += 1;
            // }
        })
        this.staffUnreadsActived.next(this.staffUnreads);
        // this.setChatDot();
    }

    // setChatDot() {
    //     if (this.userUnreads || this.staffUnreads) {
    //         this.showChatDot = true;
    //     } else {
    //         this.showChatDot = false;
    //     }
    // }

    setUserLastMessageListener() {
        for (let userInc = 0; userInc < this.userList.length; userInc++) {
            const user = this.userList[userInc];
            if (!user.lastMsgListener) {
                user.lastMsgListener = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + user.UserId).limitToLast(1)
                user.lastMsgListener.on("child_added", val => {
                    if (val.val()) {
                        let tempUserLastMessage = val.val();
                        let adminLastRead = moment(user.LastAdminRead);
                        let userLastMessageTime = moment(tempUserLastMessage.timestamp)
                        let found = this.userList.find(f => f.UserId === user.UserId);
                        found.LastMessage = tempUserLastMessage;
                        if (!user.LastAdminRead || (adminLastRead.isBefore(userLastMessageTime) && tempUserLastMessage.sender !== 1)) {
                            found.isRead = false;
                        }
                        this.checkUserUnreads();
                    }
                })
            }
        }
    }

    setStaffLastMessageListener() {
        this.staffList.forEach(staff => {
            if (!staff.lastMsgListener) {
                staff.lastMsgListener = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + staff.StaffId).limitToLast(1);
                staff.lastMsgListener.on("child_added", val => {
                    if (val.val()) {
                        let staffLastMessage = val.val()
                        const adminLastRead = moment(staff.LastAdminRead);
                        const staffLastMessageTime = moment(staffLastMessage.timestamp)
                        let found = this.staffList.find(f => f.StaffId === staff.StaffId);
                        found.LastMessage = staffLastMessage;
                        if (adminLastRead.isBefore(staffLastMessageTime) && staffLastMessage.sender !== 1) {
                            found.isRead = false;
                        }
                        this.checkStaffUnreads();
                    }
                })
            }
        })
    }
}