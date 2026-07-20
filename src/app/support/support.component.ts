import { Component, OnInit, HostListener } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/database';
import * as moment from 'moment';
import { environment } from '../../environments/environment'
import * as cloneDeep from 'lodash/cloneDeep';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { WebService } from '../shared/services/web.service';
import { ChatService } from '../shared/services/chat.service';


@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css'],
  host: {
    '(window:resize)': 'onResize($event)'
  },
  animations: [
    trigger("slideIn", [
      state("*", style({ "overflow-y": "hidden" })),
      state("void", style({ "overflow-y": "hidden" })),
      transition("* => void", [
        style({ height: "*" }),
        animate(250, style({ height: 0 })),
      ]),
      transition("void => *", [
        style({ height: "0" }),
        animate(250, style({ height: "*" })),
      ]),
    ]),
    trigger("slideInRight", [
      state("*", style({ "overflow-x": "hidden" })),
      state("void", style({ "overflow-x": "hidden" })),
      transition("* => void", [
        style({ width: "*" }),
        animate(250, style({ width: "*" })),
      ]),
      transition("void => *", [
        style({ width: "0" }),
        animate(250, style({ width: 0 })),
      ]),
    ]),
    trigger("enterAnimation", [
      transition(":enter", [
        style({ transform: "translateX(100%)", opacity: 0 }),
        animate("500ms", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate("500ms", style({ transform: "translateX(100%)", opacity: 0 })),
      ]),
    ]),
    trigger("topAnimation", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate("500ms", style({ transform: "translateY(0)", opacity: 1 })),
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("500ms", style({ transform: "translateY(100%)", opacity: 0 })),
      ]),
    ]),
    trigger("fadeInOut", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 })),
      ]),
      transition(":leave", [
        animate(500, style({ opacity: 0 })),
      ]),
    ]),
  ]
})

export class SupportComponent implements OnInit {
  userList: any;
  userMessages: any[];
  messageInput: any;
  selectedUserId: any;
  rawUserData: any[];
  userDetails: any;
  isSpinning: boolean;
  newUserList: any[];
  smallDevice: boolean;
  chatWindowVisible: boolean;
  BASE_REF: string;
  isSpinningStaff: boolean;
  staffList: any[];
  selectedStaffId: any;
  staffMessages: any[];
  staffDetails: any;
  selectedChatUser: string;
  USER_REF = "users";
  USER_DETAIL_REF = "users/";
  USER_MESSAGES_REF = "messages/user/";
  STAFF_REF = "therapist";
  STAFF_DETAIL_REF = "therapist/";
  STAFF_MESSAGES_REF = "messages/therapist/";
  userMessagesRef: firebase.database.Reference;
  staffMessagesRef: firebase.database.Reference;
  userUnreads: number;
  staffUnreads: number;
  requestedUserRef: firebase.database.Reference;
  isLoadingChat: boolean;
  mainListenerUser: firebase.database.Reference;
  mainListenerStaff: firebase.database.Reference;
  userIds: any[];
  dateRange:any[]=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
  staffDateRange:any[]=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
  visible:false;
  staffVisible:false;
  lastMsgListener:any
  staffWeekSelected;
  staffMonthSelected;
  
  constructor(
    private router: Router,
    private webapi: WebService,
    private chatService: ChatService,
    
  ) {
    this.isSpinning = true;
    this.isSpinningStaff = true;
    this.BASE_REF = environment.FIREBASE_BASE_REF;

    this.newUserList = [];
    this.staffList = [];

    let currentRoute = this.router.getCurrentNavigation();
    if (currentRoute.extras.state && currentRoute.extras.state.userId) {
      let requestedChatUser = currentRoute.extras.state.userId;
      let ref = this.BASE_REF + this.USER_DETAIL_REF;
      this.requestedUserRef = firebase.database().ref(ref);
      this.requestedUserRef.once('value', res => {
        if (!res.child(requestedChatUser + "").exists()) {
          // Create a new user on firebase and set its details, then open chat window for this user.
          this.webapi.request("getUser", {
            UserId: requestedChatUser
          }).subscribe(
            data => {
              let userData = [...data.body.Data];
              let userDetail = userData[0];
              let pushObj = {
                Name: userDetail.Name,
                ImagePath: userDetail.ImagePath ? userDetail.ImagePath : "",
                LastAdminRead: moment().utc().format(),
                LastUserRead: moment().utc().subtract(5, "minute").format()
              }
              firebase.database()
                .ref(this.BASE_REF + this.USER_DETAIL_REF + requestedChatUser)
                .set(pushObj).then(f => {
                  this.fetchMessages(requestedChatUser + "");
                })
            }
          )
        } else {
          // just open chat window for this user.
          // this.openChatWindow(requestedChatUser);
          this.fetchMessages(requestedChatUser + "");
        }
      })
    } else {
      this.fetchMessages();
    }
    this.setUserLastMessageListener();
  }

