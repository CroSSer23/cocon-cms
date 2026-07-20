import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit,HostListener  } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from "moment";
import { ToastyService } from 'ng2-toasty';
import { WebService } from '../shared/services/web.service';
import { ScheduleService } from '../shared/services/schedule.service';
import { TableService } from '../shared/services/table.service';
import * as cloneDeep from 'lodash/cloneDeep';
import { ActivatedRoute, Router } from '@angular/router';
import {
  faRefresh

} from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
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
export class ScheduleComponent implements OnInit {
  FORMAT_DD_MM_YYYY: string;
  staffList: { StaffId: null | number; StaffName: string; }[];
  selectedStaff: null | number;
  selectedDate: Date;
  listOfColumn: { Name: string; }[];
  WEEK: { Code: number; Day: string; DateStart: string; DateEnd: string; DayStart: string; DayEnd: string; Block: string; }[];
  COLUMN_NAME_FORMAT: string;
  scheduleData: any[]=[];
  loadingFlag: boolean;
  singleStaffId: number;
  scheduleForm: FormGroup;
  blockTimeForm: FormGroup;
  repeatType: { Code: number; Name: string; }[];
  dateFormat: string;
  scheduleModalVisible: boolean;
  selectedSchedule: any;
  scheduleEditMode: boolean;
  TIME_FORMAT_HH_MM: string;
  isSchLoading: boolean;
  existScheduleDetail: any;
  TIME_FORMAT_HH_MM_SS: string;
  confirmationModalVisible: boolean;
  updateConfirmation: boolean;
  warningText: string;
  deleteConfirmation: boolean;
  isUpdSingleLoading: boolean;
  isUpdMultiLoading: boolean;
  isDelLoading: boolean;
  isDelMultiLoading: boolean;
  isDelSingleLoading: boolean;
  selectedWeekString: string;
  todaySelected: boolean;
  calVisible: boolean;
  prevDayDisable: boolean;
  currentWeek: { DayCode: string; Date: Date; DateShow: string; Selected:boolean }[];
  SCHEDULE_TYPE = {
    GENERAL_OFFER: {
      VALUE: 0,
      LABEL: "GeneralOffer",
      HEADING: "GENERAL OFFER"
    },
    INSTANT_CONFIRMATION: {
      VALUE: 1,
      LABEL: "InstantConfirmation",
      HEADING: "INSTANT CONFIRMATION"
    },
    BLOCKTIME: {
      VALUE: 2,
      LABEL: "BlockTime",
      HEADING: "BLOCK TIME"
    },
  }
  scheduleTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }, staffData: any[]; pagesData: any[]; lastUpdated: null};
  scheduleTablePageSizeOptions: number[];
  DEFAULT_PAGE_SIZE: any;
  scheduleListSubscription: any;
  routerState: { [k: string]: any; };
  openScheduleForStaff: boolean;
  selectedStartTime: any=null;
  fromCalendar: boolean;
  loading: any=true;
  pageIndex: any=1;
  distanceFromBottomPrevious: number=0;
  faRefresh = faRefresh;
  totalRecord:number=10;
  sortCoulmnDate: any;
  scheduleDataRaw: any[];
  popoverVisible: boolean;
  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private tableService: TableService,
    private router: Router
  ) {
    this.staffList = [
      {
        StaffId: 0,
        StaffName: "All staff"
      }
    ];
    this.listOfColumn = [
      {
        Name: "Staff"
      }
    ];
    this.WEEK = [
      {
        Code: 1,
        Day: "Monday",
        DateStart: "MondayStartDate",
        DateEnd: "MondayEndDate",
        DayStart: "MondayStartTime",
        DayEnd: "MondayEndTime",
        Block: "MondayBlockTimeId"
      },
      {
        Code: 2,
        Day: "Tuesday",
        DateStart: "TuesdayStartDate",
        DateEnd: "TuesdayEndDate",
        DayStart: "TuesdayStartTime",
        DayEnd: "TuesdayEndTime",
        Block: "TuesdayBlockTimeId"
      },
      {
        Code: 3,
        Day: "Wednesday",
        DateStart: "WednesdayStartDate",
        DateEnd: "WednesdayEndDate",
        DayStart: "WednesdayStartTime",
        DayEnd: "WednesdayEndTime",
        Block: "WednesdayBlockTimeId"
      },
      {
        Code: 4,
        Day: "Thursday",
        DateStart: "ThursdayStartDate",
        DateEnd: "ThursdayEndDate",
        DayStart: "ThursdayStartTime",
        DayEnd: "ThursdayEndTime",
        Block: "ThursdayBlockTimeId"
      },
      {
        Code: 5,
        Day: "Friday",
        DateStart: "FridayStartDate",
        DateEnd: "FridayEndDate",
        DayStart: "FridayStartTime",
        DayEnd: "FridayEndTime",
        Block: "FridayBlockTimeId"
      },
      {
        Code: 6,
        Day: "Saturday",
        DateStart: "SaturdayStartDate",
        DateEnd: "SaturdayEndDate",
        DayStart: "SaturdayStartTime",
        DayEnd: "SaturdayEndTime",
        Block: "SaturdayBlockTimeId"
      },
      {
        Code: 0,
        Day: "Sunday",
        DateStart: "SundayStartDate",
        DateEnd: "SundayEndDate",
        DayStart: "SundayStartTime",
        DayEnd: "SundayEndTime",
        Block: "SundayBlockTimeId"
      },
    ];
    this.repeatType = [
      {
        Code: 0,
        Name: "Don't repeat"
      },
      {
        Code: 1,
        Name: "Weekly ongoing"
      },
      {
        Code: 2,
        Name: "Specific date"
      }
    ]
    this.scheduleForm = fb.group({
      DayStartTime: [null, [Validators.required]],
      DayEndTime: [null, [Validators.required]],
      EndDate: [null],
      Repeat: [null],
      BlockTime: this.fb.array([])
    });
    this.blockTimeForm = this.fb.group({
      Name: [null],
      StartTime: [null, [Validators.required]],
      EndTime: [null, [Validators.required]]
    });
    this.dateFormat = "dd/MM/yyyy";
    this.FORMAT_DD_MM_YYYY = "DD/MM/YYYY";
    this.TIME_FORMAT_HH_MM = "HH:mm";
    this.TIME_FORMAT_HH_MM_SS = "HH:mm:ss";
    this.COLUMN_NAME_FORMAT = "ddd DD MMM";
    this.selectedStaff = 0;
    if(this.scheduleService.scheduleTable.staffData.length==1){
      this.selectedStaff = this.scheduleService.scheduleTable.staffData[0].StaffId;
    this.singleStaffId = this.scheduleService.scheduleTable.staffData[0].StaffId;

    }else{
      this.selectedStaff = 0;
      this.singleStaffId = null;
    }
    this.setCurrentWeek(moment().toDate());
    // this.loadingFlag = true;
    this.webapi.request("metadata", {
      Metadata: ["Staff"]
    }).subscribe(
      data => {
        let metadata = { ...data.body.Data }
        this.staffList.push(...metadata['Staff']);
        // this.loadingFlag = false;
      },
      error => {
        // this.loadingFlag = false;
        this.toast.error({
          title: "",
          msg: error.headers.get('message'),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )    
    this.selectedDate = moment().toDate();
    this.sortCoulmnDate = moment().toDate();
    // this.totalRecord=this.calculateInitialRecords()
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    // this.DEFAULT_PAGE_SIZE =  this.totalRecord
    this.scheduleTable = this.scheduleService.scheduleTable;
    
    console.log(this.scheduleTable)
    let currentNavigation = this.router.getCurrentNavigation();
    this.routerState = currentNavigation.extras.state;
    console.log(this.selectedDate)
    console.log(this.routerState)
    if (this.routerState && this.routerState.staffId) {
      this.singleStaffId = this.routerState.staffId;
      this.selectedStaff = this.routerState.staffId;
      this.selectedDate = this.routerState.selectedDate;
      this.selectedStartTime =this.routerState.selectedTime;
      this.openScheduleForStaff=true;
      this.fromCalendar=true;
    }
    if(this.scheduleService.scheduleTable.staffData.length==1){
      this.selectedStaff = this.scheduleService.scheduleTable.staffData[0].StaffId;
    this.singleStaffId = this.scheduleService.scheduleTable.staffData[0].StaffId;

    }else{
      this.selectedStaff = 0;
      this.singleStaffId = null;
    }
    // this.fetchSchedule(this.selectedDate,1);
    
   

  }

  ngOnInit() { 
    this.scheduleTablePageSizeOptions = [10, 20, 50, 100];
    
    // this.scheduleListSubscription = this.scheduleService.scheduleListChanges.subscribe(promoChanges => {
    //   this.scheduleTable.pagesData = cloneDeep(promoChanges.pagesData);
    //   let selPage = this.scheduleTable.pagesData.find(f => f.pageNum === promoChanges.pageNum);
    //   if (selPage) {
    //     this.scheduleData = cloneDeep(selPage.data);
    //   }
    // });
    console.log(this.scheduleService.scheduleTable)
    if(this.scheduleService.scheduleTable.staffData.length!=0){
      console.log("1")
      this.setCurrentWeek(this.selectedDate);
      this.calVisible = false;
    this.selectedWeekString =
      `${moment(this.currentWeek[0].Date).format("DD MMM")} -  
      ${moment(this.currentWeek[6].Date).format("DD MMM, YYYY")}`
    let selectedDate = moment(this.selectedDate);
    if (moment().isSame(moment(this.selectedDate))) {
      this.todaySelected = true;
    } else {
      this.todaySelected = false;
    }
    this.selectedDate = selectedDate.toDate();
    this.sortCoulmnDate=this.selectedDate
      this.scheduleTable = this.scheduleService.scheduleTable;
      this.scheduleData = cloneDeep(this.scheduleService.scheduleTable.staffData);
      this.fetchSchedule(this.selectedDate,1,null,this.scheduleTable.lastUpdated);
    }else{
      console.log("2")
      this.sortCoulmnDate=this.selectedDate
      this.fetchSchedule(this.selectedDate,1);
      this.scheduleTable = this.scheduleService.scheduleTable;
    }
    console.log(this.scheduleTable)
   
  }
  ngOnDestroy() {

    this.scheduleTable = null;
  }

  setStaff(staffId: number) {
    this.singleStaffId = staffId;
    this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.fetchSchedule(this.selectedDate,1);
  }

  setPrevWeek() {
    this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment(this.currentWeek[0].Date).subtract(7, "day").toDate()
    this.fetchSchedule(moment(this.currentWeek[0].Date).subtract(7, "day").toDate(),1);
  }

  setNextWeek() {
    this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment(this.currentWeek[0].Date).add(7, "day").toDate()
    this.fetchSchedule(moment(this.currentWeek[0].Date).add(7, "day").toDate(),1);
  }

  setToday() {
    this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment().toDate()
    this.fetchSchedule(moment().toDate(),1);
  }


  fetchSchedule(date: Date,curPage?:any,size?:any,lastSynced?:Date,sortDate?:Date) {
    this.loadingFlag = true;
    this.loading = true;
    console.log("done true ")
    this.setCurrentWeek(date);
    this.calVisible = false;
    this.selectedWeekString =
      `${moment(this.currentWeek[0].Date).format("DD MMM")} -  
      ${moment(this.currentWeek[6].Date).format("DD MMM, YYYY")}`
    let selectedDate = moment(date);
    if (moment().isSame(moment(this.selectedDate))) {
      this.todaySelected = true;
    } else {
      this.todaySelected = false;
    }
    this.selectedDate = selectedDate.toDate();
    // let pageExist = this.scheduleTable.pagesData.find(f => f.pageNum === curPage);
    let currentIds = [];
    let lastUpdated = null;
    // console.log("page",pageExist)
    // if (pageExist) {
    //   currentIds = pageExist.currentIds;
    //   lastUpdated = pageExist.lastUpdated;
    // } else {
    //   this.scheduleTable.pagesData.push({
    //     pageNum: curPage,
    //     data: [],
    //     lastUpdated: null,
    //     currentIds:[]
    //   })
    // }
    let obj = {
      StartDate: selectedDate.format(this.FORMAT_DD_MM_YYYY),
      EndDate: selectedDate.format(this.FORMAT_DD_MM_YYYY),
      StaffId: null,
      Pagination: {
        Number: (curPage)?curPage:this.scheduleTable.pagination.curPage,
        Size: (size)?size:this.DEFAULT_PAGE_SIZE
      },
      LastUpdated:null,
      SortByDate:null
    }
    if (this.singleStaffId) {
      obj.StaffId = this.singleStaffId;
    }
    if (lastSynced) {
      console.log("11111111111")
      obj.LastUpdated = lastSynced;
      this.loadingFlag = false;
    this.loading = false;
    }
    if (sortDate) {
      console.log("222222222222")
      obj.SortByDate = sortDate;
      this.loadingFlag = false;
    this.loading = false;
    }
    this.webapi.request("getStaffSchedule", obj)
      .subscribe(
        
        data => {
          console.log(data)
          // this.scheduleData = [...data.body.Data.Data];
          // this.setTimeFormat();
         
          console.log("done false")
          this.scheduleService.updatePagesData(this.scheduleData,data);
          this.scheduleTable = this.scheduleService.scheduleTable;
          console.log(this.scheduleTable)
          this.scheduleDataRaw = this.scheduleTable.staffData
          console.log(this.scheduleData)
          
          this.sortList(this.sortCoulmnDate)
          this.loadingFlag = false;
          this.loading = false;
          if(this.openScheduleForStaff){
            
            this.newSchedule(this.routerState.staffId,moment(this.routerState.selectedDate).format(this.FORMAT_DD_MM_YYYY),this.routerState.scheduleType)
            this.openScheduleForStaff=false
          }
        },
        error => {
          this.loadingFlag = false;
          console.log("done false er")
          this.loading = false;
          console.log(error)
        }
      )
      console.log(this.scheduleTable)
  }

  setCurrentWeek(date: Date) {
    let selectedDate = moment(date);
    this.selectedDate = moment(date).toDate();
    
    const weekDayNum = selectedDate.day();
    const weekDayNumSelected = moment(this.sortCoulmnDate).day();

    this.currentWeek = [
      {
        DayCode: "Monday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 1 - 7 : 1).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 1 - 7 : 1).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 1 ? true:false
      },
      {
        DayCode: "Tuesday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 2 - 7 : 2).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 2 - 7 : 2).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 2 ? true:false
      },
      {
        DayCode: "Wednesday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 3 - 7 : 3).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 3 - 7 : 3).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 3 ? true:false
      },
      {
        DayCode: "Thursday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 4 - 7 : 4).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 4 - 7 : 4).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 4 ? true:false
      },
      {
        DayCode: "Friday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 5 - 7 : 5).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 5 - 7 : 5).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 5 ? true:false
      },
      {
        DayCode: "Saturday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 6 - 7 : 6).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 6 - 7 : 6).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 6 ? true:false
      },
      {
        DayCode: "Sunday",
        Date: moment(selectedDate).day(weekDayNum === 0 ? 0 : 7).toDate(),
        DateShow: moment(selectedDate).day(weekDayNum === 0 ? 0 : 7).format(this.COLUMN_NAME_FORMAT),
        Selected:weekDayNumSelected === 0 ? true:false
      },
    ];
  }

  setTimeFormat() {
    this.scheduleData.forEach(staff => {
      staff.GeneralOfferHours = 0;
      staff.InstantConfirmationHours = 0;
      let schedule = staff.Schedule;
      Object.keys(schedule).forEach(f => {
        if (schedule[f].IsWorking) {
          // General Offer
          if (schedule[f].GeneralOffer.DayStart) {
            let start = moment(schedule[f].GeneralOffer.DayStart, "HH:mm:ss");
            let end = moment(schedule[f].GeneralOffer.DayEnd, "HH:mm:ss");
            staff.GeneralOfferHours += end.diff(start, "hour");
            schedule[f].GeneralOffer.DayStart = start.format("HH:mm");
            schedule[f].GeneralOffer.DayEnd = end.format("HH:mm");
            if (!schedule[f].GeneralOffer.CurrentScheduleEnd) {
              schedule[f].GeneralOffer.ongDay = true;
            } else if (schedule[f].GeneralOffer.CurrentScheduleEnd) {
              let schEnd = moment(schedule[f].GeneralOffer.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
              if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                if (schEnd.isSame(moment(schedule[f].GeneralOffer.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                  schedule[f].GeneralOffer.singleDay = true;
                } else {
                  schedule[f].GeneralOffer.specDay = true;
                }
              } else {
                schedule[f].GeneralOffer.specDay = true;
              }
            }
          }

          // Instant Confirmation
          if (schedule[f].InstantConfirmation.DayStart) {
            let start = moment(schedule[f].InstantConfirmation.DayStart, "HH:mm:ss");
            let end = moment(schedule[f].InstantConfirmation.DayEnd, "HH:mm:ss");
            staff.InstantConfirmationHours += end.diff(start, "hour");
            schedule[f].InstantConfirmation.DayStart = start.format("HH:mm");
            schedule[f].InstantConfirmation.DayEnd = end.format("HH:mm");
            if (!schedule[f].InstantConfirmation.CurrentScheduleEnd) {
              schedule[f].InstantConfirmation.ongDay = true;
            } else if (schedule[f].InstantConfirmation.CurrentScheduleEnd) {
              let schEnd = moment(schedule[f].InstantConfirmation.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
              if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                if (schEnd.isSame(moment(schedule[f].InstantConfirmation.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                  schedule[f].InstantConfirmation.singleDay = true;
                } else {
                  schedule[f].InstantConfirmation.specDay = true;
                }
              } else {
                schedule[f].InstantConfirmation.specDay = true;
              }
            }
          }

          // Block times
          if (schedule[f].BlockTime.CurrentSchedular) {
            if (!schedule[f].BlockTime.CurrentScheduleEnd) {
              schedule[f].BlockTime.ongDay = true;
            } else if (schedule[f].BlockTime.CurrentScheduleEnd) {
              let schEnd = moment(schedule[f].BlockTime.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
              if (schEnd.isSame(moment(schedule[f].Date, this.FORMAT_DD_MM_YYYY))) {
                if (schEnd.isSame(moment(schedule[f].BlockTime.CurrentSchedular, this.FORMAT_DD_MM_YYYY))) {
                  schedule[f].BlockTime.singleDay = true;
                } else {
                  schedule[f].BlockTime.specDay = true;
                }
              } else {
                schedule[f].BlockTime.specDay = true;
              }
            }
          }
        }
      })
    })
  }

  newSchedule(staffId: number, dayCode: string, scheduleType) {
    console.log(dayCode)
    let staff = this.scheduleData.find(f => f.StaffId === staffId);
    this.selectedSchedule = {
      StaffId: staff.StaffId,
      staffName: staff.Name,
      dateShow: moment(dayCode, this.FORMAT_DD_MM_YYYY).format("dddd, DD MMMM YYYY"),
      Schedule: {
        RequestType: 0,
        ScheduleType: this.SCHEDULE_TYPE[scheduleType].VALUE,
        ScheduleTypeName: this.SCHEDULE_TYPE[scheduleType].HEADING,
        Date: dayCode,
        EndDate: moment(dayCode, this.FORMAT_DD_MM_YYYY).add(7, "day").toDate(),
        CurrentSchedular: null,
        DayStartTime: (this.selectedStartTime===null)?null: moment(this.selectedStartTime, this.TIME_FORMAT_HH_MM).toDate(),
        DayEndTime: null,
        Repeat: 0,
        BlockTime: []
      }
    }
    this.resetScheduleForm();
    this.scheduleForm.patchValue(this.selectedSchedule.Schedule);
    this.scheduleModalVisible = true;
    this.checkToday();
  }

  checkToday() {
    let today = moment().startOf("day");
    let selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    if (selectedDay.isBefore(today)) {
      this.prevDayDisable = true;
    } else {
      this.prevDayDisable = false;
    }
  }

  editSchedule(staffId: number, dayCode: string, scheduleType: string) {
    console.log(this.scheduleData)
    console.log(dayCode)
    let staff = this.scheduleData.find(f => f.StaffId === staffId);
    let sch = staff.Schedule[dayCode][this.SCHEDULE_TYPE[scheduleType].LABEL];
    let selectedDate = staff.Schedule[dayCode].Date;
    sch.Date = selectedDate;
    this.existScheduleDetail = sch;
    let selectedScheduleDate = moment(sch.Date, this.FORMAT_DD_MM_YYYY);
    this.selectedSchedule = {
      StaffId: staff.StaffId,
      staffName: staff.Name,
      dateShow: selectedScheduleDate.format("dddd, DD MMMM YYYY"),
      Schedule: {
        RequestType: 0,
        ScheduleType: this.SCHEDULE_TYPE[scheduleType].VALUE,
        ScheduleTypeName: this.SCHEDULE_TYPE[scheduleType].HEADING,
        Date: sch.Date,
        EndDate: null,
        CurrentSchedular: sch.CurrentSchedular,
        DayStartTime: sch.DayStart ? moment(sch.DayStart, this.TIME_FORMAT_HH_MM).toDate() : "",
        DayEndTime: sch.DayEnd ? moment(sch.DayEnd, this.TIME_FORMAT_HH_MM).toDate() : "",
        Repeat: 0,
        BlockTime: []
      }
    }
    if (!this.existScheduleDetail.CurrentScheduleEnd) {
      this.selectedSchedule.Schedule.Repeat = 1;
    } else if (moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).isSame(selectedScheduleDate)) {
      this.selectedSchedule.Schedule.Repeat = 0;
    } else {
      this.selectedSchedule.Schedule.Repeat = 2;
      this.selectedSchedule.Schedule.EndDate = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).toDate();
    }
    let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
    this.resetScheduleForm();
    sch.Blocks ? sch.Blocks.forEach(element => {
      let obj = {
        Name: element.Name,
        StartTime: moment(element.StartTime, this.TIME_FORMAT_HH_MM_SS).toDate(),
        EndTime: moment(element.EndTime, this.TIME_FORMAT_HH_MM_SS).toDate()
      };
      blockArray.push(this.pushBlockControls(obj));
      this.selectedSchedule.Schedule.BlockTime.push(obj);
    }) : true;
    console.log(this.selectedSchedule)
    this.scheduleEditMode = true;
    this.scheduleForm.patchValue(this.selectedSchedule.Schedule);
    this.scheduleModalVisible = true;
    this.checkToday();
  }

  closeScheduleModal() {
    this.scheduleModalVisible = false;
    this.scheduleEditMode = false;
    if(this.fromCalendar){
      this.router.navigate(['/calendar/'])
    }
  }

  resetScheduleForm() {
    this.scheduleForm.reset();
    let blocks = this.scheduleForm.get('BlockTime') as FormArray;
    while (blocks.length > 0) {
      blocks.removeAt(0);
    }
  }

  addBlockTimeControls() {
    let blockArray = this.scheduleForm.get('BlockTime') as FormArray;
    blockArray.push(this.pushBlockControls());
    let element = document.getElementById("blocksCont");
    element.scroll({
      behavior: "smooth",
      top: 10000
    })
  }

  pushBlockControls(obj = null) {
    if (!obj) {
      return this.fb.group({
        Name: [null, [Validators.required]],
        StartTime: [null, [Validators.required]],
        EndTime: [null, [Validators.required]]
      })
    } else {
      let startTime = moment(obj.StartTime).toDate();
      let endTime = moment(obj.EndTime).toDate();
      return this.fb.group({
        Name: [obj.Name, [Validators.required]],
        StartTime: [startTime, [Validators.required]],
        EndTime: [endTime, [Validators.required]]
      })
    }
  }

  deleteBlock(index: number): void {
    const day = this.scheduleForm.get('BlockTime') as FormArray;
    day.removeAt(index);
  }

  disabledEndDate = (current: Date): boolean => {
    const currentDate = moment(current);
    const curSchDate = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY);
    const weekDayNum = curSchDate.day();
    if (currentDate.day() !== weekDayNum) {
      return true;
    }
    if (currentDate.isBefore(curSchDate) || currentDate.isSame(curSchDate)) {
      return true;
    }
    return false;
  };

  submitNewSchedule() {
    if (this.selectedSchedule.Schedule.ScheduleType !== this.SCHEDULE_TYPE.BLOCKTIME.VALUE) {
      let dayStart = moment(this.scheduleForm.controls.DayStartTime.value).startOf("minute");
      let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value).startOf("minute");
      if (dayStart.isAfter(dayEnd) || dayStart.isSame(dayEnd)) {
        this.toast.error({
          title: `Please enter valid day timing.`,
          msg: "",
          timeout: 3000,
          theme: "bootstrap"
        })
        return;
      }
    } else if (!this.scheduleForm.controls.BlockTime.value.length) {
      this.toast.error({
        title: `Please enter block times.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    const valid = this.checkBlocks();
    if (!valid) {
      return;
    }
    let obj = {
      StaffId: this.selectedSchedule.StaffId,
      Schedule: {
        RequestType: 0,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: null,
        DayStartTime: this.scheduleForm.controls.DayStartTime.value ? moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM) : "",
        DayEndTime: this.scheduleForm.controls.DayEndTime.value ? moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM) : "",
        BlockTime: []
      }
    }
    if (this.scheduleForm.controls.Repeat.value === 0) {
      obj.Schedule.EndDate = this.selectedSchedule.Schedule.Date;
    }
    if (this.scheduleForm.controls.Repeat.value === 2) {
      obj.Schedule.EndDate = moment(this.scheduleForm.controls.EndDate.value).format(this.FORMAT_DD_MM_YYYY);
    }
    this.scheduleForm.controls.BlockTime.value.forEach(block => {
      obj.Schedule.BlockTime.push({
        Name: block.Name,
        StartTime: moment(block.StartTime).format(this.TIME_FORMAT_HH_MM),
        EndTime: moment(block.EndTime).format(this.TIME_FORMAT_HH_MM)
      })
    });
    this.isSchLoading = true;
    this.webapi.request("updateStaffSchedule", obj)
      .subscribe(
        data => {
          this.isSchLoading = false;
          this.scheduleModalVisible = false;
          this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate()
          this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate(),1);
          this.resetScheduleForm();
          this.existScheduleDetail = null;
          this.selectedSchedule = null;
          this.openScheduleForStaff=false;
          this.selectedStartTime=null
          if(this.fromCalendar){
            this.router.navigate(['/calendar/'])
          }
          
        },
        error => {
          this.isSchLoading = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  disabledSave() {
    if (this.selectedSchedule.Schedule.ScheduleType !== this.SCHEDULE_TYPE.BLOCKTIME.VALUE) {
      if (!this.scheduleForm.valid) {
        return true;
      }
    } else {
      if (!this.scheduleForm.controls.BlockTime.value.length) {
        return false;
      }
      let invalid = false;
      this.scheduleForm.controls.BlockTime.value.forEach(element => {
        if (!element.StartTime || !element.EndTime) {
          invalid = true;
        }
      });
      return invalid;
    }
    if (
      this.selectedSchedule.Schedule.ScheduleType === this.SCHEDULE_TYPE.BLOCKTIME.VALUE &&
      this.scheduleForm.controls.BlockTime.value.length === 0
    ) {
      return true;
    }
    if (this.scheduleForm.controls.Repeat.value === 2 && !this.scheduleForm.controls.EndDate.value) {
      return true;
    }
    let today = moment().startOf("day");
    let selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    if (selectedDay.isBefore(today)) {
      return true;
    }
    return false;
  }

  disabledDelete() {
    let today = moment().startOf("day");
    let selectedDay = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).startOf("day");
    if (selectedDay.isBefore(today)) {
      return true;
    }
    return false;
  }

  confirmUpdation() {
    let showUpdConf = false;
    // check if exist schedule is ongoing weekly
    if (!this.existScheduleDetail.CurrentScheduleEnd) {
      showUpdConf = true;
    } else {
      let existScheduleEnd = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
      let existScheduleStart = moment(this.existScheduleDetail.CurrentSchedular, this.FORMAT_DD_MM_YYYY);
      if (existScheduleEnd.isAfter(existScheduleStart)) {
        showUpdConf = true;
      } else {
        showUpdConf = false;
      }
    }
    // showUpdConf will be true now if exist schedule is ongoing somehow.

    if (showUpdConf) {
      if (this.scheduleForm.controls.Repeat.value !== 0) {
        // need to show confirmation dialog
        let weekDayCode = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).day();
        let dayCode = this.WEEK.find(f => f.Code === weekDayCode);
        this.warningText = `You have edited a shift that repeats weekly. Updating upcoming shifts
        will overwrite ${this.selectedSchedule.staffName}'s `;
        if (this.scheduleForm.controls.Repeat.value === 1) {
          // show ongoing warning
          this.warningText += `ongoing ${dayCode.Day} schedule`;
        } else {
          // show date specific warning
          this.warningText += `${dayCode.Day} schedule up to ${moment(this.scheduleForm.controls.EndDate.value).format("DD MMMM YYYY")}`;
        }
        this.updateConfirmation = true;
        this.deleteConfirmation = false;
        this.scheduleModalVisible = false;
      } else {
        showUpdConf = false;
      }
    } else {
      // dont show the message just hit API.
      showUpdConf = false;
    }

    if (showUpdConf) {
      this.confirmationModalVisible = true;
    } else {
      this.updateSchedule();
    }
  }

  updateSchedule(updateOngoing = null) {
    let dayStart = moment(this.scheduleForm.controls.DayStartTime.value);
    let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value);
    if (dayStart.isAfter(dayEnd) || dayStart.isSame(dayEnd)) {
      this.toast.error({
        title: `Please enter valid day timing.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    const valid = this.checkBlocks();
    if (!valid) {
      return;
    }
    let obj = {
      StaffId: this.selectedSchedule.StaffId,
      Schedule: {
        RequestType: 0,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: this.existScheduleDetail.CurrentSchedular,
        DayStartTime: moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM),
        DayEndTime: moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM),
        BlockTime: []
      }
    }
    if (this.scheduleForm.controls.Repeat.value === 0 || updateOngoing === false) {
      obj.Schedule.EndDate = this.selectedSchedule.Schedule.Date;
    } else if (this.scheduleForm.controls.Repeat.value === 2) {
      obj.Schedule.EndDate = moment(this.scheduleForm.controls.EndDate.value).format(this.FORMAT_DD_MM_YYYY);
    }
    this.scheduleForm.controls.BlockTime.value.forEach(block => {
      obj.Schedule.BlockTime.push({
        Name: block.Name,
        StartTime: moment(block.StartTime).format(this.TIME_FORMAT_HH_MM),
        EndTime: moment(block.EndTime).format(this.TIME_FORMAT_HH_MM)
      })
    });
    this.isSchLoading = true;
    updateOngoing ? this.isUpdMultiLoading = true : this.isUpdSingleLoading = true;
    this.webapi.request("updateStaffSchedule", obj)
      .subscribe(
        data => {
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          if (this.confirmationModalVisible) {
            this.confirmationModalVisible = false;
          }
          if (this.scheduleModalVisible) {
            this.closeScheduleModal();
          }
          this.scheduleEditMode = false;
          this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate()
          this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate(),1);
          this.resetScheduleForm();
          this.selectedSchedule = null;
          this.existScheduleDetail = null;
        },
        error => {
          this.isSchLoading = false;
          this.isUpdMultiLoading = false;
          this.isUpdSingleLoading = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  closeConfirmationModal() {
    this.confirmationModalVisible = false;
    this.scheduleModalVisible = true;
  }

  confirmDelete() {
    let showDelConf = false;
    // check if exist schedule is ongoing weekly
    if (!this.existScheduleDetail.CurrentScheduleEnd) {
      showDelConf = true;
    } else {
      let existScheduleEnd = moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY);
      let existScheduleStart = moment(this.existScheduleDetail.CurrentSchedular, this.FORMAT_DD_MM_YYYY);
      if (existScheduleEnd.isAfter(existScheduleStart)) {
        if (moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).isSame(existScheduleEnd)) {
          showDelConf = false;
        } else {
          showDelConf = true;
        }
      } else {
        showDelConf = false;
      }
    }
    // showUpdConf will be true now if exist schedule is ongoing anyhow.

    if (showDelConf) {
      // need to show confirmation dialog
      let weekDayCode = moment(this.selectedSchedule.Schedule.Date, this.FORMAT_DD_MM_YYYY).day();
      let dayCode = this.WEEK.find(f => f.Code === weekDayCode);
      this.warningText = `You are deleting a shift that repeats weekly. Deleting upcoming shifts will overwrite ${this.selectedSchedule.staffName}'s `;
      if (this.scheduleForm.controls.Repeat.value === 1 || !this.existScheduleDetail.CurrentScheduleEnd) {
        // show ongoing warning
        this.warningText += `ongoing ${dayCode.Day} schedule`;
      } else {
        // show date specific warning
        this.warningText += `${dayCode.Day} schedule up to ${moment(this.existScheduleDetail.CurrentScheduleEnd, this.FORMAT_DD_MM_YYYY).format("DD MMMM YYYY")}`;
      }
      this.scheduleModalVisible = false;
      this.updateConfirmation = false;
      this.deleteConfirmation = true;
      this.confirmationModalVisible = true;
    } else {
      this.deleteSchedule();
    }
  }

  deleteSchedule(deleteOngoing = false) {
    let obj = {
      StaffId: this.selectedSchedule.StaffId,
      Schedule: {
        RequestType: 1,
        ScheduleType: this.selectedSchedule.Schedule.ScheduleType,
        Date: this.selectedSchedule.Schedule.Date,
        EndDate: null,
        CurrentSchedular: this.existScheduleDetail.CurrentSchedular,
        DayStartTime: moment(this.scheduleForm.controls.DayStartTime.value).format(this.TIME_FORMAT_HH_MM),
        DayEndTime: moment(this.scheduleForm.controls.DayEndTime.value).format(this.TIME_FORMAT_HH_MM),
        BlockTime: [],
        DeleteOngoing: deleteOngoing
      }
    }
    this.isDelLoading = true;
    deleteOngoing ? this.isDelMultiLoading = true : this.isDelSingleLoading = true;
    this.webapi.request("updateStaffSchedule", obj)
      .subscribe(
        data => {
          this.isDelLoading = false;
          this.isDelMultiLoading = false;
          this.isDelSingleLoading = false;
          if (this.confirmationModalVisible) {
            this.confirmationModalVisible = false;
          }
          if (this.scheduleModalVisible) {
            this.closeScheduleModal();
          }
          this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    this.sortCoulmnDate=moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate()
          this.fetchSchedule(moment(obj.Schedule.Date, this.FORMAT_DD_MM_YYYY).toDate(),1);
          this.resetScheduleForm();
          this.scheduleEditMode = false;
          this.selectedSchedule = null;
          this.existScheduleDetail = null;
        },
        error => {
          this.isDelLoading = false;
          this.isDelMultiLoading = false;
          this.isDelSingleLoading = false;
          this.toast.error({
            title: `Error`,
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  checkBlocks(): boolean {
    let blocksValid = true;
    let blocks = this.scheduleForm.controls.BlockTime.value;
    // let dayStart = moment(this.scheduleForm.controls.DayStartTime.value);
    // let dayEnd = moment(this.scheduleForm.controls.DayEndTime.value);

    blocks.forEach(block => {
      // let startTime = moment(block.StartTime, "HH:mm");
      // let endTime = moment(block.EndTime, "HH:mm");
      let startTime = moment(block.StartTime).startOf("minute");
      let endTime = moment(block.EndTime).startOf("minute");
      // if (
      //   !startTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
      //   !endTime.isBetween(dayStart, dayEnd, "minute", "[]")
      // ) {
      //   this.toast.error({
      //     title: `Block time got out of range, please correct and save.`,
      //     msg: "",
      //     timeout: 3000,
      //     theme: "bootstrap"
      //   })
      //   blocksValid = false;
      //   return;
      // }
      if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
        blocksValid = false;
      }
    });
    if (!blocksValid) {
      this.toast.error({
        title: `Please enter valid block timing.`,
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
    }
    return blocksValid;
  }

  changePageNumber(event) {
    console.log("so")
    console.log(this.selectedDate)
    this.fetchSchedule(this.selectedDate,event,this.scheduleTable.pagination.size);
    
  }

  changePageSize(event) {
    console.log(event)
    console.log(this.scheduleTable)
   
    this.fetchSchedule(this.selectedDate,this.scheduleTable.pagination.curPage,event);
   
  }
  calculateInitialRecords() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Adjust these values based on your specific requirements and performance considerations
    if (screenWidth >= 2300) {
      return 50; // Load more records for larger screens
    } else if (screenWidth >= 1700) {
      return 30;

    } else if (screenWidth >= 1000) {
      return 20;
    } else {
      return 10; // Load fewer records for smaller screens
    }
}

  @HostListener('window:scroll', [])
  // Event handler for scroll
  onScroll(): void {
    // Check if scroll reached the bottom
   
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Calculate the distance from the bottom of the page
    const distanceFromBottom = documentHeight - (scrollPosition + windowHeight);

    // You can set a threshold value based on your requirements
    const threshold =0;
    console.log("distanceFromBottom",distanceFromBottom)
    console.log("this.distanceFromBottomPrevious",this.distanceFromBottomPrevious)
    console.log("threshold",threshold)
    if ((distanceFromBottom <= threshold) && !this.loading ) {
      console.log(this.scheduleTable.pagination.itemCount)
      console.log(this.scheduleData.length)
      if(this.scheduleTable.pagination.itemCount>this.scheduleData.length){
        this.pageIndex++;
      this.distanceFromBottomPrevious=distanceFromBottom
      console.log("pageIndex",this.pageIndex)
      this.scheduleTable.pagination.curPage=this.pageIndex
      console.log("before",this.sortCoulmnDate)
      this.fetchSchedule(this.selectedDate,this.scheduleTable.pagination.curPage,this.scheduleTable.pagination.size)
      console.log("after",this.sortCoulmnDate)
      }
      
    }else{
      // console.log("noooo")
      this.distanceFromBottomPrevious=distanceFromBottom
    //   console.log("distanceFromBottom",distanceFromBottom)
    // console.log("this.distanceFromBottomPrevious",this.distanceFromBottomPrevious)
    }
  }
  refresh(){
    this.scheduleData=[]
    this.distanceFromBottomPrevious=0
    this.pageIndex=1
    // this.sortCoulmnDate=this.selectedDate
    this.fetchSchedule(this.selectedDate,1);
     
     
  }
  loadMore(){
    if(this.scheduleTable.pagination.itemCount>this.scheduleData.length){
      this.pageIndex++;
    // this.distanceFromBottomPrevious=distanceFromBottom
    console.log("pageIndex",this.pageIndex)
    this.scheduleTable.pagination.curPage=this.pageIndex
    console.log("before",this.sortCoulmnDate)
    this.fetchSchedule(this.selectedDate,this.scheduleTable.pagination.curPage,this.scheduleTable.pagination.size)
    console.log("after",this.sortCoulmnDate)
    }
  }
  // Function to sort staff list based on schedule data
// sortStaffBySchedule(staffList, targetDate) {
//   return staffList.sort((a, b) => {
//       const aData = this.checkScheduleData(a.Schedule, targetDate);
//       const bData = this.checkScheduleData(b.Schedule, targetDate);

//       // Sort by presence of data first
//       if (aData && !bData) return -1; // a has data, b does not
//       if (!aData && bData) return 1;  // b has data, a does not

//       // If both have or do not have data, sort alphabetically by name
//       return a.Name.localeCompare(b.Name);
//   });
// }

  checkScheduleData(schedule, targetDate) {
    const days = Object.keys(schedule);
    for (let day of days) {

      // Create two dates
      const date1 = moment(schedule[day].Date,this.FORMAT_DD_MM_YYYY);
      const date2 = moment(targetDate);
      console.log("date1", date1)
      console.log("date2", date2)
      // Ensure both dates are in the same format
      const formattedDate1 = date1.format('YYYY-MM-DD');
      const formattedDate2 = date2.format('YYYY-MM-DD');
      console.log("formattedDate1", formattedDate1)
      console.log("formattedDate2", formattedDate2)
      console.log("------------------------------------------------")
      if (moment(formattedDate1).isSame(formattedDate2)) {
        console.log("ssssssssssssssssssssssssssssss")
        const generalOffer = schedule[day].GeneralOffer;
        const instantConfirmation = schedule[day].InstantConfirmation;
        // Check if there is data in either GeneralOffer or InstantConfirmation
        if (Object.keys(generalOffer).length > 0 || Object.keys(instantConfirmation).length > 0) {
          return true;
        }
      }
    }
    return false;
  }
sortList(date){
  this.sortCoulmnDate=date
  console.log(JSON.stringify(this.scheduleDataRaw))
  console.log("coloumn",date)
  let withSchedule=[]
  let withoutSchedule=[]
  const targetDate = this.sortCoulmnDate; // Date passed from frontend
  console.log("targetDate",targetDate)
 
  this.scheduleDataRaw.forEach(staff => {
    console.log("res",this.checkScheduleData(staff.Schedule, targetDate))
    console.log("staff.Schedule",staff.Schedule)
   if(this.checkScheduleData(staff.Schedule, targetDate)){
    withSchedule.push(staff)
   }else{
    withoutSchedule.push(staff)
   }
   // Step 2: Sort each group alphabetically by name
   withSchedule.sort((a, b) => a.Name.toLowerCase().trim().localeCompare(b.Name.toLowerCase().trim()));
   withoutSchedule.sort((a, b) => a.Name.toLowerCase().trim().localeCompare(b.Name.toLowerCase().trim()));
   console.log("withSchedule",withSchedule)
   console.log("withoutSchedule",withoutSchedule)
   
   const sortedStaffList = [...withSchedule, ...withoutSchedule];
   console.log(sortedStaffList)
   this.scheduleData=[...sortedStaffList]
})
}
sortStaffList(coloumn,colIindex){
  console.log("coloumn",coloumn)
  console.log("colIindex",colIindex)
  // return false;
  this.currentWeek.forEach((item,index )=> {
    console.log("colIindex",colIindex)
    console.log("index",index)
    if(index==colIindex){
      this.currentWeek[index].Selected=true;
    }else{
      this.currentWeek[index].Selected=false;
    }
  });

 
  console.log("this.currentWeek",this.currentWeek)
  this.sortList(coloumn.Date)
}

fetchScheduleForDate(event: Date){
  this.scheduleData=[]
  console.log("calling")
  console.log(event)

  this.sortCoulmnDate= moment(event)
  
  this.fetchSchedule(event);
  this.popoverVisible=false
}

}