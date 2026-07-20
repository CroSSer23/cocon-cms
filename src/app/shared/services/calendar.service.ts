import { Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { BehaviorSubject, Observable } from 'rxjs';
import { TableService } from './table.service';
import { WebService } from './web.service';

import * as cloneDeep from "lodash/cloneDeep";
import * as moment from "moment";
import * as momentz from "moment-timezone";
import { environment } from 'src/environments/environment';
import { API } from '../enums/apiNames.enum';
import { faL } from '@fortawesome/free-solid-svg-icons';
import { add } from 'date-fns';

@Injectable()
export class CalendarService {
  isloadingStaffFilterList: boolean;
  filterStaffList: any[];
  isTimeSlotLoading: boolean;
  timeSlots: any[];
  isUserListLoading: boolean;
  appUserList: any[]=[];
  treatmentDetail: any[]=[];
  metadata: any;
  staffViewList: any;
  staffGroupData: any;
  productData: any;
  centerData: any;
  categoryList: any[];
  SpecialRequestData: any;
  BookingChannelData: any;
  TimeSlotInterval: any;
  TimeSlotIntervalData: any;
  TimeSlotData: any;
  leadTimeData: any;
  organisationList: any[];
  ServiceZipCode: any;



  constructor(
    private fb: FormBuilder,
    private tableService: TableService,
    private webService: WebService,
  ) { }

  // private promoCodeSub = new BehaviorSubject<any>(this.promoTable);
  // promoListChanges: Observable<any> = this.promoCodeSub.asObservable();

  getStaffFilterList(selectedDate) {
    return new Promise((resolve, reject) => {
      this.isloadingStaffFilterList = true;
      let todayDate = new Date()
      let staffFilterArray= { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: selectedDate }
      // staffFilterArray.selectedDate = todayDate


      let obj = { ...staffFilterArray, IgnoreBookings: false }
      this.webService.request(API.GET_STAFF_FILTER_LIST, {
        ...obj
      })
        .subscribe(
          data => {


            this.filterStaffList = [...data.body.data];

            this.filterStaffList.forEach(function (value, i) {
              value.selected = false;
            })
            resolve(true)
          },
          error => {
            reject(error.headers.get('message'),)
          }
        )
    })
  }

  getCMSTimeSlots() {
    return new Promise((resolve, reject) => {
      this.webService.requestAnonymous(API.GET_CMS_TIME_SLOTS, {

      })
        .subscribe(
          data => {


            this.timeSlots = data.body.Data;
            console.log(this.timeSlots)
            resolve(true)
          },
          error => {
            this.isTimeSlotLoading = false
            reject(faL)
          }
        )
    })
  }


  getUserList() {
    return new Promise((resolve, reject) => {

      this.webService.request(API.USER, {
        ListUserForBooking: true
      }).subscribe(
        data => {
          // this.isUserListLoading=false;
          this.appUserList = [...data.body.Data];
          console.log(this.appUserList)
          resolve(true)
        },
        error => {
          reject(true)
        }
      )
    })
  }

  getOrganisationList(addCocon=false) {
    return new Promise((resolve, reject) => {

      this.webService.request(API.GET_ORGANISATION, {
        AddCocon:addCocon
      }).subscribe(
        data => {
          // this.isUserListLoading=false;
          this.organisationList = [...data.body.Data];
          console.log(this.organisationList)
          
          resolve(true)
        },
        error => {
          reject(true)
        }
      )
    })
  }
  getTreatments() {
    return new Promise((resolve, reject) => {

      this.webService.request(API.GET_TREATMENTS, null)
      .subscribe(
        data => {

          this.treatmentDetail = [...data.body.Data];
          console.log(this.treatmentDetail)
          this.treatmentDetail.forEach((element, index) => {
            let text = element.CategoryName.charAt(0).toUpperCase();
            this.treatmentDetail[index].Text = text
          });
          resolve(true)
        },
        error => {
          reject(true)
        }
      )
    })
  }

 
  getMetadata() {
    return new Promise((resolve, reject) => {

      this.webService.requestAnonymous(API.METADATA, {
        Metadata: ['StaffCalView', "StaffGroup", "Product", "Category", "Center", "SpecialRequest", "BookingChannel","TimeSlotInterval","ServiceZipCode"]
      })
        .subscribe(
          data => {
            this.metadata = { ...data.body.Data };
            // if (this.metadata.StaffCalView) {
            //   this.staffViewList = this.metadata.StaffCalView;
            // }
            if (this.metadata.StaffGroup) {
              this.staffGroupData = this.metadata.StaffGroup;
              this.staffGroupData.forEach(group => {
                group.selected = false;
              });
            }
            if (this.metadata.Product) {
              this.productData = this.metadata.Product;
              this.productData.forEach(product => {
                product.selected = false;
              });
            }
            this.centerData = this.metadata.Center[0];
            let cats = this.metadata['Category'];
            let prods = this.metadata['Product'];
            this.categoryList = [];
            cats.forEach(element => {
              let catObj = {
                CategoryId: element.CategoryId,
                Name: element.Name,
                Products: [],
                Selected: false
              }
              let catProds = prods.filter(f => f.CategoryId === element.CategoryId);
              catProds.forEach(pro => {
                catObj.Products.push({
                  ProductId: pro.ProductId,
                  Name: pro.Name,
                  selected: false
                })
              });
              this.categoryList.push(catObj);
            });
  
            if (this.metadata.SpecialRequest) {
              this.SpecialRequestData = this.metadata.SpecialRequest;
            }
            if (this.metadata.BookingChannelData) {
              this.BookingChannelData = this.metadata.BookingChannelData;
            }
            if (this.metadata.TimeSlotInterval) {
              this.TimeSlotInterval = this.metadata.TimeSlotInterval;
            }else{
              this.TimeSlotInterval=5;
            }
            this.getTimeSlots()
            if (this.metadata.ServiceZipCode) {
              this.ServiceZipCode = this.metadata.ServiceZipCode;
            }
            resolve(true)
          },
          error => {
            reject(true)
          }
        )
    })


  }
  getTimeSlots() {
    return new Promise((resolve, reject) => {

      this.webService.requestAnonymous(API.METADATA, {
        Metadata: ["TimeSlotInterval","Center"]
      })
        .subscribe(
          data => {
            this.TimeSlotData = { ...data.body.Data };
            
            if (this.TimeSlotData.TimeSlotInterval) {
              this.TimeSlotInterval = this.TimeSlotData.TimeSlotInterval;
            }else{
              this.TimeSlotInterval=5;
            }
            this.leadTimeData = this.TimeSlotData.Center[0];
            let config = {
              slotInterval: this.TimeSlotInterval,
              openTime: '00:00',
              closeTime: '23:59'
          };
          
          // Format the time
          let startTime = moment(config.openTime, "HH:mm");
          
          //Format the end time and the next day to it 
          let endTime = moment(config.closeTime, "HH:mm")
          
          //Times
          var allTimes = [];
          
          //Loop over the times - only pushes time with 30 minutes interval
          console.log(startTime)
          console.log(endTime)
          while (startTime < endTime) {
              //Push times
              allTimes.push(startTime.format("HH:mm")); 
              //Add interval of 'slotInterval' minutes
              startTime.add(config.slotInterval, 'minutes');
          }
          this.timeSlots=allTimes;
            resolve(true)
          },
          error => {
            reject(true)
          }
        )
    })


  }

  // getTimeSlots(){
  //   this.TimeSlotInterval
 
  // }
  
}