  ngOnInit() {
    if (window.screen.width < 768) {
      this.smallDevice = true;
      this.chatWindowVisible = false;
    } else {
      this.smallDevice = false;
      this.chatWindowVisible = true;
    }
    this.userUnreads = 0;
    this.staffUnreads = 0;
    this.chatService.userUnreadChanges.subscribe(unreads => this.userUnreads = unreads);
    this.chatService.staffUnreadChanges.subscribe(unreads => this.staffUnreads = unreads);
    console.log(moment().endOf('month').utc().format())
    this.dateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
    this.staffDateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
    // setInterval(f => {
    //   this.checkUserUnreads();
    //   this.checkStaffUnreads();
    // }, 100)
    
  }

  ngOnDestroy() {
    this.selectedUserId = null;
    this.selectedStaffId = null;
    if (this.mainListenerUser) {
      this.mainListenerUser.off();
    }
    if (this.mainListenerStaff) {
      this.mainListenerStaff.off();
    }
    this.newUserList.forEach(user => {
      if (user.lastMsgListener && user.lastMsgListener.off) {
        user.lastMsgListener.off();
      }
    })
    this.newUserList = [];
    this.staffList.forEach(staff => {
      if (staff.lastMsgListener && staff.lastMsgListener.off) {
        staff.lastMsgListener.off();
      }
    })
    this.staffList = [];
  }

  fetchMessages(userId = null) {
    console.log("staffMonthSelected"+this.staffMonthSelected)
    let firstTime = true;
    this.newUserList = [];
    this.staffList = [];
    let lastMonth = moment().subtract(30, "days");
    this.mainListenerUser = firebase.database().ref(this.BASE_REF + this.USER_REF)
    console.log(this.dateRange)
    console.log(this.staffDateRange)
    let start = moment(this.dateRange[0]).startOf('day').utc().format()
    let end = moment(this.dateRange[1]).endOf('day').utc().format()

    let startStaff = moment(this.staffDateRange[0]).startOf('day').utc().format()
    let endStaff = moment(this.staffDateRange[1]).endOf('day').utc().format()

    this.mainListenerUser.orderByChild("LastMessageTime").startAt(start).endAt(end).on("value", res => {
      this.isSpinning = true;
      let response = (res.val()) ? res.val() : {}
      console.log(response)

      Object.keys(response).forEach(element => {

        let adminLastRead = moment(response[element].LastAdminRead);
          let userLastMessageTime = moment(response[element].LastMessageTime)
         
       
          // if (!user.LastAdminRead || ((adminLastRead.isBefore(userLastMessageTime)) && tempUserLastMessage.sender !== 1)) {
          //   found.isRead = false;
          // } else {
          //   found.isRead = true;
          // }
          // if (this.selectedUserId === user.UserId && this.router.url === "/support") {
          //   found.isRead = true;
          //   this.setAdminReadTime(this.USER_DETAIL_REF, this.selectedUserId);
          // }



        let textToShow = ""
        if (response[element].LastMessage.length > 35) {
          textToShow = response[element].LastMessage.substring(0, 34) + "...";
        } else {
          textToShow = response[element].LastMessage;
        }

        if (!response[element].LastAdminRead || ((adminLastRead.isBefore(userLastMessageTime)) && response[element].Sender !== 1)) {
          response[element].isRead = false;
        } else {
          response[element].isRead = true;
        }

        if (firstTime && userId == null) {
          this.newUserList.push({
            UserId: element,
            ...response[element],
            ImageURL: environment.BUCKET_URL + response[element].ImagePath,
            LastMessageData: {
              "epoch": moment(response[element].LastMessageTime).toDate().getTime(),
              "textToShow": textToShow,
              "timestamp": response[element].LastMessageTime

            }
          })
          // this.userIds.push(element);
        } else {
          // let userExist = this.newUserList.find(f=> f.UserId === element);
          let userExist = this.newUserList.findIndex(f => f.UserId === element);
          if (userExist < 0) {
            this.newUserList.push({
              UserId: element,
              ...response[element],
              ImageURL: environment.BUCKET_URL + response[element].ImagePath,
              LastMessageData: {
                "epoch": moment(response[element].LastMessageTime).toDate().getTime(),
                "textToShow": textToShow,
                "timestamp": response[element].LastMessageTime

              }
            })
            // this.userIds.push(element);            
          } else {
            this.newUserList[userExist].LastAdminRead = response[element].LastAdminRead;
            this.newUserList[userExist].LastMessageTime = response[element].LastMessageTime;
            this.newUserList[userExist].LastMessage = response[element].LastMessage;
            this.newUserList[userExist].isRead = response[element].isRead;
            this.newUserList[userExist].LastMessageData = {
              "epoch": moment(response[element].LastMessageTime).toDate().getTime(),
              "textToShow": textToShow,
              "timestamp": response[element].LastMessageTime

            }

          }
        }
        // }
      })
      this.isSpinning = false;
      if (userId) {
        let isUserExist = this.newUserList.findIndex(f => f.UserId === userId);
        let newUser = {}
        if (isUserExist < 0) {
          console.log(this.BASE_REF + this.USER_REF + '/' + userId);
          var selectedUserRef = firebase.database().ref(this.BASE_REF + this.USER_REF + '/' + userId)
          selectedUserRef.once("value", userSnap => {
            console.log(userSnap);
            let value = userSnap.val()
            console.log(value);
            if (userSnap.exists()) {

              let adminLastRead = moment(value.LastAdminRead);
              let userLastMessageTime = moment(value.LastMessageTime)
              
              let textToShow = ""
              if (value.LastMessage) {
                if (value.LastMessage.length > 35) {
                  textToShow = value.LastMessage.substring(0, 34) + "...";
                } else {
                  textToShow = value.LastMessage;
                }
              } else {
                textToShow = ""
              }
              let isRead=false
              if (!value.LastAdminRead || ((adminLastRead.isBefore(userLastMessageTime)) && value.Sender !== 1)) {
                isRead = false;
              } else {
                isRead = true;
              }
      
              newUser = {
                UserId: userId,
                ...value,
                ImageURL: environment.BUCKET_URL + value.ImagePath,
                isRead:isRead,
                LastMessageData: {
                  "epoch": moment(value.LastMessageTime).toDate().getTime(),
                  "textToShow": textToShow,
                  "timestamp": value.LastMessageTime

                }
              }
              console.log(this.newUserList)
              console.log(newUser)
              this.newUserList.push(newUser)
              this.openChatWindow(userId);
              userId = null;
              firstTime = false;

            }
          });

        }
        else {
          console.log(this.newUserList[isUserExist])
          this.openChatWindow(userId);
          userId = null;
          firstTime = false;
        }

      }

      this.waitUserList();
      firstTime = false;
      // this.sortList();
    })
    console.log("calling")
    this.mainListenerStaff = firebase.database().ref(this.BASE_REF + this.STAFF_REF)
    console.log(startStaff)
    console.log(endStaff)
    this.mainListenerStaff.orderByChild("LastMessageTime").startAt(startStaff).endAt(endStaff).on("value", res => {
      this.isSpinningStaff = true;
      let response = (res.val()) ? res.val() : {}
      console.log(response)
      Object.keys(response).forEach(element => {

        let textToShow = ""
        if (response[element].LastMessage.length > 35) {
          textToShow = response[element].LastMessage.substring(0, 34) + "...";
        } else {
          textToShow = response[element].LastMessage;
        }


        let adminLastRead = moment(response[element].LastAdminRead);
        let staffLastMessageTime = moment(response[element].LastMessageTime)
       
       
        if (adminLastRead.isBefore(staffLastMessageTime)) {
          response[element].isRead = false;
        } else {
          response[element].isRead = true;
        }
        if (this.selectedStaffId === response[element].StaffId && this.router.url === "/support") {
          response[element].isRead = true;
          this.setAdminReadTime(this.STAFF_DETAIL_REF, this.selectedStaffId);
        }
       
        let staffExist = this.staffList.findIndex(f => f.StaffId === element);
        console.log(this.staffList)
        console.log(staffExist)
        if (staffExist< 0) {
          this.staffList.push({
            StaffId: element,
            ...response[element],
            ImageURL: environment.BUCKET_URL + response[element].ImagePath,
            LastMessageData: {
              "epoch": moment(response[element].LastMessageTime).toDate().getTime(),
              "textToShow": textToShow,
              "timestamp": response[element].LastMessageTime

            }
          })
        }
        else {
          this.staffList[staffExist].LastAdminRead = response[element].LastAdminRead;
          this.staffList[staffExist].LastMessageTime = response[element].LastMessageTime;
          this.staffList[staffExist].LastMessage = response[element].LastMessage;
          this.staffList[staffExist].isRead = response[element].isRead;
          this.staffList[staffExist].LastMessageData = {
            "epoch": moment(response[element].LastMessageTime).toDate().getTime(),
            "textToShow": textToShow,
            "timestamp": response[element].LastMessageTime

          }

        }
      })
      this.isSpinningStaff = false;
      this.waitStafFList();
    })

  }



  async waitUserList() {
    // await this.fetchUserLastMessage();
    // this.setUserLastMessageListener();
    this.sortList();
    // this.checkUserUnreads();
  }

  async waitStafFList() {
    // await this.fetchStaffLastMessage();
    // this.setStaffLastMessageListener();
    this.sortStaffList();
    // this.checkStaffUnreads();
  }

  fetchUserLastMessage() {
    return new Promise((resolve, reject) => {
      this.newUserList.forEach((element, index) => {
        firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + element.UserId).limitToLast(1).once("child_added", val => {
          element.LastMessage = val.val()
          element.LastMessage.epoch = moment(element.LastMessage.timestamp).toDate().getTime();
          if (element.LastMessage.text.length > 33) {
            element.LastMessage.textToShow = element.LastMessage.text.substring(0, 30) + "...";
          } else {
            element.LastMessage.textToShow = element.LastMessage.text;
          }
          if (index === (this.newUserList.length - 1)) {
            // this.checkUserUnreads();
            resolve(true);
          }
        })
      });
    })
  }

  fetchStaffLastMessage() {
    return new Promise((resolve, reject) => {
      this.staffList.forEach((element, index) => {
        firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + element.StaffId).limitToLast(1).once("child_added", val => {
          element.LastMessage = val.val()
          element.LastMessage.epoch = moment(element.LastMessage.timestamp).toDate().getTime();
          if (element.LastMessage.text.length > 33) {
            element.LastMessage.textToShow = element.LastMessage.text.substring(0, 30) + "...";
          } else {
            element.LastMessage.textToShow = element.LastMessage.text;
          }
          if (index === (this.staffList.length - 1)) {
            // this.checkStaffUnreads();
            resolve(true);
          }
        })
      });
    })
  }

  sortList(): void {
    this.newUserList.sort((a, b) => {
      if (b.LastMessageData && a.LastMessageData) {
        return b.LastMessageData.epoch - a.LastMessageData.epoch
      } else {
        if (!b.LastMessageData) {
          return -1;
        }
        if (!a.LastMessageData) {
          return 1;
        }
        if (!b.LastMessageData && !a.LastMessageData) {
          return 0;
        }
      }
    });
  }

  sortStaffList(): void {
    this.staffList = this.staffList.sort((a, b) => {
      if (b.LastMessageData && a.LastMessageData) {
        return b.LastMessageData.epoch - a.LastMessageData.epoch
      } else {
        if (!b.LastMessageData) {
          return -1;
        }
        if (!a.LastMessageData) {
          return 1;
        }
        if (!b.LastMessageData && !a.LastMessageData) {
          return 0;
        }
      }
    })
  }

  setUserLastMessageListener() {
    for (let userInc = 0; userInc < this.newUserList.length; userInc++) {
      const user = this.newUserList[userInc];
      if (!user.lastMsgListener) {
        user.lastMsgListener = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + user.UserId).limitToLast(1)
        user.lastMsgListener.on("child_added", val => {
          let tempUserLastMessage = val.val();
          tempUserLastMessage.epoch = moment(tempUserLastMessage.timestamp).toDate().getTime();
          if (tempUserLastMessage.text.length > 35) {
            tempUserLastMessage.textToShow = tempUserLastMessage.text.substring(0, 34) + "...";
          } else {
            tempUserLastMessage.textToShow = tempUserLastMessage.text;
          }
          let adminLastRead = moment(user.LastAdminRead);
          let userLastMessageTime = moment(tempUserLastMessage.timestamp)
          let found = this.newUserList.find(f => f.UserId === user.UserId);
          found.LastMessage = tempUserLastMessage;
          if (!user.LastAdminRead || ((adminLastRead.isBefore(userLastMessageTime)) && tempUserLastMessage.sender !== 1)) {
            found.isRead = false;
          } else {
            found.isRead = true;
          }
          if (this.selectedUserId === user.UserId && this.router.url === "/support") {
            found.isRead = true;
            this.setAdminReadTime(this.USER_DETAIL_REF, this.selectedUserId);
          }
          this.sortList();
          // this.checkUserUnreads();
        })
      }
    }
  }

 

  setStaffLastMessageListener() {
    for (let staffInc = 0; staffInc < this.staffList.length; staffInc++) {
      const staff = this.staffList[staffInc];
      staff.lastMsgListener = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + staff.StaffId).limitToLast(1);
      if (!staff.lastMsgListener) {
        staff.lastMsgListener.on("child_added", val => {
          let staffLastMessage = val.val()
          staffLastMessage.epoch = moment(staffLastMessage.timestamp).toDate().getTime();
          if (staffLastMessage.text.length > 35) {
            staffLastMessage.textToShow = staffLastMessage.text.substring(0, 34) + "...";
          } else {
            staffLastMessage.textToShow = staffLastMessage.text;
          }
          let adminLastRead = moment(staff.LastAdminRead);
          let staffLastMessageTime = moment(staffLastMessage.timestamp)
          let found = this.staffList.find(f => f.StaffId === staff.StaffId);
          found.LastMessage = staffLastMessage;
          if (adminLastRead.isBefore(staffLastMessageTime)) {
            found.isRead = false;
          } else {
            found.isRead = true;
          }
          if (this.selectedStaffId === staff.StaffId && this.router.url === "/support") {
            found.isRead = true;
            this.setAdminReadTime(this.STAFF_DETAIL_REF, this.selectedStaffId);
          }
          this.sortStaffList();
          // this.checkStaffUnreads();
        })
      }
    }
  }

  setAdminReadTime(ref: string, id: string) {
    switch (ref) {
      case this.USER_DETAIL_REF: {
        if (this.selectedUserId !== id) {
          return;
        }
        break;
      }
      case this.STAFF_DETAIL_REF: {
        if (this.selectedStaffId != id) {
          return;
        }
        break;
      }
      default:
        break;
    }
    console.log("admin Read update for : " + id)
    let adminReadRef = firebase.database().ref(this.BASE_REF + ref + id + "/LastAdminRead")
    adminReadRef.set(moment().utc().format());
    adminReadRef.off();
  }

  setLastMessageTime(ref: string, id: string,obj) {
    switch (ref) {
      case this.USER_DETAIL_REF: {
        if (this.selectedUserId !== id) {
          return;
        }
        break;
      }
      case this.STAFF_DETAIL_REF: {
        if (this.selectedStaffId != id) {
          return;
        }
        break;
      }
      default:
        break;
    }
    if(obj){
      console.log("last message update for : " + id)
    let lastMessageRef = firebase.database().ref(this.BASE_REF + ref +'/'+ id+'/LastMessage' )
    console.log(this.BASE_REF + ref +'/'+ id+'/LastMessage')
    lastMessageRef.set(obj.text);
    lastMessageRef.off();
    let lastMessageTimeRef = firebase.database().ref(this.BASE_REF + ref +'/'+ id+'/LastMessageTime' )
    console.log(this.BASE_REF + ref +'/'+ id+'/LastMessageTime')
    lastMessageTimeRef.set(obj.timestamp);
    lastMessageTimeRef.off();

    let lastMessageSenderRef = firebase.database().ref(this.BASE_REF + ref +'/'+ id+'/Sender' )
    console.log(this.BASE_REF + ref +'/'+ id+'/Sender')
    lastMessageSenderRef.set(obj.sender);
    lastMessageSenderRef.off();
    }
    
  }

  openChatWindow(userId) {
    this.messageInput = null;
    if (window.screen.width < 768) {
      this.chatWindowVisible = true;
    }
    if (this.selectedChatUser === "staff") {
      this.selectedStaffId = null;
      this.staffMessagesRef = null;
      this.staffMessages = [];
      this.staffDetails = null;
    }
    this.selectedChatUser = "user";
    if (this.selectedUserId !== userId) {
      this.selectedUserId = userId;
      this.userMessages = [];
      let foundUser = this.newUserList.find(f => f.UserId === userId);
      let foundUserIndex = this.newUserList.findIndex(f => f.UserId === userId);
      foundUser.isRead = true;
      this.userDetails = foundUser;
      this.userMessages = [];
      if (this.userMessagesRef) {
        this.userMessagesRef.off("child_added", (err) => {
          console.log(err)
        });
        this.userMessagesRef = null;
      }
      this.isLoadingChat = true;
      this.userMessagesRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + this.selectedUserId);
      this.userMessagesRef.on('child_added', res => {
        this.isLoadingChat = false;
        if (this.selectedUserId === userId) {
          let result = res.val();
          let dateString = moment(result.timestamp).format("MMM DD, YYYY")
          let foundGroup = this.userMessages.find(f => f.DateString === dateString);
          if (!foundGroup) {
            this.userMessages.push({
              DateString: dateString,
              Messages: [result]
            })
          } else {
            let mesFound = foundGroup.Messages.find(f => f.text === result.text && f.timestamp === result.timestamp);
            if (!mesFound) {
              foundGroup.Messages.push(result);
            }
          }
          let adminLastRead = moment(this.userDetails.LastAdminRead);
          let userLastMessageTime = moment(this.userDetails.LastMessageTime)
          if (!this.userDetails.LastAdminRead || ((adminLastRead.isBefore(userLastMessageTime)))) {
            this.newUserList[foundUserIndex].isRead=true;
            this.setAdminReadTime(this.USER_DETAIL_REF, this.selectedUserId);
          }
          // this.setAdminReadTime(this.USER_DETAIL_REF, this.selectedUserId);
          // this.checkUserUnreads();
          setTimeout(() => {
            let element = document.getElementById("chatContainerUser");
            element ? element.scroll(0, element.scrollHeight) : true;
          }, 50);
        }
      })
      
    }
  }

  openChatWindowStaff(staffId) {
    this.messageInput = null;
    if (window.screen.width < 768) {
      this.chatWindowVisible = true;
    }
    if (this.selectedChatUser === "user") {
      this.selectedUserId = null;
      this.userMessagesRef = null;
      this.userMessages = [];
      this.userDetails = null;
    }
    this.selectedChatUser = "staff";
    if (this.selectedStaffId !== staffId) {
      this.selectedStaffId = staffId;
      this.staffMessages = [];
      let foundStaff = this.staffList.find(f => f.StaffId === staffId);
      let foundStaffIndex = this.staffList.findIndex(f => f.StaffId === staffId);
      foundStaff.isRead = true;
      this.staffDetails = foundStaff;
      if (this.staffMessagesRef) {
        this.staffMessagesRef.off();
        this.staffMessagesRef = null;
      }
      this.staffMessagesRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + this.selectedStaffId);
      this.staffMessagesRef.on('child_added', res => {
        if (this.selectedStaffId === staffId) {
          let result = res.val();
          let dateString = moment(result.timestamp).format("MMM DD, YYYY")
          let foundGroup = this.staffMessages.find(f => f.DateString === dateString);
          if (!foundGroup) {
            this.staffMessages.push({
              DateString: dateString,
              Messages: [result]
            })
          } else {
            let mesFound = foundGroup.Messages.find(f => f === result);
            if (!mesFound) {
              foundGroup.Messages.push(result);
            }
          }
          // this.checkStaffUnreads();
          setTimeout(() => {
            let element = document.getElementById("chatContainerStaff");
            element ? element.scroll(0, element.scrollHeight) : true;
          }, 50);
        }
        let adminLastRead = moment(this.staffDetails.LastAdminRead);
          let staffLastMessageTime = moment(this.staffDetails.LastMessageTime)
          if (!this.staffDetails.LastAdminRead || ((adminLastRead.isBefore(staffLastMessageTime)))) {
            console.log("in")
            this.staffList[foundStaffIndex].isRead=true;
            this.setAdminReadTime(this.STAFF_DETAIL_REF, this.selectedStaffId);
          }
        // this.checkStaffUnreads();
        setTimeout(() => {
          let element = document.getElementById("chatContainerStaff");
          element ? element.scroll(0, element.scrollHeight) : true;
        }, 50);
      })
     
    }
  }

  closeChatWindow() {
    this.chatWindowVisible = false;
  }

  sendMessageToUser() {
    if (typeof this.messageInput === "string" && this.messageInput.trim() !== "") {
      let obj = {
        text: this.messageInput,
        timestamp: moment().utc().format(),
        sender: 1,
      }
      let messageRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + this.selectedUserId).push();
      messageRef.set(obj);
      messageRef.off();
      this.setLastMessageTime(this.USER_REF,this.selectedUserId,obj)
      this.sendPush(0, this.selectedUserId, this.messageInput);
      
    }
  }

  sendMessageToStaff() {
    if (typeof this.messageInput === "string" && this.messageInput.trim() !== "") {
      let obj = {
        text: this.messageInput,
        timestamp: moment().utc().format(),
        sender: 1,
      }
      let messageRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + this.selectedStaffId).push();
      messageRef.set(obj);
      messageRef.off();
      this.setLastMessageTime(this.STAFF_REF,this.selectedStaffId,obj)
      this.sendPush(1, this.selectedStaffId, this.messageInput);
     
    }
  }

  sendPush(type: number, subjectId: string, msg: string) {
    this.messageInput = null;
    let obj = {
      Type: type,
      Message: msg,
      UserId: null,
      StaffId: null
    }
    switch (type) {
      case 0: {
        obj.UserId = parseInt(subjectId);
        delete obj.StaffId;
        break;
      }
      case 1: {
        obj.StaffId = parseInt(subjectId);
        delete obj.UserId;
        break;
      }
    }
    this.webapi.request("sendChatPush", obj)
      .subscribe(
        data => { },
        error => { }
      )
  }

  // @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerWidth < 768) {
      this.smallDevice = true;
    } else {
      this.smallDevice = false;
    }
  }

  keyDownUser(event) {
    if (event.key === "Enter" && event.ctrlKey) {
      this.messageInput += "\n";
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (this.messageInput && this.messageInput.trim() !== "") {
        this.sendMessageToUser();
      } else {
        this.messageInput = ""
      }
    }
  }

  keyDownStaff(event) {
    if (event.key === "Enter" && event.ctrlKey) {
      this.messageInput += "\n";
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (this.messageInput && this.messageInput.trim() !== "") {
        this.sendMessageToStaff();
      } else {
        this.messageInput = ""
      }
    }
  }

  changeDateFilter(selectedFilter) {
    this.dateRange=[moment(selectedFilter[0]).utc().format(),moment(selectedFilter[1]).utc().format()]
    this.fetchMessages();
   
}

resetDateFilter(flag=null){
  console.log(flag)
  switch(flag){
    case null:
      this.dateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
      break;
    case "week":
      this.dateRange=[moment().subtract(1, 'week').utc().format(),moment().utc().format()];
      break;
    case "month":
      this.dateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
      break;
    default:
        this.dateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
        break;


  }

  console.log(moment().endOf('month').utc().format())
    // this.dateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
    this.fetchMessages();
}

changeStaffDateFilter(selectedFilter) {
  console.log(selectedFilter)
  this.staffDateRange=[moment(selectedFilter[0]).utc().format(),moment(selectedFilter[1]).utc().format()]
  console.log(this.staffDateRange)
  this.fetchMessages();
 
}

resetStaffDateFilter(flag=null){
  console.log("staff"+flag)
  switch(flag){
    case null:
      this.staffDateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
      break;
    case "week":
      this.staffDateRange=[moment().subtract(1, 'week').utc().format(),moment().utc().format()];
      break;
    case "month":
      this.staffDateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
      break;
    default:
        this.staffDateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
        break;


  }
  
console.log(moment().endOf('month').utc().format())
  // this.staffDateRange=[moment().subtract(1, 'months').utc().format(),moment().utc().format()];
  this.fetchMessages();
}

updateUserData(){
  console.log("clicked")
  // let userRef = firebase.database().ref(this.BASE_REF + this.USER_REF)
  let userRef = this.BASE_REF + this.USER_DETAIL_REF;
  firebase.database().ref(userRef).once("value", userSnap => {
    let response=userSnap.val()
    
    Object.keys(response).forEach(element => {
        // console.log(element)

        let lastMsgRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + element)
        lastMsgRef.limitToLast(1).once("child_added", userMsgSnap => {
            var lastMessage = userMsgSnap.val();
            // console.log(lastMessage)
            let updateData = { ...response[element] }
            updateData.Sender = lastMessage.sender
            updateData.LastMessage = lastMessage.text
            updateData.LastMessageTime = lastMessage.timestamp
            // console.log(updateData)

            let userDataRef = firebase.database().ref(this.BASE_REF+this.USER_DETAIL_REF+element); 
            // console.log(this.BASE_REF+this.USER_DETAIL_REF+element)
            userDataRef.set(updateData);
            userDataRef.off();
        });
    })


 
})
let staffRef = this.BASE_REF + this.STAFF_DETAIL_REF;
firebase.database().ref(staffRef).once("value", staffSnap => {
  let response=staffSnap.val()
  
  Object.keys(response).forEach(element => {
      console.log(element)

      let lastMsgRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + element)
      lastMsgRef.limitToLast(1).once("child_added", staffMsgSnap => {
          var lastMessage = staffMsgSnap.val();
          console.log(lastMessage)
          let updateData = { ...response[element] }
          updateData.Sender = lastMessage.sender
          updateData.LastMessage = lastMessage.text
          updateData.LastMessageTime = lastMessage.timestamp
          console.log(updateData)

          let staffDataRef = firebase.database().ref(this.BASE_REF+this.STAFF_DETAIL_REF+element); 
          console.log(this.BASE_REF+this.STAFF_DETAIL_REF+element)
          staffDataRef.set(updateData);
          staffDataRef.off();
      });
  })

})
}

  // sendMessageStaff6() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + "6").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageStaff1() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + "1").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageStaff4() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.STAFF_MESSAGES_REF + "4").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageUser5() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + "5").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageUser6() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + "6").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageUser7() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + "7").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

  // sendMessageUser8() {
  //   let obj = {
  //     text: "Hello",
  //     timestamp: moment().utc().format(),
  //     sender: 0,
  //   }
  //   let messageRef = firebase.database().ref(this.BASE_REF + this.USER_MESSAGES_REF + "8").push();
  //   messageRef.set(obj);
  //   messageRef.off();
  //   this.messageInput = null;
  // }

}