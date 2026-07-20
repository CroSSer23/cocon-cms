import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, Input, ElementRef, NgZone, OnInit, ViewChild, ViewEncapsulation,HostListener } from '@angular/core';
import * as moment from 'moment';
import * as momentz from "moment-timezone";
import { ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import { WebService } from '../shared/services/web.service';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../shared/services/schedule.service';
import { BookingService } from '../shared/services/booking.service';
import { CalendarService } from '../shared/services/calendar.service';
import { CookieService } from "ngx-cookie-service";
import { GooglePlaceDirective } from "node_modules/ngx-google-places-autocomplete/ngx-google-places-autocomplete.directive";
import {
  faSpa,
  faMarsAndVenus,
  faStar,
  faCalendarAlt,
  faUser,
  faMoneyCheckDollar,
  faRectangleXmark,
  faFile,
  faMapLocationDot,
  faLocationDot,
  faPersonBiking,
  faStickyNote,
  faTrashCan

} from '@fortawesome/free-solid-svg-icons';
import * as cloneDeep from "lodash/cloneDeep";
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { API } from '../shared/enums/apiNames.enum';
import { Console, group } from 'console';
import { CustomValidators } from 'ng2-validation';
import { add } from 'date-fns';
// import { setTimeout } from 'timers';
@Component({
  selector: 'app-new-booking',
  templateUrl: './new-booking.component.html',
  styleUrls: ['./new-booking.component.css'],
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
    ])
  ],
  host: {
    '(window:popstate)': 'onBackButtonPressed($event)'
  },
  
})
export class NewBookingComponent implements OnInit {
  
  metadata: any;
  staffViewList: { ViewId: number; Name: string; }[] = [
    {
      ViewId: 1,
      Name: "Working"
    },
    {
      ViewId: 2,
      Name: "All"
    }
  ];
  PaymentType = [
    {
      VALUE: 0,
      TYPE: "Cash",
      LABEL: "Invoice/Other",
      DISABLED: false
    },
    {
      VALUE: 1,
      TYPE: "PaymentLink",
      LABEL: "Email Payment Link",
      DISABLED: false

    },
    {
      VALUE: 2,
      TYPE: "CopyPaymentLink",
      LABEL: "Copy Payment Link",
      DISABLED: false

    }
  ]
  BOOKING_PAYMENT_STATUS = {
    INITIATED: 0,
    SUCCEEDED: 1,
    CANCELLED: 2,
    FAILED: 3,
    MANUAL: 4,
    NOT_REQUIRED: 5,
    PENDING: 6
  }
  HH_MM_SS = "HH:mm:ss";
  HH_MM = "HH:mm";
  bookingForm: FormGroup;
  treatmentForm: FormGroup;
  userForm: FormGroup;
  selectedTreatmentDetail: any={};
  selectedTreatments: any[];
  isFormSpinning: boolean=false;
  emptyText:string="Select Customer to view the details"
  isloadingAnalytics: boolean;
  editBookingMode: boolean=false;
  editBookingDetail: any={};
  reachOutTime: any;
  AddressShow: any;
  DistanceShow: any;
  newUserAddressShow: any;
  newUserDistanceShow: any;
  isUserLoading: boolean;
  rootUser: any;
  userEmailMessage: any;
  prefLanguage: any;
  clientSource: any;
  prefTherList: { pref: number; Name: string; }[];
  genderList: { Id: number; Name: string; }[];
  isloadingAddress: boolean;
  tagcolor: string='#c42018';
  AddressObject: any;
  faSpa = faSpa;
  faMarsAndVenus = faMarsAndVenus;
  faStar = faStar;
  faCalendarAlt = faCalendarAlt;
  faUser = faUser;
  faMoneyCheckDollar = faMoneyCheckDollar;
  faRectangleXmark = faRectangleXmark;
  faFile = faFile; 
  faMapLocationDot = faMapLocationDot;
  faPersonBiking=faPersonBiking;
  faStickyNote=faStickyNote;
  faLocationDot = faLocationDot;
  faTrashCan=faTrashCan;
  DistanceUnit: any;
  durationSubs: any;
  addOnSubs: any;
  productSubs: any;
  staffSubs: any;
  startTimeSubs: any;
  userIdSubs: any;
  dateTimeSubs: any;
  zipSubs: any;
  houseNoSubs: any;

  noAddressAlert: any;
  noAddressAlertEdit: any;
  isAddressValid: any=true;
  showNotAvailableAlert: boolean;
  showSkillAvailableAlert: boolean;
  showAvailablitySkillAlert: boolean;
  showAvailablitySkillAlertEdit: boolean;
  confirmAddressAlert: any=false;
  confirmAddressAlertEdit: any=false;
  confirmAvailableAlert: any=false;
  confirmAvailableAlertEdit: any=false;
  isPopAnalyticLoading:boolean=true
  UserAnalyticDetail: any;
  SpecialRequestData: any=[];
  travelFeeSubs: any;
  isPromoApplied:boolean=false
  isPromoValid: boolean;
  showInvalidPromoAlert: boolean;
  InvalidPromo: string= "Sorry, it seems promo code is not applicable to this appointment"
  InvalidCategoryPromo: string= "Sorry, it seems promo code is not applicable to the selected Category(s)."
  InvalidPromoAmount: string= "Sorry, Please select proper treatment, the promo code cannot be applied to this amount."
  InvoiceCopied: string= "The invoice payment url is copied to clipboard, please paste it before it is lost."
  totalAmountSubs: any;
  PromoDetail: any=null;
  isPromoActive: boolean=false;
  BookingChannelData: any;
  discount: number=0;
  IsNewInvoice: boolean;
  VoidInvoice: boolean;
  ChanngeToManual: boolean;
  objToSave: any={};
  showSendingInvoice:boolean=false
  StripeEmail:string=''
  showEditEmail: boolean;
  discountedAmount: number;
  confirmRemovePromoAlert:boolean=false
  showNotAppliedPromoAlert: boolean;
  timeSlots: any=[];
  editDraftMode: boolean;
  staffGroupData: { Name: string, StaffGroupId: number, selected: boolean }[];
  staffFilterArray: {
    OrganisationLocationId: any[], groups: number[], skills: number[], searchValue: string, isWorking: string, selectedDate: String 
}
  staffFilterArray2: { groups: number[], skills: number[], searchValue: string, isWorking: string, selectedDate: String ,OrganisationLocationId: any[]}
  filteredCategories: string[];
  selectedTherapist: any={};
  filteredGroups: any[];
  selectedTherapistId: any;
  isWorkingLabel: string;
  treatmentDetail: any=[];

  valueSubs: any;
  centerData: any;
  serviceModalVisible: boolean;

  appUserList: any[]=[];
  userDetail: any;
  visibleUserForm: boolean;
  isStaffChecking: boolean;
  isSpinning: boolean;
  // newBooking: boolean;
  showResetConfirmationAlert: boolean=false;
  confirmationCancelForm: boolean;
  selectedIndex: any;
  @Input() newBooking: boolean;
  selectedDate:Date = new Date()
  isloadingStaffFilterList: boolean;
  filterStaffList: any[]=[];
  filterStaffList2: any[]=[];
  filterStaffList3: any[]=[];
  autoCompleteStaffList: any[]=[];
  showFilterPopSingle: any;
  selectAllTherapistValue: boolean = true;
  selectedStaffList: any[];
  visibleCustomerList: boolean;
  registerNewUser: boolean;
  productData: any;
  categoryList: any[];
  currentRoute: any;
  isTreatmentLoaded: boolean;
  navigateTo: any;
  promocodeText: string='';
  isStaffListLoading: boolean;
  isTimeSlotLoading: any;
  isUserListLoading: any;
  submitted:boolean = false;
  productList: FormArray
  parseFloat=parseFloat;
  unservicableArea: boolean=false;
  distance: number;
  userReachOutTime: number;
  isUserAddressValid: boolean=true;
  confirmUserAddressAlert: any;
  invalidUserAddressAlert: boolean;
  showNewInvoiceAlert: boolean;
  showVoidInvoiceAlert: boolean;
  timeSlotFinal: any[];
  showSameStaffAlert: boolean=false;
  showSameTimeAlert: boolean=false;
  FORMAT_DD_MM_YYYY: string;
  isNewEmail: boolean;
  typingTimeout: NodeJS.Timeout;
  StartTimeIndex: number;
  StripeEmailEdit: string;
  TimeSlotInterval: any;
  isTreatmentLoading: boolean;
  isManualAddressEdit: any=false;
  showAddressOverWriteAlert: boolean=false;
  fillUser: any;
  PRODUCT_DISPATCH_TYPE = this.bookingService.PRODUCT_DISPATCH_TYPE;
  guestForm: FormGroup;
  sendSelectedDate: any='';
  confirmationBackForm: boolean;
  PaidAmount: any;
  organisationList: any[]=[];
  prevDateSelected: any;
  orgReachOutTime: any;
  orgSubs: any;
  orgFilterList: any[]=[];
  filteredOrg: any[]=[];
  treatmentDetailFiltered: any[];
  showRecentBookingAlert: boolean;
  treatmentDetailNew: any[];
  ServiceZipcode: any=[];
  showNonServiceAlert: boolean;
  selectedValue:any
 
  @ViewChild("placesRef", { static: true }) placesRef: GooglePlaceDirective;
  @ViewChild("placesRef1", { static: true }) placesRef1: GooglePlaceDirective;
  options = {
    componentRestrictions: { country: 'NL' }
  }
  addressSubs: any;
  OnlyCopy: boolean;
  emailsub: any;
  appUserListAll: any[]=[];
  searchCustValue: any=null;
  showSaveUserRecordAlert: any=false;
  saveUserDetailRecord: boolean=false;
  userDetailShow: any;
  
  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService,
    private calendarService: CalendarService,
    private cookieService: CookieService,
  ) {

    // this.getStaffFilterList(true)
    // this.getTimeSlots()
    // this.getUserList();
    // console.log(this.timeSlots)
    this.currentRoute = this.router.getCurrentNavigation();
    if (this.currentRoute.extras.state && this.currentRoute.extras.state.selectedDate){
      this.selectedDate=this.currentRoute.extras.state.selectedDate
      this.sendSelectedDate=this.currentRoute.extras.state.selectedDate
    }
   
    if (this.currentRoute.extras.state && this.currentRoute.extras.state.from){ 
      this.navigateTo=this.currentRoute.extras.state.from
      // history.pushState(null, '', this.navigateTo)
    }else{
      this.navigateTo='/calendar/'
      // history.pushState(null, '', '/calendar/')
    } 
    this.navigateTo='/calendar/'
    this.bookingForm = fb.group({
      UserId: [null, [Validators.required]],
      Name: [null, [Validators.required]],
      Email: [null, [Validators.required]],
      DateTime: [null, [Validators.required]],
      Amount: [0, [Validators.required]],
      Products: this.fb.array([]),
      BookingId: [null],
      Zip: [null, [Validators.required]],
      HouseNumber: [null, [Validators.required]],
      Elevator: [null, [Validators.required]],
      PaymentStatusName: [null],
      PaymentStatus: [null],
      Distance: [null],
      ReachOutTime: [null],
      Street: [null],
      City: [null],
      Latitude: [null],
      Longitude: [null],
      SpecialRequest: [null],
      BookingChannelId: [null],
      TravelFee: [0],
      PromoCode: [null],
      PromoCodeId: [null],
      PromoAmount: [null],
      AdminNotes: [null],
      PaymentType: [null,[Validators.required]],
      PaidPrice: [0, [Validators.required]],
      Status:[null],
      OrganisationLocationId:[null],
      BookedBy:[null,[Validators.required]],
      FullAddress:[null,[Validators.required]],

    });
    this.treatmentForm = this.fb.group({
      ProductId: [null, [Validators.required]],
      Name: [null, [Validators.required]],
      StartTime: [null, [Validators.required]],
      Duration: [null, [Validators.required]],
      StaffName: [null, [Validators.required]],
      GoogleEmail: [null, [Validators.required]],
      AddOns: [null],
      StaffId: [null, [Validators.required]],
      Amount: [0, [Validators.required]],
      AvailableStaff: [null],
      CategoryId: [null],
      TotalAmount: [0],
      PreparationTime: [null],
      BookingProductId: [null],
      Skills: [Object],
      DiscountedAmount: [0],
      Discount: [0],
      Guest :this.fb.group({}),
    });
    this.userForm = this.fb.group({
      Name: [null, [Validators.required]],
      Email: [null],
      Contact: [null],
      Gender: [null],
      Street: [null],
      // Floor: [null],
      City: [null],
      Zip: [null],
      Elevator: [null],
      Therapist: [null],
      PreferredLanguage: [null],
      ClientSource: [null],
      DOB: [null, ],
      HouseNumber: [null],
      Distance: [null],
      Notes: [null],
      ReachOutTime: [null],
      UserId: [null],
      FromCMS:[null],
      FullAddress:[null]

    });
    this.guestForm = this.fb.group({
      Name: [null],
      Gender: [null],
      Contact: [null],
      Therapist: [null],
      Notes: [null]
  });
    this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:null,"isSkillPresent":null,timeSlots:this.timeSlots, groups: [], skills: [], searchValue: '', isWorking: '1', staffData: [],OrganisationLocationId:[]}];
    this.reachOutTime=30
    this.rootUser={}
    this.prefLanguage = this.bookingService.getPrefLanguage();
    this.clientSource = this.bookingService.getClientSource();
    this.prefTherList = this.bookingService.getPrefTherList();
    this.genderList = this.bookingService.getGenderList();
    this.staffFilterArray = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[]}
    this.staffFilterArray2 = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[]}
    this.filteredGroups = [];
    this.selectedTherapist = {};
    this.selectedTherapistId = null;
    // this.selectedUser = null;
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.filteredCategories = [];
    this.FORMAT_DD_MM_YYYY = "DD/MM/YYYY";
    
    
  }

  ngOnInit  () {
    history.pushState(null, null, location.href);
    this.updatePaymentTypeOptions() 
    if(this.currentRoute.extras.state.BookingId){
      this.editBooking(this.currentRoute.extras.state.BookingId)
    }else{
      if(this.currentRoute.extras.state.staffId && this.currentRoute.extras.state.time){
        this.openNewBooking(this.currentRoute.extras.state.staffId,this.currentRoute.extras.state.time);
      }else{
        this.openNewBooking();
      }
      
    }
    
    
    
    
  }
  
  scroollopendrop(e)
  {
    console.log("check");
    console.log(e)
    if(e==true)
    {
      setTimeout(() => {
        let classselect=document.getElementsByClassName('ant-select-dropdown-menu-root');
        // classselect[0].children.item.
      // console.log(classselect);
      // console.log(classselect[0].children[0].clientHeight);
      console.log("starttime="+this.StartTimeIndex);
      let clientLiHeight=classselect[0].children[0].clientHeight;
      if(!this.StartTimeIndex){
        this.StartTimeIndex=50;
      }
      classselect[0].scrollTop=(this.StartTimeIndex*clientLiHeight);
      
      }, 100);;
      
    }
    
  }

  
  resetSkillSelect() {
    this.staffFilterArray.skills = []
    this.filteredCategories = [];
    this.productData.forEach(product => {
      product.selected = false;
    })
    this.categoryList.forEach(cat => {
      cat.Selected=false;
      cat.Products.forEach(product => {
      product.selected = false;
      })
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }
  resetGroupSelect() {
    this.staffFilterArray.groups = []
    this.filteredGroups = [];
    this.staffGroupData.forEach(group => {
      group.selected = false;
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }
 
  resetOrgSelect() {
    this.staffFilterArray.OrganisationLocationId = []
    this.filteredOrg = [];
    this.organisationList.forEach(org => {
      org.selected = false;
    })
    this.getStaffFilterList();
    //  this.getStaffList();
  }
 
  
  onSelectCategory(category) {
    console.log(category)
    if (category.Selected) {
      category.Products.forEach(pro => {
        pro.selected = true

      });
    } else {
      category.Products.forEach(pro => {
        pro.selected = false

      });
    }

  }
  onTreatmentChange(event) {
    // console.log(event)
    // if (event) {
    //     // this.selectedTreatementDetail= this.treatmentDetail.find(category => (category.Products.find(prod=> prod.ProductId===this.selectedTreatment))
    //     this.selectedTreatmentDetail = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === event);
    //     this.selectedTreatmentDetail.Text=this.selectedTreatmentDetail.Category.charAt(0).toUpperCase();
    //     // this.selectedTreatments[event].selectedTreatmentDetail=this.selectedTreatmentDetail
    // }
    // console.log(this.selectedTreatmentDetail)
  }
  openNewBookingOLD(staffId=null,time=null) {
    // this.checkToday()
    this.editBookingDetail={}
    // this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:true,"isSkillPresent":false}];
    let productArray = this.bookingForm.get('Products') as FormArray;
    let lastindex=productArray.push(this.pushProductControls());
    let status="PENDING"
    let statusValue=6

    this.bookingForm.controls.PaymentStatusName.setValue(status)
    this.bookingForm.controls.PaymentStatus.setValue(statusValue)
    this.bookingForm.controls.DateTime.setValue(momentz.tz(this.selectedDate, environment.STAFF_ZONE).format("YYYY-MM-DD"))
    this.subscribeChanges();
    let prodControls = productArray.controls
    if(staffId){
      this.setTherapist(staffId)
    }
    if(time){
      prodControls[0].get("StartTime").setValue(time)
    }
    this.selectedTreatments[0].timeSlots=this.timeSlotFinal
    this.newBooking = true;

  }
  openNewBooking(staffId = null, time = null) {
    let today = moment().tz(environment.STAFF_ZONE).toDate();
    let selectedDay = moment(this.selectedDate, this.FORMAT_DD_MM_YYYY).startOf("day");
    
    if (selectedDay.isBefore(today)) {
      this.selectedDate = moment().tz(environment.STAFF_ZONE).toDate();
    }
    this.editBookingDetail = {}
    // this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:true,"isSkillPresent":false}];
    let productArray = this.bookingForm.get('Products') as FormArray;
    let lastindex = productArray.push(this.pushProductControls());
    let status = "PENDING"
    let statusValue = 6

    this.bookingForm.controls.PaymentStatusName.setValue(status)
    this.bookingForm.controls.PaymentStatus.setValue(statusValue)
    this.bookingForm.controls.DateTime.setValue(momentz.tz(this.selectedDate, environment.STAFF_ZONE).format("YYYY-MM-DD"))
    let adminName= this.cookieService.get("adminName")
    this.bookingForm.controls.BookedBy.setValue(adminName)
    this.subscribeChanges();
    let prodControls = productArray.controls
    
   
   
    this.newBooking = true;

    //fetch data in background
    this.calendarService.getStaffFilterList(moment(this.selectedDate).format("MM/DD/YYYY")).then(results => {
      this.filterStaffList = this.calendarService.filterStaffList
      this.filterStaffList2 = this.calendarService.filterStaffList
      this.autoCompleteStaffList = this.filterStaffList;
      if (staffId) {
        this.setTherapist(staffId)
      }
    });

    //fetch organisation data for dropdown
    this.calendarService.getOrganisationList(true).then(results => {
  
      let organisationList = this.calendarService.organisationList
      this.organisationList=[...organisationList]
      this.organisationList.forEach(org => {
        org.selected = false;
      });
      this.sortOrganisationList()
      console.log(this.organisationList)
    });

    // this.calendarService.getUserList()
    this.calendarService.getTreatments().then(results => {
      this.treatmentDetail = this.calendarService.treatmentDetail
      this.setTreatments(null)
    });

   
    this.calendarService.getUserList().then(results => {

      this.appUserListAll = this.calendarService.appUserList
      if(this.searchCustValue){
        const trimmedValue = this.searchCustValue.toLowerCase().trim();

      this.appUserList = this.appUserListAll.filter(option =>
        option.Name.toLowerCase().includes(trimmedValue)
      );
      this.sortUserList()

      }else{
        this.appUserList=[]
      }
      
      this.sortUserList()
    });

   
    // this.calendarService.getOrganisationList().then(results => {

    //   this.organisationList = this.calendarService.organisationList
    //   this.sortOrganisationList()
    // });


    this.calendarService.getMetadata().then(results => {
      this.metadata = this.calendarService.metadata
      if (this.metadata.StaffCalView) {
        this.staffViewList = this.metadata.StaffCalView;
      }
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
        this.sortSpecialRequest();
      }
      if (this.metadata.BookingChannelData) {
        this.BookingChannelData = this.metadata.BookingChannelData;
      }
      console.log(this.metadata)
      if (this.metadata.ServiceZipcode) {
        this.ServiceZipcode = this.metadata.ServiceZipcode;
        let zip=this.bookingForm.get('Zip').value
        if(zip){
          let serviceZipFound= this.ServiceZipcode.findIndex(f => f.Zipcode.toLowerCase().replace(/ /g,'') === zip.toLowerCase().replace(/ /g,''));
          if(serviceZipFound==-1){
            console.log(" this.showNonServiceAlert", this.showNonServiceAlert)
            this.showNonServiceAlert=true
          }
        }
       
      }
      
    });
    this.calendarService.getTimeSlots().then(results => {

      if (this.calendarService.TimeSlotInterval) {
        this.TimeSlotInterval = this.calendarService.TimeSlotInterval;
      } else {
        this.TimeSlotInterval = 5;
      }
      this.timeSlots=this.calendarService.timeSlots
      this.checkToday();
      this.selectedTreatments[0].timeSlots = this.timeSlotFinal
      if (time) {
        prodControls[0].get("StartTime").setValue(time)
      }
    });
    

  }
  resetTreatmentPrice(element: AbstractControl, index: number) {
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    prodControls[index].get("Amount").setValue(0)
    prodControls[index].get("TotalAmount").setValue(0)
    prodControls[index].get("Duration").setValue(null)
    prodControls[index].get("AddOns").setValue(null)
  }
  subscribeChanges() {
    let productArray = this.bookingForm.get('Products') as FormArray;

    productArray.controls.forEach((element, index) => {
      this.durationSubs = element.get('Duration').valueChanges.subscribe(val => {
        this.setControls(element, index)
        this.calculateTotalPrice()
        this.checkAvailability(index)
        this.verifyPromoAmount(true)
        
        //  this.updateDurationArray()


      });
      this.addOnSubs = element.get('AddOns').valueChanges.subscribe(val => {
        this.setControls(element, index)
        this.checkAvailability(index)
        this.calculateTotalPrice()
        this.verifyPromoAmount(true)

      });
      this.productSubs = element.get('ProductId').valueChanges.subscribe(val => {
        
        console.log("dd")
        this.resetTreatmentPrice(element, index)
        if(val){
          this.updateProductArray(val, index)
        }
        
        this.calculateTotalPrice()
        this.checkAvailability(index)
        this.checkStaffSkill(index)
      });


      this.staffSubs = element.get('StaffId').valueChanges.subscribe(val => {
        this.checkAvailability(index)
        this.checkStaffSkill(index)
      });
      this.startTimeSubs = element.get('StartTime').valueChanges.subscribe(val => {
        this.checkAvailability(index)
        this.checkSameTime(index);
        this.checkingLeadTime(index);
      });
      
      



    });
    this.userIdSubs = this.bookingForm.get('UserId').valueChanges.subscribe(val => {
      console.log(val)
      if (val != null && val!=-1 && val!=undefined ) {
        this.getUserDetail(val);
        this.appUserList = this.appUserListAll.filter(option =>
          option.UserId==val
        );
        console.log( this.appUserList )
      }else{
        if(val==-1){
          this.userDetail = { ...this.rootUser }
         
          switch ( this.userDetail.Therapist) {
            case 0: this.userDetail.TherapistString = "Male";
                break;
            case 1: this.userDetail.TherapistString = "Female";
                break;
            case 2: this.userDetail.TherapistString = "Either";
                break;
        }
          this.setUserConstraints(this.userDetail);
          this.userDetailShow={ ...this.userDetail }
        }
      }
      if(!this.bookingForm.controls.OrganisationLocationId.value){
        
      this.bookingForm.controls.PaymentType.setValue(null)
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      }else{
        this.bookingForm.controls.PaymentType.setValue(0)
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      }
      this.isNewEmail=false
this.showSendingInvoice=false
      
      this.updateUserArray(val)
    });
    this.dateTimeSubs = this.bookingForm.get('DateTime').valueChanges.subscribe(val => {
      if(val){
        this.prevDateSelected=cloneDeep(this.selectedDate)
        this.selectedDate=val
        this.staffFilterArray.selectedDate=moment(this.selectedDate).format("MM/DD/YYYY")
        this.getStaffFilterList();
        this.sendSelectedDate=val
        
      }
      this.setTimeSlot(this.timeSlots)
      
      productArray.controls.forEach((element, index) => {
       
        element.get("StaffId").setValue(null)
        element.get("StaffName").setValue(null)
        element.get("GoogleEmail").setValue(null)
        element.get("Skills").setValue(null)
        // this.validatePromocode(true)
      })
      this.selectedTreatments.forEach((element, index) => {
        console.log(this.timeSlotFinal)
        this.selectedTreatments[index].timeSlots=this.timeSlotFinal
        this.selectedTreatments[index].groups=[]
        this.selectedTreatments[index].skills=[]
        this.selectedTreatments[index].searchValue=[]
        this.selectedTreatments[index].isWorking='1'
        // this.selectedTreatments[index].OrganisationLocationId=[]
        // this.selectedTreatments[index].staffDat=this.timeSlotFinal
      })
    });
    this.zipSubs = this.bookingForm.get('Zip').valueChanges.subscribe(val => {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        if (val != null && val!=-1 && val!=undefined ) {
        
          // this.getAddress();
          this.isManualAddressEdit=true
          if(val.length>3){
            this.ServiceZipcode = this.metadata.ServiceZipcode;
          let serviceZipFound= this.ServiceZipcode.findIndex(f => val.toLowerCase().replace(/ /g,'').includes(f.Zipcode.toLowerCase().replace(/ /g,'')));
            if(serviceZipFound==-1){
              console.log(" this.showNonServiceAlert", this.showNonServiceAlert)
              this.showNonServiceAlert=true
            }
          }
          productArray.controls.forEach((element, index) => {
            this.checkAvailability(index)
            // this.validatePromocode(true)
          })
        }
      }, 900);
     
      // this.getAddress();
    });
    this.houseNoSubs = this.bookingForm.get('HouseNumber').valueChanges.subscribe(val => {
      if (val != null && val!=-1 && val!=undefined ) {
        // this.getAddress();
        this.isManualAddressEdit=true
        productArray.controls.forEach((element, index) => {
          this.checkAvailability(index)
          // this.validatePromocode(true)
        })
      }
      
    });
    // this.addressSubs = this.bookingForm.get('FullAddress').valueChanges.subscribe(val => {
    //   if (val != null && val!=-1 && val!=undefined ) {
    //     this.getDistance();
    //     // this.isManualAddressEdit=true
    //     // productArray.controls.forEach((element, index) => {
    //     //   this.checkAvailability(index)
    //     //   // this.validatePromocode(true)
    //     // })
    //   }
      
    // });
    this.travelFeeSubs = this.bookingForm.get('TravelFee').valueChanges.subscribe(val => {
      this.calculateTotalPrice();
      
    });
    this.emailsub = this.bookingForm.get('Email').valueChanges.subscribe(val => {
      this.updatePaymentTypeOptions() 
      
    });
    this.travelFeeSubs = this.bookingForm.get('PaymentType').valueChanges.subscribe(val => {
      if (val ==1 ) {
        this.showSendingInvoice=true;
        this.isNewEmail=true;
      }else if(val==2){
        this.showSendingInvoice=false;
        this.isNewEmail=false;
      }else{

      }
      
    });

    this.orgSubs = this.bookingForm.get('OrganisationLocationId').valueChanges.subscribe(val => {
      console.log("called changes")
      if (val) {
        let organisation= this.organisationList.find(org => org.OrganisationLocationId === val)
        this.bookingForm.get('Zip').setValue(organisation.Zip)
        this.bookingForm.get('HouseNumber').setValue(organisation.HouseNumber)
        this.bookingForm.get('ReachOutTime').setValue(organisation.ReachOutTime)
        this.bookingForm.get('City').setValue(organisation.City)
        this.bookingForm.get('Street').setValue(organisation.Street)
        let address=((organisation.Street) ? organisation.Street+' ' : '')  + ((organisation.HouseNumber)?organisation.HouseNumber:",") +((organisation.Zip)?organisation.Zip:'')+ " " + ((organisation.City) ? organisation.City : '') 
        this.bookingForm.get('FullAddress').setValue(address)
        this.bookingForm.get('PaymentType').setValue(0)
        this.isNewEmail=false
        this.showSendingInvoice=false
        this.orgReachOutTime=organisation.ReachOutTime
        this.AddressShow=address
        this.getDistance()
        productArray.controls.forEach((element, index) => {
          this.checkAvailability(index)
          // this.validatePromocode(true)
          element.get('StaffId').setValue(null)
          element.get('ProductId').setValue(null)
          element.get('Duration').setValue(null)
          element.get('Name').setValue(null)
          element.get('StaffName').setValue(null)
          element.get('GoogleEmail').setValue(null)
          element.get("AddOns").setValue(null)
        })
        this.selectedTreatments.forEach((element, index) => {
          this.selectedTreatments[index].OrganisationLocationId=[val]
        })
        console.log("remove validati")
        this.bookingForm.controls.UserId.clearValidators();
        this.bookingForm.controls.UserId.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        this.bookingForm.controls.Email.clearValidators();
        this.bookingForm.controls.Email.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        this.bookingForm.controls.Name.clearValidators();
        this.bookingForm.controls.Name.updateValueAndValidity({ onlySelf: true,emitEvent: false });
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        
        this.setTreatments(val)
      }else{
        this.bookingForm.get('Zip').setValue(null)
        this.bookingForm.get('HouseNumber').setValue(null)
        this.bookingForm.get('City').setValue(null)
        this.bookingForm.get('Street').setValue(null)
        this.bookingForm.get('FullAddress').setValue(null)
        this.bookingForm.get('PaymentType').setValue(null)
        this.AddressShow=null
        this.DistanceShow=null
        this.orgReachOutTime=null
        this.isNewEmail=false
        this.showSendingInvoice=false
        this.selectedTreatments.forEach((element, index) => {
          this.selectedTreatments[index].OrganisationLocationId=[]
        })    
         
        this.setTreatments(null)  
        productArray.controls.forEach((element, index) => {
          this.checkAvailability(index)
          // this.validatePromocode(true)
          element.get('StaffId').setValue(null)
          element.get('ProductId').setValue(null)
          element.get('Duration').setValue(null)
          element.get('Name').setValue(null)
          element.get('StaffName').setValue(null)
          element.get('GoogleEmail').setValue(null)
          element.get("AddOns").setValue(null)
        })
        this.bookingForm.controls.UserId.setValidators([Validators.required]);
        this.bookingForm.controls.UserId.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        this.bookingForm.controls.Name.setValidators([Validators.required]);
        this.bookingForm.controls.Name.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        this.bookingForm.controls.Email.setValidators([Validators.required]);
        this.bookingForm.controls.Email.updateValueAndValidity({ onlySelf: true,emitEvent: false });  } 
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
        this.updatePaymentTypeOptions() 
        
      
      
    });
  }
  addressUpdateHandler(){
    this.getDistance();
    this.isManualAddressEdit=true
    let productArray = this.bookingForm.get('Products') as FormArray;
    productArray.controls.forEach((element, index) => {
      this.checkAvailability(index)
      // this.validatePromocode(true)
    })
  }

  onTherapistSelection(treatmentIndex, event) {
    let staff = event.nzValue;
    if (staff) {
      setTimeout(() => {
        this.applyStaffFilterForm(treatmentIndex, staff)
        this.checkAvailability(treatmentIndex)
        this.checkStaffSkill(treatmentIndex)
        this.checkSameTime(treatmentIndex)
      }, 10);
    } else {
      this.resetSelectedStaffForTreatment(treatmentIndex);
    }
  }

  onInput(value, treatmentIndex) {
    this.autoCompleteStaffList = this.filterStaffList.filter(staff => staff.Name.toLowerCase().startsWith(value.toLowerCase()));
    this.sortStaffList()
    this.resetSelectedStaffForTreatment(treatmentIndex);
  }

  subscribeUserFormChanges() {
    
    // this.valueSubs = this.userForm.controls.Zip.valueChanges.subscribe(val => {
    //   this.getUserAddress();
      
    // });
    // this.valueSubs = this.userForm.controls.HouseNumber.valueChanges.subscribe(val => {
    //   this.getUserAddress();
    // });
  }
  getReachOutTime() {
    
      this.webapi.request(API.METADATA, {
        Metadata: ['Center'],
        Source: this.centerData.Address,
        Destination: this.AddressShow
      }).subscribe(
        data => {
         
          const tempData = { ...data.body.Data };
          this.centerData = tempData.Center[0];
          const reachData = tempData.ReachOutData;
          if (reachData.rows[0].elements[0].status !== "OK") {
            // this.toast.error({
            //   title: "Error",
            //   msg: "Sorry, we are not in selected location yet.",
            //   theme: "bootstrap",
            //   timeout: 3000
            // })
            // this.unservicableArea=true;
            this.reachOutTime=30
          } else {
            this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
            let distance = reachData.rows[0].elements[0].distance.value / 1609;
            this.distance=distance;
            // this.unservicableArea=false;
            console.log("this.reachOutTime",this.reachOutTime)
            // if (distance > this.centerData.ServiceArea) {
            //   this.serviceModalVisible = true;
            // } else {
              
            // }
          }
          this.bookingForm.controls.ReachOutTime.setValue(this.reachOutTime);
        },
        error => {
          
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: "bootstrap",
            timeout: 3000
          })
        }
      );
  }

  getUserReachOutTime() {
    
    this.webapi.request(API.METADATA, {
      Metadata: ['Center'],
      Source: this.centerData.Address,
      Destination: this.AddressShow
    }).subscribe(
      data => {
       
        const tempData = { ...data.body.Data };
        this.centerData = tempData.Center[0];
        const reachData = tempData.ReachOutData;
        if (reachData.rows[0].elements[0].status !== "OK") {
          // this.toast.error({
          //   title: "Error",
          //   msg: "Sorry, we are not in selected location yet.",
          //   theme: "bootstrap",
          //   timeout: 3000
          // })
          // this.unservicableArea=true;
          this.userReachOutTime=30;
        } else {
          this.userReachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
          let distance = reachData.rows[0].elements[0].distance.value / 1609;
          this.distance=distance;
          // if (distance > this.centerData.ServiceArea) {
          //   this.serviceModalVisible = true;
          // } else {
            
          // }
        }
        this.userForm.controls.ReachOutTime.setValue(this.userReachOutTime)
      },
      error => {
        
        this.toast.error({
          title: "Error",
          msg: error.headers.get('message'),
          theme: "bootstrap",
          timeout: 3000
        })
      }
    );
}
  
  // getAddress(isUser=null) {
  //   let zip=null
  //   let houseNo=null
  //   zip=this.bookingForm.controls.Zip.value
  //   houseNo=this.bookingForm.controls.HouseNumber.value
  //   clearTimeout(this.typingTimeout);
   
  //     this.typingTimeout = setTimeout(() => {
  //       this.ServiceZipcode = this.metadata.ServiceZipcode;
  //       if(this.ServiceZipcode.length!=0){
  //         // let serviceZipFound= this.ServiceZipcode.findIndex(f => f.Zipcode === val);
          
  //       }
  //       if (zip!=null && houseNo!=null && zip.length>3 && houseNo.length>1) {
  //         let serviceZipFound= this.ServiceZipcode.findIndex(f => zip.toLowerCase().replace(/ /g,'').includes(f.Zipcode.toLowerCase().replace(/ /g,'')));
  //         if(serviceZipFound==-1){
  //           console.log(" this.showNonServiceAlert", this.showNonServiceAlert)
  //           this.showNonServiceAlert=true
  //         }
  //       let obj = {
  //         Zipcode: zip,
  //         HouseNumber: houseNo
  //       }
  //       this.isloadingAddress=true;
  //       this.webapi.request(API.GET_ADDRESS, obj)
  //         .subscribe(
  //           data => {
  //             this.isloadingAddress=false;
  //             this.AddressObject = { ...data.body.Data };
  //             console.log(this.AddressObject)
              
  //               this.AddressShow=this.AddressObject.StreetName+" "+this.AddressObject.HouseNumber+", "+this.AddressObject.City+" "+this.AddressObject.PostalCode
  //               this.DistanceShow=this.AddressObject.Distance
  //               this.DistanceUnit=this.AddressObject.DistanceInMeter
  //               this.bookingForm.controls.Distance.setValue(this.AddressObject.DistanceInMeter)
  //               this.bookingForm.controls.Street.setValue(this.AddressObject.StreetName)
  //               this.bookingForm.controls.City.setValue(this.AddressObject.City)
  //               this.bookingForm.controls.Latitude.setValue(this.AddressObject.Latitude)
  //               this.bookingForm.controls.Longitude.setValue(this.AddressObject.Longitude)
              
  //             this.getReachOutTime()
  //             this.checkAddress()
  //           },
  //           error => {
  //             this.isloadingAddress=false;
  //             this.AddressShow=null
  //               this.DistanceShow=null
  //               this.DistanceUnit=null
  //               this.bookingForm.controls.Distance.setValue(null)
  //               this.bookingForm.controls.Street.setValue(null)
  //               this.bookingForm.controls.City.setValue(null)
  //               this.bookingForm.controls.Latitude.setValue(null)
  //               this.bookingForm.controls.Longitude.setValue(null)
  //               this.checkAddress()
  //             console.log("errp")
  //             this.toast.error({
  //               title: "Error",
  //               msg: error.headers.get("message"),
  //               timeout: 3000,
  //               theme: "bootstrap"
  //             })
  //           }
  //         )
  //       }
  //     }, 900);
      
    

  // }

  getUserAddress() {
    let zip=null
    let houseNo=null
    zip=this.userForm.controls.Zip.value
    houseNo=this.userForm.controls.HouseNumber.value
    
    if (zip!=null && houseNo!=null && zip.length>3 && houseNo.length>1) {
      let obj = {
        Zipcode: zip,
        HouseNumber: houseNo
      }
      clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.isloadingAddress=true;
      this.webapi.request(API.GET_ADDRESS, obj)
        .subscribe(
          data => {
            this.isloadingAddress=false;
            this.AddressObject = { ...data.body.Data };
            console.log(this.AddressObject)

            this.newUserAddressShow=this.AddressObject.StreetName+" "+this.AddressObject.HouseNumber+", "+this.AddressObject.City+" "+this.AddressObject.PostalCode
              this.newUserDistanceShow=this.AddressObject.Distance
              this.userForm.controls.Distance.setValue(this.AddressObject.Distance)
              this.userForm.controls.Street.setValue(this.AddressObject.StreetName)
              this.userForm.controls.City.setValue(this.AddressObject.City)
           
            this.getUserReachOutTime()
            this.checkUserAddress()
          },
          error => {
            this.isloadingAddress=false;
            this.AddressShow=null
              this.DistanceShow=null
              this.DistanceUnit=null
              this.userForm.controls.Distance.setValue(null)
              this.userForm.controls.Street.setValue(null)
              this.userForm.controls.City.setValue(null)
              this.checkUserAddress()
            console.log("errp")
            this.toast.error({
              title: "Error",
              msg: error.headers.get("message"),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    }, 700);
      
    }

  }
  
  updateDurationArray() {
    throw new Error('Method not implemented.');
  }
  updateProductArray(productId, index: number,) {
    console.log(productId)
    var foundProduct = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === productId)
    if (foundProduct) {
      foundProduct.Text=foundProduct.Category.charAt(0).toUpperCase();
      this.selectedTreatments[index].selectedTreatmentDetail=foundProduct;
    }
    // console.log(this.selectedTreatments[index].selectedTreatmentDetail)
    let productArray = this.bookingForm.get('Products') as FormArray;
    if(productArray.length>0){
      let prodControls = productArray.controls
      prodControls[index].get("CategoryId").setValue(foundProduct.CategoryId)
      prodControls[index].get("Name").setValue(foundProduct.ProductName)
      prodControls[index].get("PreparationTime").setValue(foundProduct.PreparationTime)
    }
    
    let availStaff=[]
  }
  updateUserArray(userId, isFromEdit = null) {
    // console.log(userId)
    var foundUser = this.appUserListAll.find(c => c.UserId === userId)
    if (foundUser) {
      this.bookingForm.get('Name').setValue(foundUser.Name)
      this.bookingForm.get('Email').setValue(foundUser.Email)
      this.bookingForm.get('ReachOutTime').setValue(foundUser.ReachOutTime)
      if (!isFromEdit) {
        if(!this.bookingForm.get('OrganisationLocationId').value){
          if(this.isManualAddressEdit && this.bookingForm.get("FullAddress").value){
            this.showAddressOverWriteAlert=true;
            this.fillUser=foundUser
          }else{
            this.bookingForm.get('Zip').setValue(foundUser.Zip, { emitEvent: true })
          this.bookingForm.get('HouseNumber').setValue(foundUser.HouseNumber, { emitEvent: true })
          this.bookingForm.get('Distance').setValue(foundUser.Distance, { emitEvent: false })
          this.bookingForm.get('Street').setValue(foundUser.Street, { emitEvent: false })
          this.bookingForm.get('City').setValue(foundUser.City, { emitEvent: false })
          this.bookingForm.get('Latitude').setValue(foundUser.City, { emitEvent: false })
          this.bookingForm.get('Longitude').setValue(foundUser.City, { emitEvent: false })
          if(foundUser.FullAddress){
             this.bookingForm.get('FullAddress').setValue(foundUser.FullAddress,{ emitEvent: true })
          }
          else{
            let address=((foundUser.Street) ? foundUser.Street+' ': '') +  ((foundUser.HouseNumber)?foundUser.HouseNumber+", ":"") +(( foundUser.Zip)? foundUser.Zip:'')+ " " + ((foundUser.City) ? foundUser.City : '')
            this.bookingForm.get('FullAddress').setValue(address,{ emitEvent: true })
          }
          this.addressUpdateHandler()
          }
        }
       
        
      }
      this.checkAddress();
    }
  }
  confirmAddressOverWrite(){
    let foundUser=this.fillUser
    this.isManualAddressEdit=false
    this.bookingForm.get('Zip').setValue(foundUser.Zip, { emitEvent: false })
        this.bookingForm.get('HouseNumber').setValue(foundUser.HouseNumber, { emitEvent: false })
        this.bookingForm.get('Distance').setValue(foundUser.Distance, { emitEvent: false })
        this.bookingForm.get('Street').setValue(foundUser.Street, { emitEvent: false })
        this.bookingForm.get('City').setValue(foundUser.City, { emitEvent: false })
        this.bookingForm.get('Latitude').setValue(foundUser.City, { emitEvent: false })
        this.bookingForm.get('Longitude').setValue(foundUser.City, { emitEvent: false })
        if(foundUser.FullAddress){
          this.bookingForm.get('Longitude').setValue(foundUser.FullAddress)
       }
       else{
         let address=((foundUser.Street) ? foundUser.Street+' ' : '') + ((foundUser.HouseNumber)?foundUser.HouseNumber+',':"") +((foundUser.Zip)?foundUser.Zip:'')+ " " + ((foundUser.City) ? foundUser.City : '') + ", " 
         this.bookingForm.get('FullAddress').setValue(address)
         this.AddressShow=address
       }
        
              this.bookingForm.get('ReachOutTime').setValue(this.userDetail.ReachOutTime)
              this.addressUpdateHandler()
        this.checkAddress();
  }
 
  setControls(element, index) {
    
    let productId=element.get('ProductId').value
    let duration=element.get('Duration').value
    let addons=element.get('AddOns').value
    let price=0
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    console.log(productId) 
    var foundProduct = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === productId)
    // console.log(foundProduct)
    if (foundProduct) {
      
      let selDuration = foundProduct.Durations.find(dr => dr.Duration === duration);
      // console.log(selDuration)
      if (selDuration) {
        prodControls[index].get("Amount").setValue(selDuration.Amount)

        price = price + selDuration.Amount
      }
      if (addons) {
        addons.forEach(addon => {
          let selAddon = foundProduct.AddOns.find(ad => ad.AddOnId === addon);
          if(selAddon){
            price = price + selAddon.Amount
          }
          
        })
      }
      

    }
    // console.log(price)
    
    prodControls[index].get("TotalAmount").setValue(price)
    prodControls[index].get("DiscountedAmount").setValue(price)
    prodControls[index].get("Discount").setValue(0)
  }

  calculateTotalPrice() {
  let total=0;
  let productArray = this.bookingForm.get('Products') as FormArray;
  productArray.controls.forEach((element,index) => {
    total=total+ element.get("TotalAmount").value
  });
  let travelFee=parseInt(this.bookingForm.get("TravelFee").value)
  if(travelFee){
    total=total+travelFee;
  }
  if(total==0){
    this.discount=0
  }
  let paidPrice=total-this.discount
  
  this.bookingForm.get('Amount').setValue(total);
  this.bookingForm.get('PaidPrice').setValue(paidPrice);
} 
  
  
 



  getUserDetail(userId,editMode=null) {
    // if (this.selectedUser) {
      let obj = {
        UserId: userId
      }
      this.isloadingAnalytics=true;
      this.webapi.request(API.USER_DETAIL, obj)
        .subscribe(
          data => {
            this.isloadingAnalytics=false;
            this.userDetail = { ...data.body.Data };
            this.StripeEmail=this.userDetail.StripeEmail
            this.setUserConstraints(this.userDetail);
            if(!editMode && !this.isManualAddressEdit){
              this.AddressShow=this.userDetail.AddressShow
              this.bookingForm.get('ReachOutTime').setValue(this.userDetail.ReachOutTime)
            }
            this.rootUser = { ...this.userDetail };
            this.userDetailShow={ ...this.userDetail }
            
          },
          error => {
            this.isloadingAnalytics=false;
            console.log("errp")
            this.toast.error({
              title: "Error",
              msg: error.headers.get("message"),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    // }

  }
 
  
  setindex(index){
    this.selectedIndex=index;
  }

  resetSelectedStaffForTreatment(treatmentIndex) {
    let productArray = this.bookingForm.get('Products') as FormArray;
      let prodControls = productArray.controls
    // prodControls[treatmentIndex].get("StaffName").setValue(null)
    prodControls[treatmentIndex].get("StaffId").setValue(null)
    prodControls[treatmentIndex].get("GoogleEmail").setValue(null)
    prodControls[treatmentIndex].get("Skills").setValue(null)
  }

  applyStaffFilterForm(treatmentIndex, selectedStaff,reset=null) {
    let treatmentnewIndex="";
    if (selectedStaff) {
      let productArray = this.bookingForm.get('Products') as FormArray;
      let prodControls = productArray.controls
      prodControls[treatmentIndex].get("StaffName").setValue(selectedStaff.Name)
      prodControls[treatmentIndex].get("StaffId").setValue(selectedStaff.StaffId)
      prodControls[treatmentIndex].get("GoogleEmail").setValue(selectedStaff.GoogleEmail)
      prodControls[treatmentIndex].get("Skills").setValue(selectedStaff.Skills)
      treatmentnewIndex=treatmentIndex;
     
      
     

    } else {
      console.log(this.selectedTherapistId)
      this.filterStaffList.forEach(staff => {
        console.log(staff)
        if (staff.StaffId == this.selectedTherapistId) {
          console.log("in")
          this.selectedTherapist = staff
        }
      })
      this.showFilterPopSingle = false;
      if(!reset){
        this.selectedTreatments.forEach((element,index) => {
          this.selectedTreatments[index].showFilterPopSingle=false;
        });
      }
      let productArray = this.bookingForm.get('Products') as FormArray;
      let prodControls = productArray.controls
      prodControls[this.selectedIndex].get("StaffName").setValue(this.selectedTherapist.Name)
      prodControls[this.selectedIndex].get("StaffId").setValue(this.selectedTherapist.StaffId)
      prodControls[this.selectedIndex].get("GoogleEmail").setValue(this.selectedTherapist.GoogleEmail)
      prodControls[this.selectedIndex].get("Skills").setValue(this.selectedTherapist.Skills)
      treatmentnewIndex=this.selectedIndex;
      // this.isWorkingLabel = isFiltered ? "(Filtered)" : ""
    }

    
    this.selectedTreatments[treatmentnewIndex].groups=cloneDeep(this.staffFilterArray.groups);
    this.selectedTreatments[treatmentnewIndex].skills=cloneDeep(this.staffFilterArray.skills);
    this.selectedTreatments[treatmentnewIndex].isWorking=cloneDeep(this.staffFilterArray.isWorking);
    this.selectedTreatments[treatmentnewIndex].staffData=cloneDeep(this.filterStaffList);
    this.selectedTreatments[treatmentnewIndex].OrganisationLocationId=cloneDeep(this.staffFilterArray.OrganisationLocationId);
    
  }

  setTherapist(staffId) {
   
    this.selectedTherapistId=staffId
    console.log(this.selectedTherapistId)
    this.filterStaffList.forEach(staff => {
      console.log(staff)
      if (staff.StaffId == this.selectedTherapistId) {
        console.log("in")
        this.selectedTherapist = staff
      }
    })
    this.showFilterPopSingle = false;
    this.selectedTreatments.forEach((element,index) => {
      this.selectedTreatments[index].showFilterPopSingle=false;
    });
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    prodControls[0].get("StaffName").setValue(this.selectedTherapist.Name)
    prodControls[0].get("StaffId").setValue(this.selectedTherapist.StaffId)
    prodControls[0].get("GoogleEmail").setValue(this.selectedTherapist.GoogleEmail)
    prodControls[0].get("Skills").setValue(this.selectedTherapist.Skills)
    


    // this.isWorkingLabel = isFiltered ? "(Filtered)" : ""
  }


  setFilterNewBooking(event,treatmentIndex) {

    if(event==true)
    {
      this.staffFilterArray.groups=cloneDeep(this.selectedTreatments[this.selectedIndex].groups);
      this.staffFilterArray.skills=cloneDeep(this.selectedTreatments[this.selectedIndex].skills);
      this.staffFilterArray.isWorking=cloneDeep(this.selectedTreatments[this.selectedIndex].isWorking);
      this.staffFilterArray.OrganisationLocationId=cloneDeep(this.selectedTreatments[this.selectedIndex].OrganisationLocationId);
      // console.log(this.selectedTreatments)
      // if(this.selectedTreatments[this.selectedIndex].staffData.length==0)
      // {
      //   console.log("inkkk");
      //   this.filterStaffList
      // }
      // else{
      //   this.filterStaffList=cloneDeep(this.selectedTreatments[this.selectedIndex].staffData);
      // }
      this.getStaffFilterList()
      this.selectedTreatments[this.selectedIndex].staffData=this.filterStaffList2
      this.filterStaffList=cloneDeep(this.selectedTreatments[this.selectedIndex].staffData);
      this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
      let isFiltered = this.staffFilterArray.groups.length !== 0 || this.staffFilterArray.skills.length !== 0 || this.staffFilterArray.searchValue !== '' || this.staffFilterArray.OrganisationLocationId.length !== 0;
      this.isWorkingLabel = `${this.isWorkingLabel} ${isFiltered ? "(Filtered)" : ""}`;
      // , staffData: []
      this.filteredGroups=[];
      this.filteredCategories = [];
      this.filteredOrg=[]
      console.log(this.staffFilterArray );
      let productArray = this.bookingForm.get('Products') as FormArray;
      let prodControls = productArray.controls
      this.selectedTherapistId = prodControls[ this.selectedIndex].get("StaffId").value;

      this.staffGroupData.forEach(group => {
        if( this.selectedTreatments[this.selectedIndex].groups.indexOf(group.StaffGroupId) !== -1)
        { group.selected = true;
          this.filteredGroups.push(group.Name);
        }
        else{  group.selected = false;  }
      })

      this.organisationList.forEach(org => {
        if( this.selectedTreatments[this.selectedIndex].OrganisationLocationId.indexOf(org.OrganisationLocationId) !== -1)
        { org.selected = true;
          this.filteredOrg.push(org.Name);
        }
        else{  org.selected = false;  }
      })

      this.categoryList.forEach(cat => {
        cat.Selected=false;
        cat.Products.forEach(product => {

          if( this.selectedTreatments[this.selectedIndex].skills.indexOf(product.ProductId) !== -1)
          {  product.selected = true;
            cat.Selected=true;
            if (this.filteredCategories.indexOf(cat.Name) === -1) {
              this.filteredCategories.push(cat.Name)
            }
          }
          else{  product.selected = false;}
         
        })
      })

      
      // this.filterStaffList

     
      
    }
    
  }


  resetStaffFilterForm() {
    this.staffFilterArray = { groups: [], skills: [], searchValue: '', isWorking: '1', selectedDate: moment(this.selectedDate).format("MM/DD/YYYY"),OrganisationLocationId:[]}
    this.filteredCategories = [];
    this.filteredGroups = [];
    this.filteredOrg= [];
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.productData.forEach(product => {
      product.selected = false;
    })

    this.categoryList.forEach(cat => {
      cat.Selected=false;
      cat.Products.forEach(product => {
      product.selected = false;
      })
    })

    this.staffGroupData.forEach(group => {
      group.selected = false;
    })
    // this.getStaffFilterList(true);
    this.filterStaffList=cloneDeep(this.filterStaffList2);
    // this.getStaffList();
    this.selectedTherapistId = null
  }

  setUserConstraints(userData) {
    userData.Address = "";
    if (userData.Floor) {
      userData.Address += userData.Floor + ", ";
    }
    if (userData.Street) {
      userData.Address += userData.Street+ " ";
    }
    if (userData.HouseNumber) {
      userData.Address += userData.HouseNumber;
    }
    if (userData.Zip) {
      userData.Address += ", " + userData.Zip;
    }
    if (userData.City) {
      userData.Address += " " + userData.City;
    }
    if (userData.Address && userData.Address.length > 55) {
      this.userDetail.AddressShow = userData.Address.substr(0, 55) + "...";
      this.userDetail.AddressExtra = true;
    } else {
      this.userDetail.AddressShow = userData.Address;
      this.userDetail.AddressExtra = false;
    }
    if (userData.Notes && userData.Notes.length > 15) {
      this.userDetail.NotesShow = userData.Notes.substr(0, 15) + "...";
      this.userDetail.NotesExtra = true;
    } else {
      this.userDetail.NotesShow = userData.Notes;
      this.userDetail.NotesExtra = false;
    }
    if (userData.CSNotes && userData.CSNotes.length > 15) {
      this.userDetail.CSNotesShow = userData.CSNotes.substr(0, 15) + "...";
      this.userDetail.CSNotesExtra = true;
    } else {
      this.userDetail.CSNotesShow = userData.CSNotes;
      this.userDetail.CSNotesExtra = false;
    }
    if (userData.TherapistNotes && userData.TherapistNotes.length > 15) {
      this.userDetail.TherapistNotesShow = userData.TherapistNotes.substr(0, 15) + "...";
      this.userDetail.TherapistNotesExtra = true;
    } else {
      this.userDetail.TherapistNotesShow = userData.Notes;
      this.userDetail.TherapistNotesExtra = false;
    }
    
    let memberSince = ''
    if (userData.Years > 0) {
      memberSince = `${userData.Years} Year${userData.Years > 1 ? 's' : ''}`
    }
    if (userData.Months > 0) {
      memberSince = `${memberSince}${memberSince != '' ? ' ' : ''}${`${userData.Months} Month${userData.Months > 1 ? 's' : ''}`}`
    }
    if (userData.Days > 0 && memberSince =='') {
      memberSince = `${memberSince}${memberSince != '' ? ' ' : ''}${`${userData.Days} Day${userData.Days > 1 ? 's' : ''}`}`
    }
    
    this.userDetail.MemberSinceString=`${userData.Created} (${memberSince})`;
    if(userData.BookingHistory){
      userData.BookingHistory.forEach((booking, index) => {
        booking.ProductCount=0
        if (booking.Products.length > 1) {
          booking.ProductCount = booking.Products.length - 1
        }
        let bookingStaff=[]
        booking.Products.forEach((prod,prodIndex)=>{
          let staffFound = bookingStaff.find(staffId => staffId === prod.StaffId);
        // console.log(selDuration)
        if (!staffFound) {
          bookingStaff.push(prod.StaffId)
        }
        })
        booking.StaffCount=bookingStaff.length-1
        this.userDetail.BookingHistory[index]=booking
      })
    }
    

  }

  openUserForm() {
    this.visibleUserForm = true;
    this.registerNewUser = true;
    this.visibleCustomerList = false;
    // this.appUser = null;
    window.scroll(0, 0);
    const input = document.getElementById("addressInput");
    this.subscribeUserFormChanges()
    this.userForm.controls.Therapist.setValue(2);
    // this.webapi.request(API.USER, {
    //   ListUserForBooking: true
    // }).subscribe(
    //   data => {
    //     this.appUserList = [...data.body.Data];
    //   },
    //   error => {
    //     this.toast.error({
    //       title: "Error",
    //       msg: error.headers.get("message"),
    //       timeout: 3000,
    //       theme: "bootstrap"
    //     })
    //   }
    // )
    
  }
  editUserForm() {
     this.userForm.patchValue(this.rootUser)
     if(this.rootUser.DOB){
      console.log(moment(this.rootUser.DOB).toDate())

     this.userForm.controls.DOB.setValue(moment(this.rootUser.DOB).toDate())
     }
     
    //  this.userForm.patchValue(this.rootUser)
    this.visibleUserForm = true;
    this.registerNewUser = true;
    this.visibleCustomerList = false;
    this.saveUserDetailRecord=false
    // this.appUser = null;
    window.scroll(0, 0);
    const input = document.getElementById("addressInput");
    this.subscribeUserFormChanges()
    // this.webapi.request(API.USER, {
    //   ListUserForBooking: true
    // }).subscribe(
    //   data => {
    //     this.appUserList = [...data.body.Data];
    //   },
    //   error => {
    //     this.toast.error({
    //       title: "Error",
    //       msg: error.headers.get("message"),
    //       timeout: 3000,
    //       theme: "bootstrap"
    //     })
    //   }
    // )
    
  }

  resetUserForm() {
    this.userForm.reset();
    this.userForm.controls.Therapist.setValue(2);
    this.newUserAddressShow=null;
    this.newUserDistanceShow=null;
    this.userForm.markAsPristine();
  }
  saveUser(saveRecordShow=false, saveDetail=false) {
    if(!this.isUserAddressValid && !this.confirmUserAddressAlert){
      this.invalidUserAddressAlert=true;
      return;
    }else{

      let address = ""; 
      
      if(!saveRecordShow && this.userForm.controls.UserId.value && this.userForm.controls.UserId.value !=-1 && (!this.userForm.get('FullAddress').pristine || !this.userForm.get('Zip').pristine
       || !this.userForm.get('HouseNumber').pristine || !this.userForm.get('Elevator').pristine)){
        this.showSaveUserRecordAlert=true
      }else{
        this.isUserLoading = true;
        if(saveDetail==true){
          this.saveUserDetailRecord=true
        }else{
          this.saveUserDetailRecord=false
        } 

       if(this.userForm.controls.Email.value){
      this.webapi.request(API.CHECK_USER_EMAIL, {
        Email: this.userForm.controls.Email.value,
        UserId: this.userForm.controls.UserId.value
      }).subscribe(
        data => {
          this.isUserLoading = false;
          // this.reachOutTime = Math.round(reachData.rows[0].elements[0].duration.value / 60);
          // this.bookingAddress = address;
          if(this.userForm.controls.UserId.value){
            this.bookingForm.controls.UserId.setValue(this.userForm.controls.UserId.value,{ emitEvent: false })
            this.rootUser = {
              ...this.userForm.value,
              self: true,
              tempId: moment().toDate().getTime(),
              isUpdated:1
            };
          }else{
            this.rootUser = {
              ...this.userForm.value,
              self: true,
              tempId: moment().toDate().getTime(),
              UserId: -1
            };
            this.bookingForm.controls.UserId.setValue(-1,{ emitEvent: false })
          }
          
          // this.userDetail = {}
          if(this.rootUser.UserId==-1){
            this.userDetail = { ...this.rootUser }
          }else{
            this.userDetail.Name=this.rootUser.Name
          this.userDetail.Email=this.rootUser.Email
          this.userDetail.Contact=this.rootUser.Contact
          }
          
          
          console.log(this.rootUser)
          if(!this.bookingForm.controls.OrganisationLocationId.value){
            this.AddressShow = this.newUserAddressShow
          this.DistanceShow = this.newUserDistanceShow
        
         
          this.bookingForm.controls.HouseNumber.setValue(this.rootUser.HouseNumber)
          this.bookingForm.controls.Distance.setValue(this.rootUser.Distance)
          this.bookingForm.controls.Zip.setValue(this.rootUser.Zip)
          this.bookingForm.controls.Elevator.setValue(this.rootUser.Elevator)
          this.bookingForm.controls.FullAddress.setValue(this.rootUser.FullAddress)
          this.bookingForm.controls.Street.setValue(this.rootUser.Street)
          this.bookingForm.controls.PaymentType.setValue(null)
            this.bookingForm.controls.PaymentType.clearValidators();
            this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
          }else{
            this.bookingForm.controls.PaymentType.setValue(0)
            this.bookingForm.controls.PaymentType.clearValidators();
            this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
          }
          this.isNewEmail=false
    this.showSendingInvoice=false
          this.userDetail.AddressShow = this.newUserAddressShow
          this.bookingForm.controls.Email.setValue(this.rootUser.Email)
          this.bookingForm.controls.Name.setValue(this.rootUser.Name)
          
          this.StripeEmail=this.rootUser.Email
          this.closeUserModal();
          this.resetUserForm();
          if(saveDetail==true){
            this.userDetailShow={...this.userDetail}
          }else{
            this.userDetailShow={...this.userDetailShow}
          } 
        
  
        },
        error => {
          this.isUserLoading = false;
          if (error.status === 300) {
            this.userForm.controls.Email.setErrors({
              'alreadyExist': true
            })
            this.userEmailMessage = error.headers.get("message");
          }
        }
      )
    }else{

      if(this.userForm.controls.UserId.value){
        this.rootUser = {
          ...this.userForm.value,
          self: true,
          tempId: moment().toDate().getTime(),
          isUpdated:1
        };
      }else{
        this.rootUser = {
          ...this.userForm.value,
          self: true,
          tempId: moment().toDate().getTime(),
          UserId: -1
        };
      }
      this.userDetail = { ...this.rootUser }
     
      this.AddressShow = this.newUserAddressShow
      this.DistanceShow = this.newUserDistanceShow
      this.userDetail.AddressShow = this.AddressShow
      this.bookingForm.controls.Email.setValue(this.rootUser.Email)
      this.bookingForm.controls.Name.setValue(this.rootUser.Name)
      this.bookingForm.controls.HouseNumber.setValue(this.rootUser.HouseNumber)
      this.bookingForm.controls.Distance.setValue(this.rootUser.Distance)
      this.bookingForm.controls.Zip.setValue(this.rootUser.Zip)
      this.bookingForm.controls.Elevator.setValue(this.rootUser.Elevator)
      this.bookingForm.controls.FullAddress.setValue(this.rootUser.FullAddress)
      this.bookingForm.controls.UserId.setValue(-1)
      this.StripeEmail=this.rootUser.Email
      this.isUserLoading=false
      if(!this.bookingForm.controls.OrganisationLocationId.value){
       
      this.bookingForm.controls.PaymentType.setValue(null)
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      }else{
        this.bookingForm.controls.PaymentType.setValue(0)
        this.bookingForm.controls.PaymentType.clearValidators();
        this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      }
      this.isNewEmail=false
    this.showSendingInvoice=false
    if(saveDetail==true){
      this.userDetailShow={...this.userDetail}
    }else{
      this.userDetailShow={...this.userDetailShow}
    } 
      this.closeUserModal();
      this.resetUserForm();
      this.getReachOutTime()
    }
    
    
    
    }
  }
    
  }
  closeUserModal() {
    this.visibleUserForm = false;
    // this.resetUserForm();
  }
  continueAddress() {
    this.serviceModalVisible = false;
    this.closeUserModal();
    // if (!this.bookingEditMode) {
    //   this.userGuest.push(this.rootUser);
    //   this.closeUserModal();
    //   let category = this.categoryData[this.categoryIndex];
    //   let product = category.Products[this.catProductIndex];
    //   this.selectGuest(category.CategoryId, product.ProductId, this.rootUser);
    // } else {
    //   this.sendPushInUpdate = true;
    //   this.bookingAddress = this.addressForm.controls.Street.value;
    //   this.bookingAddEditMode = false;
    //   this.editBookingDetail.Floor = null; //this.addressForm.controls.Floor.value;
    //   this.editBookingDetail.Street = this.addressForm.controls.Street.value;
    //   this.editBookingDetail.City = null; //this.addressForm.controls.City.value;
    //   this.editBookingDetail.Zip = this.addressForm.controls.Zip.value;
    // }
  }
  addProductControls() {
    let productArray = this.bookingForm.get('Products') as FormArray;
    let organisationSelected=[]
    if(this.bookingForm.controls.OrganisationLocationId.value){
      organisationSelected=[this.bookingForm.controls.OrganisationLocationId.value]
    }
    this.selectedTreatments.push({ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, "isStaffAvailable": null, "isSkillPresent": null,timeSlots:this.timeSlotFinal, groups: [], skills: [], searchValue: '', isWorking: '1', staffData: [],OrganisationLocationId:organisationSelected})
        
    if (productArray.length > 0) {
      let lastIndex = productArray.length - 1;
      let prodControls = productArray.controls
      let startTime = `${prodControls[lastIndex].get("StartTime").value}`
      let duration = prodControls[lastIndex].get("Duration").value
      let nextStartTime = null
      if (startTime && duration) {
        startTime = startTime + ":00";
        // let duration = moment(e.source.data.EndTime, "HH:mm:ss").diff(moment(e.source.data.StartTime, "HH:mm:ss"), "minutes");
        nextStartTime = moment(startTime, "HH:mm:ss").add(duration, "minutes").format("HH:mm");
        console.log(nextStartTime)
      }

      if (nextStartTime) {
        productArray.push(this.pushProductControls(null, nextStartTime));
      } else {
        productArray.push(this.pushProductControls());
      }
    } else {
      productArray.push(this.pushProductControls());
    }
    
    
    console.log(this.selectedTreatments)
    
    
    let elementTop = document.getElementById("prodContainerTop");
       
    elementTop.scroll({
      behavior: "smooth",
      top: 10000
    })
   
    this.subscribeChanges();
    this.setHeightSidePanel();

    


  }

  setHeightSidePanel()
  {
    setTimeout(() => {
      let elementLeft = document.getElementById("main-left-content");
      let elementSide = document.getElementById("main-side-content");
      let elementSideinner = document.getElementById("booking-history-main");
      if(elementSideinner!=null){
      let elementSideinnerHeight=elementSideinner.offsetHeight;
      let diffHeight=elementLeft.clientHeight-elementSide.clientHeight;
      diffHeight=diffHeight+elementSideinnerHeight-20;
      let newdiffHeight=diffHeight+"px";
      document.getElementById("booking-history-main").style.height = newdiffHeight; 
      }
    }, 100);
  }

  pushProductControls(obj = null,nextStartTime=null) {
    console.log("called")
    console.log(obj)
    if (!obj) {
      return this.fb.group({
        ProductId: [null,[Validators.required]],
        Name: [null,[Validators.required]],
        StartTime: [nextStartTime, [Validators.required]],
        Duration: [null, [Validators.required]],
        StaffId: [null, [Validators.required]],
        StaffName: [null, [Validators.required]],
        AddOns: [null],
        Amount:  [0,[Validators.required]],
        AvailableStaff:[null],
        CategoryId:[null],
        TotalAmount:[0],
        GoogleEmail:[null, [Validators.required]],
        PreparationTime:[null],
        BookingProductId:[null],
        Skills:[Object],
        DiscountedAmount:[0],
        Discount:[0],
        Guest:[]
      })
    } else {
      let group= this.fb.group({
        ProductId: [obj.ProductId],
        Name: [obj.Name],
        StartTime: [obj.StartTime, [Validators.required]],
        Duration: [obj.Duration, [Validators.required]],
        StaffId: [obj.StaffId, [Validators.required]],
        StaffName: [obj.StaffName, [Validators.required]],
        AddOns: [obj.AddOns],
        Amount: [obj.Amount,[Validators.required]],
        AvailableStaff:[null],
        CategoryId:[obj.CategoryId],
        TotalAmount:[0],
        GoogleEmail:[obj.GoogleEmail, [Validators.required]],
        PreparationTime:[obj.PreparationTime, [Validators.required]],
        BookingProductId:[obj.BookingProductId],
        Skills:[obj.Skills],
        DiscountedAmount:[obj.DiscountedAmount],
        Discount:[obj.Discount],
        Guest:[obj.Guest]
      })
      return group
    }
  }
  saveBookingData(confirmInvalidAddressBooking = null) {
    this.submitted = true;
    if (!this.isInvalidForBooking()) {
      this.checkAddress();
      if (!this.isAddressValid && !this.confirmAddressAlert && !this.bookingForm.get('OrganisationLocationId').value) {
        this.noAddressAlert = true;
        return;
      } 
      if((this.showSkillAvailableAlert || this.showNotAvailableAlert) && !this.confirmAvailableAlert){
        this.showAvailablitySkillAlert = true;
        return;
      }
      
     
       
          // Form is valid move ahead
          let obj = { ...this.bookingForm.value };
          console.log(obj)
          if((!this.isPromoApplied )&&  obj.PromoCode){
            this.showNotAppliedPromoAlert = true;
            return;
          }
          if(!this.isPromoActive && this.isPromoApplied &&  obj.PromoCode!=null){
            this.showInvalidPromoAlert = true;
            return;
          }
          obj.InvoiceEmail=this.StripeEmail
          let duration=0
          obj.Products.forEach((element, index) => {
            if(element.StaffId && element.GoogleEmail){
              obj.Products[index]['AvailableStaff'] = [{ "StaffId": element.StaffId, "GoogleEmail": element.GoogleEmail }]
              obj.Products[index]['Therapist'] = 1
              obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT;
            }else{
              obj.Products[index]['AvailableStaff']=[]
              obj.Products[index]['Therapist'] = 1
              obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
            }
            duration+=element.Duration
            let StartDate = moment(obj.DateTime).format("YYYY-MM-DD")
            let StartTime = element.StartTime //moment(element.StartTime).format("HH:mm")
            obj.Products[index]['StartTime'] = momentz.tz(StartDate + ' ' + StartTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).utc().format("YYYY-MM-DDTHH:mm:ss");
            let Addons = [];
            if (element.AddOns) {
              element.AddOns.forEach(addon => {
                let foundAddOn = this.selectedTreatments[index].selectedTreatmentDetail.AddOns.find(add => add.AddOnId === addon)
                if (foundAddOn) {
                  duration+=foundAddOn.Duration
                  Addons.push(foundAddOn)
                }
              });
            }
            obj.Products[index].AddOns = Addons
           

          });
          // obj.DateTime = moment(obj.DateTime).utc().format(),
          obj.DateTime = momentz.tz(obj.DateTime,environment.STAFF_ZONE).utc().format(),
          this.isFormSpinning = true;
          // obj.Street=this.AddressObject.StreetName
          // obj.City=this.AddressObject.City
          // obj.Distance=this.AddressObject.Distance
          // obj.PaidPrice = obj.Amount
          obj.ReachOutTime = this.reachOutTime
          obj.Elevator = (obj.Elevator  && obj.Elevator!="0") ? 1 : 0
          let Userdata={}
          if(Object.keys(this.rootUser).length!=0){
            if(obj.UserId==null && Object.keys(this.rootUser).length==0){
              // this is an organisation booking with no user selected
            }else{
              if (obj.UserId == null || obj.UserId == -1) {
                obj.Name = this.rootUser.Name,
                  obj.Email = this.rootUser.Email
                  obj.UserId =null
                  Userdata={
                    Name : this.rootUser.Name,
                  Email: this.rootUser.Email,
                  Contact : this.rootUser.Contact,
                  Gender:this.rootUser.Gender,
                  Street : this.rootUser.Street,
                  Floor :this.rootUser.Floor,
                  City :this.rootUser.City,
                  Zip :this.rootUser.Zip,
                  HouseNumber :this.rootUser.HouseNumber,
                  Distance: this.rootUser.Distance,
                  Elevator : this.rootUser.Elevator ? 1 : 0,
                  Therapist : this.rootUser.Therapist,
                  Notes : this.rootUser.Notes,
                  DOB : this.rootUser.DOB,
                  PreferredLanguage : this.rootUser.PreferredLanguage,
                  ClientSource : this.rootUser.ClientSource,
                  ReachOutTime : this.reachOutTime,
                ForceStaffAllot:false,
                FullAddress : this.rootUser.FullAddress,
                
                  }
                  
              }else{
                
                if(this.rootUser.isUpdated){
                  obj.userUpdated =1
                  Userdata={
                    Name : this.rootUser.Name,
                  Email: this.rootUser.Email,
                  Contact : this.rootUser.Contact,
                  Gender:this.rootUser.Gender,
                  Street : this.rootUser.Street,
                  Floor :this.rootUser.Floor,
                  City :this.rootUser.City,
                  Zip :this.rootUser.Zip,
                  HouseNumber :this.rootUser.HouseNumber,
                  Distance: this.rootUser.Distance,
                  Elevator : this.rootUser.Elevator ? 1 : 0,
                  Therapist : this.rootUser.Therapist,
                  Notes : this.rootUser.Notes,
                  DOB : this.rootUser.DOB,
                  PreferredLanguage : this.rootUser.PreferredLanguage,
                  ClientSource : this.rootUser.ClientSource,
                  ReachOutTime : this.reachOutTime,
                ForceStaffAllot:false,
                FullAddress : this.rootUser.FullAddress,
                
                  }
                }
              }
            }
          }
          
          
          obj.Userdata=Userdata
          obj.OnlyCopy=false
          if(obj.PaymentType==0){
            obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
          }else if(obj.PaymentType==2){
            obj.OnlyCopy = true
            this.OnlyCopy = true
          }
          if(this.bookingForm.get('OrganisationLocationId').value){
            obj.HouseNumber=null;
            obj.ReachOutTime=null;
            obj.Zip=null;
            obj.Elevator=null;
          }


          obj.saveUserDetailRecord=this.saveUserDetailRecord
          console.log(obj)
          // return
          this.webapi.request(API.SAVE_BOOKING_CMS, obj)
            .subscribe(
              data => {
                let stateObj:any={}
                var msg = data.headers.get('message');
                let invoiceMsg=this.InvoiceCopied
               stateObj.selectedDate=this.sendSelectedDate
               stateObj.startTime=obj.StartTime
               stateObj.duration=duration
               stateObj.selectedDate=this.sendSelectedDate
               stateObj.toast={
                title: "Success",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              }
              if(data.body.Data.Invoice){
                let invoiceUrl=data.body.Data.Invoice.hosted_invoice_url;
                stateObj.invoiceUrl=invoiceUrl
                stateObj.selectedDate=this.sendSelectedDate
                stateObj.toast={
                  title: "Success",
                  msg:invoiceMsg,
                  theme: 'bootstrap',
                  timeout: 3000
                }
              }
                this.newBooking = false;
                this.isFormSpinning = false;

                // this.getStaffList();
                // this.getMetadata();
                // this.resetNewBookingForm()
                this.confirmAddressAlert=false
                this.confirmAvailableAlert=false;
                console.log("stateObj",stateObj)
                console.log("this.sendSelectedDate",this.sendSelectedDate)
                this.router.navigate([this.navigateTo], {
                  state: stateObj
                }).then(value=>{
                  
                  return;
                })
                
              },
              error => {
                this.isFormSpinning = false;
                var msg = error.headers.get('message');
                if (error.status == 424) {
                  this.router.navigate([this.navigateTo], {
                    state: {
                     selectedDate:this.sendSelectedDate,
                      toast: {
                        title: "Warning",
                        msg,
                        theme: 'bootstrap',
                        timeout: 3000
                      }
                    }
                  }).then(value => {

                    return;
                  })

                } else {

                  this.toast.error({
                    title: "Error",
                    msg,
                    theme: 'bootstrap',
                    timeout: 3000
                  })
                }

              }
            )
        

      


    } else {
      // Form not valid check for empty fields
      Object.values(this.bookingForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }else{
          control.markAsPristine({ onlySelf: true });
        }
      });
      let productArray = this.bookingForm.get('Products') as FormArray;
      Object.values(productArray.controls).forEach(tempControl => {
        let formGroup = tempControl as FormGroup
        Object.values(formGroup.controls).forEach(treatmentControl => {
          if (treatmentControl.invalid) {
            treatmentControl.markAsDirty();
            treatmentControl.updateValueAndValidity({ onlySelf: true });
          }
        });
      });
    }


  }
  confirmProceedBooking(){
    this.saveBookingData(true)
  }
  confirmAvailableProceedBooking(){
    this.saveBookingData(true)
  }
  checkAddress() {
    let zip=this.bookingForm.get('Zip').value
    let street=this.bookingForm.get('Street').value
    let distance=this.bookingForm.get('Distance').value
    let housenumber=this.bookingForm.get('HouseNumber').value
    let city=this.bookingForm.get('City').value
    let latitude=this.bookingForm.get('Latitude').value
    let longitude=this.bookingForm.get('Longitude').value
    if(zip && housenumber && city){
      this.isAddressValid=true
    }else{
      this.isAddressValid=false
    }
  }
  checkUserAddress() {
    let zip=this.userForm.get('Zip').value
    let street=this.userForm.get('Street').value
    let distance=this.userForm.get('Distance').value
    let housenumber=this.userForm.get('HouseNumber').value
    let city=this.userForm.get('City').value
    // let latitude=this.bookingForm.get('Latitude').value
    // let longitude=this.bookingForm.get('Longitude').value
    if(zip && street && distance && housenumber && city){
      this.isUserAddressValid=true
    }else{
      this.isUserAddressValid=false
    }
  }
  checkAvailability(index) {
    // if (typeof product !== 'undefined') {
    //   delete product.selStaffAvailable;
    // }
    console.log()
    this.selectedTreatments[index].isStaffAvailable = null
    let selectedDate = this.bookingForm.controls.DateTime.value;
    let organisationlocationId=this.bookingForm.controls.OrganisationLocationId.value;
    // In case if booking date is not selected dont call the API 
    if (!selectedDate) {
      return;
    }
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls

      let StartDate= moment(selectedDate).format("YYYY-MM-DD")
      console.log("StartDate : ", StartDate);
      // let StartTime= moment(prodControls[index].get('StartTime').value).format("HH:mm")
      let StartTime= `${prodControls[index].get('StartTime').value}`
      let StaffId= prodControls[index].get('StaffId').value
      let Duration= prodControls[index].get('Duration').value
      let PreparationTime= prodControls[index].get('PreparationTime').value
     

      if(StartDate && StartTime && StaffId != null && Duration && PreparationTime != null){


     
      let AddOn= prodControls[index].get('AddOns').value
      if(AddOn){
        AddOn.forEach(ad => {
          let adFound= this.selectedTreatments[index].selectedTreatmentDetail.AddOns.find(addon => addon.AddOnId === ad)
          if(adFound){
            Duration +=adFound.Duration
          }
        });
        
      }
      
      let checkObj = {
        StaffId: StaffId,
        StartTime: null,
        Duration: Duration,
        ReachOutTime:this.reachOutTime,
        OrganisationLocationId:organisationlocationId,
        PreparationTime:PreparationTime
      }
      checkObj.Duration=Duration

      checkObj.StartTime=momentz.tz(StartDate + " " + StartTime, "YYYY-MM-DD HH:mm", environment.STAFF_ZONE);
      console.log(checkObj)
      console.log(StartDate)
      console.log(StartTime)
      console.log(StaffId)
      console.log(Duration)
      console.log(PreparationTime)
      // checkObj.StartTime = momentz.tz(StartDate + " " + StartTime, "ddd DD/MM/YY HH:mm", environment.STAFF_ZONE);
      // if (product.TreatmentNum > 0) {
      //   if (!product.SameTime) {
      //     checkObj.StartTime.add(this.finalBasket[0].TotalDuration, "minute");
      //   } else {
      //     if (this.finalBasket[0].selectedStaffId === staffId) {
      //       product.selStaffAvailable = false;
      //       return;
      //     }
      //   }
      // }
      let reachOutTime=this.reachOutTime 
      if(this.bookingForm.controls.OrganisationLocationId.value){
        reachOutTime = this.orgReachOutTime;
      }else{
        reachOutTime = this.reachOutTime;
      }
      
      let reminder = reachOutTime % 5;
      if (reminder > 0) {
        let toAdd = 5 - reminder;
        reachOutTime += toAdd;
      }
      console.log("reachOutTime"+reachOutTime)
      // checkObj.StartTime.subtract(PreparationTime+this.reachOutTime, "minute")
      console.log(checkObj)
      checkObj.StartTime = checkObj.StartTime.utc().format();
      console.log(checkObj)
      // checkObj.Duration = Duration+ reachOutTime+ PreparationTime + reachOutTime;
      checkObj.Duration = Duration
      console.log(checkObj)
      this.isStaffChecking = true;
      console.log(checkObj)
      checkObj.ReachOutTime=this.reachOutTime+PreparationTime
      this.webapi.request(API.CHECK_STAFF_AVAILABILITY, checkObj)
        .subscribe(
          data => {
            this.isStaffChecking = false;
            const isAvailable = { ...data.body.Data };
            console.log("isAvailable")
            console.log(isAvailable)
            this.selectedTreatments[index].isStaffAvailable = isAvailable.IsAvailable
            // product.selStaffAvailable = isAvailable.IsAvailable;
            // let existProduct = this.finalBasket.find(f => f.TreatmentNum === product.TreatmentNum);
            // let staffExist = product.Staff.find(f => f.StaffId === staffId);
            // existProduct.AvailableStaff.unshift(staffExist);
            if(!isAvailable.IsAvailable){
              this.showNotAvailableAlert=true
            }else{
              this.showNotAvailableAlert=false
            }
          },
          error => {
            this.isStaffChecking = false;
            // this.toast.error({
            //   title: "Error",
            //   msg: error.headers.get('message'),
            //   timeout: 3000,
            //   theme: "bootstrap"
            // })
          }
        )
    }

  }

  checkStaffSkill(index) {


    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls

    let StaffId = prodControls[index].get('StaffId').value

    let ProductId = prodControls[index].get('ProductId').value
    if (StaffId != null && ProductId != null) {
      let foundStaff = this.filterStaffList.find(staff => staff.StaffId === StaffId)
      if (foundStaff) {
        let foundSkill = foundStaff.Skills.find(skill => skill === ProductId)
        if (foundSkill) {
          this.selectedTreatments[index].isSkillPresent = true;
          this.showSkillAvailableAlert=false
        } else {
          this.selectedTreatments[index].isSkillPresent = false;
          this.showSkillAvailableAlert=true
        }
      }
    }


  }

  // get productdetails(){
  //   // let productArray = this.bookingForm.get('Products') as FormArray;
  //   // console.log(productArray)
  //   console.log(product.controls.StartTime.value)
  //   return product.controls.StartTime.value
  // }
  editBookingOld(bookingId) {
    this.isFormSpinning = true;
    
      
    this.webapi.request(API.BOOKING_DETAIL, {
      BookingId: bookingId,

    })
      .subscribe(
        data => {
          if (data.body.Data && data.body.Data.length) {
            this.editBookingDetail = { ...data.body.Data[0] }
            let bookingData = { ...data.body.Data[0] }
            this.editDraftMode = (bookingData.Status == 9) ? true : false
            this.editBookingMode = true
            console.log(bookingData)
            this.tagcolor = bookingData.PaymentStatusColor;
            console.log(this.tagcolor)
            // this.bookingForm.patchValue(bookingData)
            this.bookingForm.controls.UserId.setValue(bookingData.UserId)
            this.bookingForm.controls.BookingId.setValue(bookingData.BookingId)
            this.bookingForm.controls.Name.setValue(bookingData.UserName)
            this.bookingForm.controls.Email.setValue(bookingData.UserEmail)
            this.bookingForm.controls.DateTime.setValue(momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).format("YYYY-MM-DD"))
            this.bookingForm.controls.Amount.setValue(bookingData.Amount)
            this.bookingForm.controls.PaidPrice.setValue(bookingData.PaidPrice)
            this.bookingForm.controls.PaymentStatusName.setValue(bookingData.PaymentStatusName)
            this.bookingForm.controls.ReachOutTime.setValue(bookingData.ReachOutTime)
            this.bookingForm.controls.Zip.setValue(bookingData.Zip,{ emitEvent: false })
            this.bookingForm.controls.HouseNumber.setValue(bookingData.HouseNumber,{ emitEvent: false })
            this.bookingForm.controls.City.setValue(bookingData.City,{ emitEvent: false })
            this.bookingForm.controls.Street.setValue(bookingData.Street,{ emitEvent: false })
            this.bookingForm.controls.Elevator.setValue(bookingData.Elevator)
            this.bookingForm.controls.Distance.setValue(bookingData.Distance,{ emitEvent: false })
            this.bookingForm.controls.TravelFee.setValue(bookingData.TravelFee)
            this.bookingForm.controls.BookingChannelId.setValue(bookingData.BookingChannelId)
            this.bookingForm.controls.AdminNotes.setValue(bookingData.AdminNotes)
            this.bookingForm.controls.PaymentType.setValue(bookingData.PaymentType)
            this.bookingForm.controls.PaymentStatus.setValue(bookingData.PaymentStatus)
            this.bookingForm.controls.PromoAmount.setValue(bookingData.PromoAmount)
            this.bookingForm.controls.PromoCode.setValue(bookingData.PromoCode)
            this.bookingForm.controls.PromoCodeId.setValue(bookingData.PromoCodeId)
            this.bookingForm.controls.Status.setValue(bookingData.Status)
            this.discount=bookingData.PromoAmount
            if(bookingData.PromoAmount){
              this.isPromoApplied=true;
              this.isPromoActive=true;
              this.PromoDetail=bookingData.PromoDetail
            }
            this.AddressShow=((bookingData.Street)?bookingData.Street+' ':'')+((bookingData.HouseNumber)?bookingData.HouseNumber+',':"")+((bookingData.Zip)?bookingData.Zip:'')+" "+((bookingData.City)?bookingData.City:'')
            this.DistanceShow=bookingData.Distance
            this.checkAddress()
            let productArray = this.bookingForm.get('Products') as FormArray;
            // this.resetScheduleForm();
            this.selectedTreatments = []
            let specialrequest=[]
            if(bookingData.SpecialRequest){
              bookingData.SpecialRequest.forEach(element => {
                specialrequest.push(element.SpecialRequestId)
              });
            }
            
            this.bookingForm.controls.SpecialRequest.setValue(specialrequest)
            this.StripeEmail=(bookingData.InvoiceEmail)?bookingData.InvoiceEmail:bookingData.UserEmail
            this.isNewEmail=false;
            if(bookingData.PaymentType){
              this.showSendingInvoice=true;
            }
            if(bookingData.Products){
              bookingData.Products.forEach(element => {
                if(element.ProductId){
                  let obj = {
                    Duration: element.Duration,
                    StartTime: momentz.tz(element.StartTime, environment.STAFF_ZONE).format("HH:mm"),
                    StaffId: element.StaffId,
                    StaffName: element.StaffName,
                    GoogleEmail: element.GoogleEmail,
                    ProductId: element.ProductId,
                    Name: element.Product,
                    CategoryId: element.CategoryId,
                    Amount: element.Amount,
                    AddOns: [],
                    PreparationTime: element.PreparationTime,
                    BookingProductId: element.BookingProductId,
                    Skills: element.Skills,
                    DiscountedAmount: element.DiscountedAmount,
                    Discount: element.Discount
    
                  };
                  console.log(obj)
                  var foundProduct = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === element.ProductId)
                  foundProduct.Text= foundProduct.Category.charAt(0).toUpperCase();
                  let AddOns = []
                  element.AddOns.forEach(element => {
                    AddOns.push(element.AddOnId)
                  });
                  obj.AddOns = AddOns
                  let timeSlots=this.timeSlotFinal;
                  let foundSlot=timeSlots.findIndex(f => f.time === obj.StartTime);
                  if(foundSlot){
                    timeSlots[foundSlot].disabled=false;
                  }
                  
                  this.selectedTreatments.push({ "selectedTreatmentDetail": foundProduct, "showFilterPopSingle": false, isStaffAvailable: null, "isSkillPresent": null,timeSlots:timeSlots })
                  productArray.push(this.pushProductControls(obj));
                }
                
              })
            }
            console.log(productArray)
            if (productArray.length == 0) {
              productArray.push(this.pushProductControls());
              this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:null,"isSkillPresent":null,timeSlots:this.timeSlotFinal}];
        
        
            }
            
            if(bookingData.UserId){
              this.getUserDetail(bookingData.UserId,true);
            }
            this.updateUserArray(bookingData.UserId, true)
            this.calculateTotalAmounts(bookingData);
            this.setPromoCodeDataOnEdit(bookingData)
            // this.verifyPromoAmount(true);
            console.log(this.selectedTreatments)
            this.subscribeChanges();
            // console.log(this.selectedSchedule)
            this.selectedDate=momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).toDate()
            this.staffFilterArray.selectedDate=moment(this.selectedDate).format("MM/DD/YYYY")
            this.newBooking = true
            this.isFormSpinning = false;
          }
        },
        error => {

          this.isFormSpinning = false;
          const msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )



  }
  editBooking(bookingId) {
    this.isFormSpinning = true;
    this.isTreatmentLoading = true;
    
    this.webapi.request(API.BOOKING_DETAIL, {
      BookingId: bookingId,

    })
      .subscribe(
        data => {
          if (data.body.Data && data.body.Data.length) {
            this.editBookingDetail = { ...data.body.Data[0] }
            let bookingData = { ...data.body.Data[0] }
            this.editDraftMode = (bookingData.Status == 9) ? true : false
            this.editBookingMode = true
            console.log(bookingData)
            this.tagcolor = bookingData.PaymentStatusColor;
            console.log(this.tagcolor)

            this.isFormSpinning = false;
            this.isManualAddressEdit=true


            this.selectedDate = momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).toDate()
            this.staffFilterArray.selectedDate = moment(this.selectedDate).format("MM/DD/YYYY")

            this.bookingForm.controls.BookingId.setValue(bookingData.BookingId)
            this.bookingForm.controls.BookedBy.setValue(bookingData.BookedBy)
            this.bookingForm.controls.FullAddress.setValue(bookingData.FullAddress)
            this.bookingForm.controls.DateTime.setValue(momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).format("YYYY-MM-DD"))
            this.bookingForm.controls.Amount.setValue(bookingData.Amount)
            this.bookingForm.controls.PaidPrice.setValue(bookingData.PaidPrice)
            this.bookingForm.controls.PaymentStatusName.setValue(bookingData.PaymentStatusName)
            this.bookingForm.controls.ReachOutTime.setValue(bookingData.ReachOutTime)
            this.bookingForm.controls.Zip.setValue(bookingData.Zip, { emitEvent: false })
            this.bookingForm.controls.HouseNumber.setValue(bookingData.HouseNumber, { emitEvent: false })
            this.bookingForm.controls.City.setValue(bookingData.City, { emitEvent: false })
            this.bookingForm.controls.Street.setValue(bookingData.Street, { emitEvent: false })
            this.bookingForm.controls.Elevator.setValue(bookingData.Elevator)
            this.bookingForm.controls.Distance.setValue(bookingData.Distance, { emitEvent: false })
            this.bookingForm.controls.TravelFee.setValue(bookingData.TravelFee)
            
            this.bookingForm.controls.AdminNotes.setValue(bookingData.AdminNotes)
            this.bookingForm.controls.PaymentType.setValue(bookingData.PaymentType)
            this.bookingForm.controls.PaymentStatus.setValue(bookingData.PaymentStatus)
            this.bookingForm.controls.PromoAmount.setValue(bookingData.PromoAmount)
            this.bookingForm.controls.PromoCode.setValue(bookingData.PromoCode)
            this.bookingForm.controls.PromoCodeId.setValue(bookingData.PromoCodeId)
            this.bookingForm.controls.Status.setValue(bookingData.Status)
            this.sendSelectedDate= momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).format("YYYY-MM-DD")
            this.discount = bookingData.PromoAmount
            //fetch user data in background and set data
            this.calendarService.getUserList().then(results => {

              this.appUserListAll = this.calendarService.appUserList
              this.appUserList = []
              this.sortUserList()
              this.bookingForm.controls.UserId.setValue(bookingData.UserId, { emitEvent: false })

              this.bookingForm.controls.Name.setValue(bookingData.UserName)
              this.bookingForm.controls.Email.setValue(bookingData.UserEmail)
              if(bookingData.UserId){
                this.appUserList = this.appUserListAll.filter(option =>
                  option.UserId==bookingData.UserId
                );
              }
              
              
              this.updateUserArray(bookingData.UserId, true)
              this.updatePaymentTypeOptions() 
            });

            //fetch metadata API data in background and set data
            this.calendarService.getMetadata().then(results => {
              this.metadata = this.calendarService.metadata
              if (this.metadata.StaffCalView) {
                this.staffViewList = this.metadata.StaffCalView;
              }
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
                this.sortSpecialRequest();
              }
              if (this.metadata.BookingChannelData) {
                this.BookingChannelData = this.metadata.BookingChannelData;
              }

              let specialrequest = []
              if (bookingData.SpecialRequest) {
                bookingData.SpecialRequest.forEach(element => {
                  specialrequest.push(element.SpecialRequestId)
                });
              }

              this.bookingForm.controls.SpecialRequest.setValue(specialrequest)
              this.bookingForm.controls.BookingChannelId.setValue(bookingData.BookingChannelId)

            });
            this.calendarService.getOrganisationList().then(results => {

              let organisationList = this.calendarService.organisationList
              this.organisationList = [...organisationList]
              this.organisationList.forEach(org => {
                org.selected = false;
              });
              this.sortOrganisationList()
              console.log(this.organisationList)
              this.bookingForm.controls.OrganisationLocationId.setValue(bookingData.OrganisationLocationId, { emitEvent: false })
              this.orgReachOutTime=bookingData.OrgReachouttime
              this.updatePaymentTypeOptions()
              
            });
            // this.AddressShow = ((bookingData.Street) ? bookingData.Street : '') + " " + bookingData.HouseNumber + ", " + ((bookingData.City) ? bookingData.City : '') + " " + bookingData.Zip
            this.AddressShow = bookingData.FullAddress
            this.DistanceShow = bookingData.Distance
            this.checkAddress()
            this.getDistance()

            if (bookingData.PromoAmount) {
              this.isPromoApplied = true;
              this.isPromoActive = true;
              this.PromoDetail = bookingData.PromoDetail
            }

           
            this.StripeEmail = (bookingData.InvoiceEmail) ? bookingData.InvoiceEmail : bookingData.UserEmail
            this.isNewEmail = false;
            if (bookingData.PaymentType==1) {
              this.showSendingInvoice = true;
            }

            let productArray = this.bookingForm.get('Products') as FormArray;

            this.selectedTreatments = []
            //fetch treament metadata in background and set products
            Promise.all(
              [this.calendarService.getStaffFilterList(moment(this.selectedDate).format("MM/DD/YYYY")), this.calendarService.getTreatments(), this.calendarService.getTimeSlots()])
              .then(results => {
                this.isTreatmentLoading = false
                this.filterStaffList = this.calendarService.filterStaffList
                this.filterStaffList2 = this.calendarService.filterStaffList
                this.autoCompleteStaffList = this.filterStaffList;
                this.treatmentDetail = this.calendarService.treatmentDetail
                this.setTreatments(bookingData.OrganisationLocationId)
                // this.timeSlots = this.calendarService.timeSlots
                // this.setTimeSlot(this.timeSlots);
                //set metadata
                
                if (this.calendarService.TimeSlotInterval) {
                  this.TimeSlotInterval = this.calendarService.TimeSlotInterval;
                } else {
                  this.TimeSlotInterval = 5;
                }
                this.timeSlots=this.calendarService.timeSlots
                this.setTimeSlot(this.timeSlots)
                // if(!this.editBooking){
                //   this.selectedTreatments[0].timeSlots=this.timeSlotFinal
                // }
               


                if (bookingData.Products) {
                  bookingData.Products.forEach(element => {
                    if (element.ProductId) {
                      let obj = {
                        Duration: element.Duration,
                        StartTime: momentz.tz(element.StartTime, environment.STAFF_ZONE).format("HH:mm"),
                        StaffId: element.StaffId,
                        StaffName: element.StaffName,
                        GoogleEmail: element.GoogleEmail,
                        ProductId: element.ProductId,
                        Name: element.Product,
                        CategoryId: element.CategoryId,
                        Amount: element.Amount,
                        AddOns: [],
                        PreparationTime: element.PreparationTime,
                        BookingProductId: element.BookingProductId,
                        Skills: element.Skills,
                        DiscountedAmount: element.DiscountedAmount,
                        Discount: element.Discount,
                        Guest:null

                      };
                      console.log(obj)
                      var foundProduct = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === element.ProductId)
                      if(foundProduct){
                        foundProduct.Text = foundProduct.Category.charAt(0).toUpperCase();
                      }else{
                        foundProduct.Text = '';
                      }
                      
                      let AddOns = []
                      element.AddOns.forEach(element => {
                        AddOns.push(element.AddOnId)
                      });
                      obj.AddOns = AddOns
                      let timeSlots = this.timeSlotFinal;
                      let foundSlot = timeSlots.findIndex(f => f.time === obj.StartTime);
                      if (foundSlot!=-1) {
                        timeSlots[foundSlot].disabled = false;
                      }
                      
                    if(element.Guest){
                      let guestFormControl=this.pushGuestFormData(element.Guest)
                      obj.Guest=guestFormControl.value
                    }
                    
                      if(foundProduct){
                        this.selectedTreatments.push({ "selectedTreatmentDetail": foundProduct, "showFilterPopSingle": false,
                        isStaffAvailable: null, "isSkillPresent": null, timeSlots: timeSlots,staffData:cloneDeep(this.filterStaffList),
                       groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                       isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)})
                      }else{
                        this.selectedTreatments.push({ "selectedTreatmentDetail": [], "showFilterPopSingle": false,
                        isStaffAvailable: null, "isSkillPresent": null, timeSlots: timeSlots,staffData:cloneDeep(this.filterStaffList),
                       groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                       isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId) })
                      }
                      
                      productArray.push(this.pushProductControls(obj));
                    }
                    

                  })
                }
                console.log(productArray)
                if (productArray.length == 0) {
                  productArray.push(this.pushProductControls());
                  this.selectedTreatments =[{ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, 
                  isStaffAvailable: null, "isSkillPresent": null, timeSlots: this.timeSlotFinal,staffData:cloneDeep(this.filterStaffList),
                  groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                  isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)
                }];

                }
                this.calculateTotalAmounts(bookingData);
                this.setPromoCodeDataOnEdit(bookingData)
                this.subscribeChanges();

              });



            if (bookingData.UserId) {
              this.getUserDetail(bookingData.UserId, true);
              this.rootUser = {
                Name: bookingData.UserName,
                Email: bookingData.UserEmail,
                Contact: bookingData.Contact,
                Gender: bookingData.Contact,
                Street: bookingData.UserStreet,
                // Floor: [null],
                City: bookingData.UserCity,
                Zip: bookingData.UserZip,
                Elevator: bookingData.UserElevator,
                Therapist: bookingData.Therapist,
                PreferredLanguage: bookingData.PreferredLanguage,
                ClientSource:  bookingData.ClientSource,
                DOB:  bookingData.DOB,
                HouseNumber: bookingData.UserHouseNumber,
                Distance:  bookingData.UserDistance,
                Notes:  bookingData.Notes,
                ReachOutTime:  bookingData.UserReachOutTime,
                UserId: bookingData.UserId
              };
            }



            
            if(bookingData.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
              this.PaidAmount=bookingData.PaidPrice
            }else{
              if(bookingData.PreviousBooking){
                if(bookingData.PreviousBooking.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
                  this.PaidAmount=bookingData.PreviousBooking.PaidPrice
                }
              }
            }
           
            this.newBooking = true

          }
        },
        error => {

          this.isFormSpinning = false;
          const msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )



  }
  
  fillEditBooking(bookingDetail) {
    if (bookingDetail) {
      this.editBookingDetail = { ...bookingDetail}
      let bookingData = { ...bookingDetail }
      this.editDraftMode = (bookingData.Status == 9) ? true : false
      this.editBookingMode = true
      console.log(bookingData)
      this.tagcolor = bookingData.PaymentStatusColor;
      console.log(this.tagcolor)
      this.isManualAddressEdit=true
      // this.bookingForm.patchValue(bookingData)
      this.bookingForm.controls.UserId.setValue(bookingData.UserId,{ emitEvent: false })
      this.bookingForm.controls.BookingId.setValue(bookingData.BookingId)
      this.bookingForm.controls.Name.setValue(bookingData.UserName)
      this.bookingForm.controls.Email.setValue(bookingData.UserEmail)
      this.bookingForm.controls.DateTime.setValue(momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).format("YYYY-MM-DD"))
      this.bookingForm.controls.Amount.setValue(bookingData.Amount)
      this.bookingForm.controls.PaidPrice.setValue(bookingData.PaidPrice)
      this.bookingForm.controls.PaymentStatusName.setValue(bookingData.PaymentStatusName)
      this.bookingForm.controls.ReachOutTime.setValue(bookingData.ReachOutTime)
      this.bookingForm.controls.Zip.setValue(bookingData.Zip,{ emitEvent: false })
      this.bookingForm.controls.HouseNumber.setValue(bookingData.HouseNumber,{ emitEvent: false })
      this.bookingForm.controls.City.setValue(bookingData.City,{ emitEvent: false })
      this.bookingForm.controls.Street.setValue(bookingData.Street,{ emitEvent: false })
      this.bookingForm.controls.Elevator.setValue(bookingData.Elevator)
      this.bookingForm.controls.Distance.setValue(bookingData.Distance,{ emitEvent: false })
      this.bookingForm.controls.TravelFee.setValue(bookingData.TravelFee)
      this.bookingForm.controls.BookingChannelId.setValue(bookingData.BookingChannelId)
      this.bookingForm.controls.AdminNotes.setValue(bookingData.AdminNotes)
      this.bookingForm.controls.PaymentType.setValue(bookingData.PaymentType)
      this.bookingForm.controls.PaymentStatus.setValue(bookingData.PaymentStatus)
      this.bookingForm.controls.PromoAmount.setValue(bookingData.PromoAmount)
      this.bookingForm.controls.PromoCode.setValue(bookingData.PromoCode)
      this.bookingForm.controls.PromoCodeId.setValue(bookingData.PromoCodeId)
      this.bookingForm.controls.Status.setValue(bookingData.Status)
      this.bookingForm.controls.BookedBy.setValue(bookingData.BookedBy)
      this.bookingForm.controls.FullAddress.setValue(bookingData.FullAddress)
      this.bookingForm.controls.OrganisationLocationId.setValue(bookingData.OrganisationLocationId,{ emitEvent: false })
      this.setTreatments(bookingData.OrganisationLocationId)
      this.discount=bookingData.PromoAmount
      if(bookingData.PromoAmount){
        this.isPromoApplied=true;
        this.isPromoActive=true;
        this.PromoDetail=bookingData.PromoDetail
      }
      // this.AddressShow=((bookingData.Street)?bookingData.Street:'')+" "+bookingData.HouseNumber+", "+((bookingData.City)?bookingData.City:'')+" "+bookingData.Zip
      this.AddressShow=bookingData.FullAddress
      this.DistanceShow=bookingData.Distance
      this.checkAddress()
      let productArray = this.bookingForm.get('Products') as FormArray;
      // this.resetScheduleForm();
      this.selectedTreatments = []
      let specialrequest=[]
      if(bookingData.SpecialRequest){
        bookingData.SpecialRequest.forEach(element => {
          specialrequest.push(element.SpecialRequestId)
        });
      }
      
      this.bookingForm.controls.SpecialRequest.setValue(specialrequest)
      this.StripeEmail=(bookingData.InvoiceEmail)?bookingData.InvoiceEmail:bookingData.UserEmail
      this.isNewEmail=false;
      if(bookingData.PaymentType==1){
        this.showSendingInvoice=true;
      }
      if(bookingData.Products){
        bookingData.Products.forEach(element => {
          if(element.ProductId){
            let obj = {
              Duration: element.Duration,
              StartTime: momentz.tz(element.StartTime, environment.STAFF_ZONE).format("HH:mm"),
              StaffId: element.StaffId,
              StaffName: element.StaffName,
              GoogleEmail: element.GoogleEmail,
              ProductId: element.ProductId,
              Name: element.Product,
              CategoryId: element.CategoryId,
              Amount: element.Amount,
              AddOns: [],
              PreparationTime: element.PreparationTime,
              BookingProductId: element.BookingProductId,
              Skills: element.Skills,
              DiscountedAmount: element.DiscountedAmount,
              Discount: element.Discount,
              Guest:null

            };
            console.log(obj)
            var foundProduct = this.treatmentDetail.flatMap(cg => cg.Products).find(c => c.ProductId === element.ProductId)
            foundProduct.Text= foundProduct.Category.charAt(0).toUpperCase();
            let AddOns = []
            element.AddOns.forEach(element => {
              AddOns.push(element.AddOnId)
            });
            obj.AddOns = AddOns
            let timeSlots=this.timeSlotFinal;
                  let foundSlot=timeSlots.findIndex(f => f.time === obj.StartTime);
                  if(foundSlot!=-1){
                    timeSlots[foundSlot].disabled=false;
                  }

                  if(element.Guest){
                    let guestFormControl=this.pushGuestFormData(element.Guest)
                    obj.Guest=guestFormControl.value
                  }
                  if(foundProduct){
                    this.selectedTreatments.push({ "selectedTreatmentDetail": foundProduct, "showFilterPopSingle": false,
                    isStaffAvailable: null, "isSkillPresent": null, timeSlots: timeSlots,staffData:cloneDeep(this.filterStaffList),
                   groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                   isWorking:cloneDeep(this.staffFilterArray.isWorking) ,OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)})
                  }else{
                    this.selectedTreatments.push({ "selectedTreatmentDetail": [], "showFilterPopSingle": false,
                    isStaffAvailable: null, "isSkillPresent": null, timeSlots: timeSlots,staffData:cloneDeep(this.filterStaffList),
                   groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                   isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)})
                  }
          
            productArray.push(this.pushProductControls(obj));
          }
          
        })
      }
      console.log(productArray)
      if (productArray.length == 0) {
        productArray.push(this.pushProductControls());
        this.selectedTreatments=[{ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, 
        isStaffAvailable: null, "isSkillPresent": null, timeSlots: this.timeSlotFinal,staffData:cloneDeep(this.filterStaffList),
        groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
        isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)
      }];
  
  
      }
      this.appUserList = this.appUserListAll.filter(option =>
        option.UserId==bookingData.UserId
      );
      if(bookingData.UserId){
        this.getUserDetail(bookingData.UserId,true);
      }
      if(bookingData.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
        this.PaidAmount=bookingData.PaidPrice
      }else{
        if(bookingData.PreviousBooking){
          if(bookingData.PreviousBooking.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
            this.PaidAmount=bookingData.PreviousBooking.PaidPrice
          }
        }
      }
      this.updateUserArray(bookingData.UserId, true)
      this.calculateTotalAmounts(bookingData);
      this.setPromoCodeDataOnEdit(bookingData)
      // this.verifyPromoAmount(true);
      console.log(this.selectedTreatments)
      this.subscribeChanges();
      // console.log(this.selectedSchedule)
      this.selectedDate=momentz.tz(bookingData.DateTime, environment.STAFF_ZONE).toDate()
      this.staffFilterArray.selectedDate=moment(this.selectedDate).format("MM/DD/YYYY")
      this.newBooking = true
      this.isFormSpinning = false;
      this.updatePaymentTypeOptions()
    }


  }
 
  deleteProductControls(index: number): void {
    const product = this.bookingForm.get('Products') as FormArray;
    this.selectedTreatments.splice(index,1)
    product.removeAt(index);
    if (product.length == 0) {
      product.push(this.pushProductControls());
      // this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:null,"isSkillPresent":null,timeSlots:this.timeSlotFinal,staffData:[]}];
      this.selectedTreatments=[{ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, 
      isStaffAvailable: null, "isSkillPresent": null, timeSlots: this.timeSlotFinal,staffData:cloneDeep(this.filterStaffList),
      groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
      isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)
    }];


    }
    this.unSubscribeChanges()
    this.subscribeChanges();
    
    
    this.newBooking = true;
    this.calculateTotalPrice();
    this.verifyPromoAmount(true)
    console.log(this.selectedTreatments)
    // this.selectedTreatments[index] = { "selectedTreatmentDetail": {}, "showFilterPopSingle": false,isStaffAvailable:null,"isSkillPresent":null }
  }
  resetBookingFormData(){
    this.showResetConfirmationAlert = false
    const product = this.bookingForm.get('Products') as FormArray;
    // product.clear();
    this.bookingForm.reset({}, { emitEvent: false });
    this.userDetail=null
    this.userDetailShow=null
    this.AddressShow=null
    this.DistanceShow=null
    this.PromoDetail=null
    this.promocodeText=''
    this.isAddressValid=true
    this.isManualAddressEdit=false
    // product.controls.forEach((element,index) => {
    //   product.removeAt(index);
    // });
    while (product.length !== 0) {
      product.removeAt(0)
    }
    this.removePromoCode()
    // this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:null,"isSkillPresent":null,timeSlots:this.timeSlotFinal,staffData:[]}];
    this.selectedTreatments=[{ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, 
    isStaffAvailable: null, "isSkillPresent": null, timeSlots: this.timeSlotFinal,staffData:cloneDeep(this.filterStaffList),
    groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
    isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)
  }];
    
  }

  resetNewBookingForm(){
    this.resetBookingFormData()
     // Form not valid check for empty fields
   
    if(!this.editBookingMode){
      let status="PENDING"
      let statusValue=6

      // this.selectedTreatments=[{"selectedTreatmentDetail":{},"showFilterPopSingle":false,isStaffAvailable:null,"isSkillPresent":null,timeSlots:this.timeSlotFinal}];
      this.selectedTreatments=[{ "selectedTreatmentDetail": {}, "showFilterPopSingle": false, 
                  isStaffAvailable: null, "isSkillPresent": null, timeSlots: this.timeSlotFinal,staffData:cloneDeep(this.filterStaffList),
                  groups: cloneDeep(this.staffFilterArray.groups),skills:cloneDeep(this.staffFilterArray.skills),
                  isWorking:cloneDeep(this.staffFilterArray.isWorking),OrganisationLocationId: cloneDeep(this.staffFilterArray.OrganisationLocationId)
                }];
      this.bookingForm.controls.UserId.setValue(null,{ emitEvent: false })
      this.bookingForm.controls.Name.setValue(null,{ emitEvent: false })
      this.bookingForm.controls.Email.setValue(null,{ emitEvent: false })
      // this.bookingForm.controls.DateTime.setValue(null,{ emitEvent: false })
      this.bookingForm.controls.DateTime.setValue(momentz.tz(this.prevDateSelected, environment.STAFF_ZONE).format("YYYY-MM-DD"),{ emitEvent: false })
      this.bookingForm.controls.Amount.setValue(0)
      this.bookingForm.controls.PaidPrice.setValue(0)
      this.bookingForm.controls.TravelFee.setValue(0)
      this.bookingForm.controls.BookingChannelId.setValue(null)
      this.bookingForm.controls.PaymentType.setValue(0)
      this.bookingForm.controls.Elevator.setValue(0)
    this.bookingForm.controls.PaymentStatusName.setValue(status)
    this.bookingForm.controls.PaymentStatus.setValue(statusValue)
    let adminName= this.cookieService.get("adminName")
    this.bookingForm.controls.BookedBy.setValue(adminName)
      this.confirmAddressAlert=false;
      this.confirmAvailableAlert=false;
      this.addProductControls()
      this.unSubscribeChanges()
      this.subscribeChanges();
      Object.values(this.bookingForm.controls).forEach(control => {
        // control.markAsPristine();
        control.clearValidators();
          control.updateValueAndValidity({ onlySelf: true });
      });
      let productArray = this.bookingForm.get('Products') as FormArray;
      Object.values(productArray.controls).forEach(tempControl => {
        let formGroup = tempControl as FormGroup
        Object.values(formGroup.controls).forEach(treatmentControl => {
          // treatmentControl.markAsPristine();
          treatmentControl.clearValidators();
            treatmentControl.updateValueAndValidity({ onlySelf: true });
        });
      });
    }else{
      // this.editBooking(this.editBookingDetail)
      this.fillEditBooking(this.editBookingDetail)
    }
  }
  unSubscribeChanges(){
    this.durationSubs.unsubscribe();
    this.addOnSubs.unsubscribe();
    this.productSubs.unsubscribe();
    this.staffSubs.unsubscribe();
    this.startTimeSubs.unsubscribe();
    this.userIdSubs.unsubscribe();
    this.dateTimeSubs.unsubscribe();
    this.zipSubs.unsubscribe();
    this.houseNoSubs.unsubscribe();
  }
  resetConfirm() {
    if(this.bookingForm.pristine) {
      this.resetNewBookingForm()
      this.newBooking = false;
      this.unSubscribeChanges()
      this.PromoDetail=null;
      
   }else{
    this.showResetConfirmationAlert = true
   }
    
  }
  cancelBooking(event) {
    if(this.bookingForm.pristine) {
      this.resetBookingFormData()
      this.newBooking = false;
      this.unSubscribeChanges()
      this.PromoDetail=null;
      this.router.navigate([this.navigateTo], {
        state: {
          selectedDate:this.sendSelectedDate
        }
      },
      )
   }else{
    this.confirmationCancelForm = true
   }
//    if(this.bookingForm.dirty) {
//     console.log("form  changed")
//  }
//     event.preventDefault()
//     if (this.checkFormData()) {
//       this.confirmationCancelForm = true
//     } else {
      
//     }
    
  }
  cancelFormCancel(){
    this.confirmationCancelForm = false
  }
  cancelConfirm(){
    this.resetBookingFormData()
    this.newBooking = false;
    this.confirmationCancelForm = false
    this.unSubscribeChanges();
    this.PromoDetail=null;
    this.router.navigate([this.navigateTo], {
      state: {
        selectedDate:this.sendSelectedDate
      }
    },
    )
  }
  calculateTotalAmounts(bookingData) {
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
   
    prodControls.forEach((element, index) => {
      let prodId=(bookingData.Products)? bookingData.Products[index].BookingProductId:null

      this.setControls(element, index)
     
      prodControls[index].get("CategoryId").setValue(this.selectedTreatments[index].selectedTreatmentDetail.CategoryId)
      prodControls[index].get("Name").setValue(this.selectedTreatments[index].selectedTreatmentDetail.ProductName)
      prodControls[index].get("PreparationTime").setValue(this.selectedTreatments[index].selectedTreatmentDetail.PreparationTime)
      prodControls[index].get("BookingProductId").setValue(prodId)



    })
     this.calculateTotalPrice()
  }


  updateBookingData(fromDraft = false) {
    

    if (!this.isInvalidForBooking()) {
      this.checkAddress();
      this.checkAddress();
      if (!this.isAddressValid && !this.confirmAddressAlertEdit && !this.bookingForm.get('OrganisationLocationId').value ) {
        this.noAddressAlertEdit = true;
        return;
      } 
      if((this.showSkillAvailableAlert || this.showNotAvailableAlert) && !this.confirmAvailableAlertEdit){
        this.showAvailablitySkillAlertEdit = true;
        return;
      }
      
        let obj = { ...this.bookingForm.value };
        console.log(obj)
        if((!this.isPromoApplied )&&  obj.PromoCode ){
          this.showNotAppliedPromoAlert = true;
          return;
        }
        if(!this.isPromoActive && this.isPromoApplied &&  obj.PromoCode){
          this.showInvalidPromoAlert = true;
          return;
        }
        obj.InvoiceEmail=this.StripeEmail
        obj.Products.forEach((element, index) => {
          if(element.StaffId && element.GoogleEmail){
            obj.Products[index]['AvailableStaff'] = [{ "StaffId": element.StaffId, "GoogleEmail": element.GoogleEmail }]
          obj.Products[index]['Therapist'] = 1
          obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT;
          }else{
            obj.Products[index]['AvailableStaff'] = []
            obj.Products[index]['Therapist'] = 1
            obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
          }
          
          // let StartDate= moment(obj.DateTime).format("YYYY-MM-DD")
          // let StartTime= moment(element.DateTime).format("HH:mm")
          // obj.Products[index]['StartTime']=moment(StartDate+' '+StartTime).format("YYYY-MM-DDTHH:mm:ss");
          let StartDate = moment(obj.DateTime).format("YYYY-MM-DD")
          let StartTime = element.StartTime //moment(element.StartTime).format("HH:mm")
          // obj.Products[index]['StartTime'] = moment(StartDate + ' ' + StartTime).utc().format("YYYY-MM-DDTHH:mm:ss");
          obj.Products[index]['StartTime'] = momentz.tz(StartDate + ' ' + StartTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).utc().format("YYYY-MM-DDTHH:mm:ss");
          let Addons = [];
          console.log(this.selectedTreatments)
          if(element.AddOns && element.AddOns.length>0){
            element.AddOns.forEach(addon => {

              let foundAddOn = this.selectedTreatments[index].selectedTreatmentDetail.AddOns.find(add => add.AddOnId === addon)
              if (foundAddOn) {
                Addons.push(foundAddOn)
              }
            });
          }
          
          obj.Products[index].AddOns = Addons
          // obj.Products[index].DispatchType = 0

        });
        // obj.DateTime = moment(obj.DateTime).format("YYYY-MM-DDTHH:mm:ss");
        // obj.DateTime = moment(obj.DateTime).utc().format(),
        obj.DateTime = momentz.tz(obj.DateTime,environment.STAFF_ZONE).utc().format(),
        // this.isFormSpinning = true;
        // obj.Street=this.AddressObject.StreetName
        // obj.City=this.AddressObject.City
        // obj.Distance=this.AddressObject.DistanceInMeter
        // obj.PaidPrice = obj.Amount
        obj.ReachOutTime = this.reachOutTime
        obj.Elevator = obj.Elevator ? 1 : 0
        // obj.Therapist=1
        console.log(obj)
        let Userdata={}
        if(Object.keys(this.rootUser).length!=0){
          if (obj.UserId == null || obj.UserId == -1) {
            obj.Name = this.rootUser.Name,
              obj.Email = this.rootUser.Email
              obj.UserId =null
              Userdata={
                Name : this.rootUser.Name,
              Email: this.rootUser.Email,
              Contact : this.rootUser.Contact,
              Gender:this.rootUser.Gender,
              Street : this.rootUser.Street,
              Floor :this.rootUser.Floor,
              City :this.rootUser.City,
              Zip :this.rootUser.Zip,
              HouseNumber :this.rootUser.HouseNumber,
              Distance: this.rootUser.Distance,
              Elevator : this.rootUser.Elevator ? 1 : 0,
              Therapist : this.rootUser.Therapist,
              Notes : this.rootUser.Notes,
              DOB : this.rootUser.DOB,
              PreferredLanguage : this.rootUser.PreferredLanguage,
              ClientSource : this.rootUser.ClientSource,
              ReachOutTime : this.reachOutTime,
            ForceStaffAllot:false,
            FullAddress : this.rootUser.FullAddress,
            
              }
              
          }else{
            
            if(this.rootUser.isUpdated){
              obj.userUpdated =1
              Userdata={
                Name : this.rootUser.Name,
              Email: this.rootUser.Email,
              Contact : this.rootUser.Contact,
              Gender:this.rootUser.Gender,
              Street : this.rootUser.Street,
              Floor :this.rootUser.Floor,
              City :this.rootUser.City,
              Zip :this.rootUser.Zip,
              HouseNumber :this.rootUser.HouseNumber,
              Distance: this.rootUser.Distance,
              Elevator : this.rootUser.Elevator ? 1 : 0,
              Therapist : this.rootUser.Therapist,
              Notes : this.rootUser.Notes,
              DOB : this.rootUser.DOB,
              PreferredLanguage : this.rootUser.PreferredLanguage,
              ClientSource : this.rootUser.ClientSource,
              ReachOutTime : this.reachOutTime,
            ForceStaffAllot:false,
            FullAddress : this.rootUser.FullAddress,
            
              }
            }
          }
        }
        
        obj.Userdata=Userdata
        if(this.bookingForm.get('OrganisationLocationId').value){
          obj.HouseNumber=null;
          obj.ReachOutTime=null;
          obj.Zip=null;
          obj.Elevator=null;
        }
        if (this.editBookingDetail.Status == 9) {
          obj.Status = 4
          if(obj.PaymentType==1){
            obj.VoidInvoice=false
            this.VoidInvoice=false
            obj.IsNewInvoice=true
            this.IsNewInvoice=true
            obj.ResendInvoice=false;
            obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.PENDING
            this.callUpdateBookingAPI(obj)
          }else if(obj.PaymentType==0){
            obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
            this.callUpdateBookingAPI(obj)
          }
          else{
            obj.VoidInvoice=false
            this.VoidInvoice=false
            obj.IsNewInvoice=true
            this.IsNewInvoice=true
            obj.ResendInvoice=false;
            obj.OnlyCopy=true
            this.OnlyCopy=true
            obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.PENDING
            this.callUpdateBookingAPI(obj)
          }
        }else{
          obj.IsNewBooking = this.checkNewBookingReq(obj);
          obj.ResendInvoice=false;
          if(obj.PaymentType==1 || obj.PaymentType==2){
            //now create link
            if(this.editBookingDetail.PaymentType==0){
              //earlier cash
              obj.VoidInvoice=false
              this.VoidInvoice=false
              obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.PENDING
              if(obj.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
                obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
              }
              obj.IsNewInvoice=true
              if (obj.PaymentType == 2) {
                obj.OnlyCopy = true
                this.OnlyCopy = true
              }
              this.callUpdateBookingAPI(obj)
            
            }else{
              if(obj.IsNewBooking){
                
                if(obj.PaymentStatus==this.BOOKING_PAYMENT_STATUS.PENDING){
                  obj.VoidInvoice=true
                  this.VoidInvoice=true
                  obj.IsNewInvoice=true
                  this.IsNewInvoice=true
                  this.objToSave=obj;
                  this.showNewInvoiceAlert=true
                  if (obj.PaymentType == 2) {
                    obj.OnlyCopy = true
                    this.OnlyCopy = true
                  }
                  return;
                }else{
                  if(obj.PaymentStatus==this.BOOKING_PAYMENT_STATUS.SUCCEEDED){
                    obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
                    if (obj.PaymentType == 2) {
                      obj.OnlyCopy = true
                      this.OnlyCopy = true
                    }
                    this.callUpdateBookingAPI(obj)
                  }else{
                    if (obj.PaymentType == 2) {
                      obj.OnlyCopy = true
                      this.OnlyCopy = true
                    }
                    obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
                    this.callUpdateBookingAPI(obj)
                  }
                }
              }else{
                if(this.isNewEmail){
                  obj.ResendInvoice=true;
                }
                if (obj.PaymentType == 2) {
                  obj.OnlyCopy = true
                  this.OnlyCopy = true
                }
                this.callUpdateBookingAPI(obj)
              }
              
            }
            
            
          }else{
            if(this.editBookingDetail.PaymentType==0){
              obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
              this.callUpdateBookingAPI(obj)
            }else{
              
             
              if(obj.PaymentStatus==this.BOOKING_PAYMENT_STATUS.PENDING){
                obj.VoidInvoice=true
                this.VoidInvoice=true
                obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
                this.objToSave=obj;
                this.showVoidInvoiceAlert=true
                return;
              }else{
                obj.PaymentStatus=this.BOOKING_PAYMENT_STATUS.MANUAL
                this.callUpdateBookingAPI(obj)
              }
            }
          }
        }
        
       
       
        
        
      



    } else {
      // Form not valid check for empty fields
      Object.values(this.bookingForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      let productArray = this.bookingForm.get('Products') as FormArray;
      Object.values(productArray.controls).forEach(tempControl => {
        let formGroup = tempControl as FormGroup
        Object.values(formGroup.controls).forEach(treatmentControl => {
          if (treatmentControl.invalid) {
            treatmentControl.markAsDirty();
            treatmentControl.updateValueAndValidity({ onlySelf: true });
          }
        });
      });
    }



  }
  callUpdateBookingAPI(obj){
    this.isFormSpinning = true;
    if(!obj.VoidInvoice){
     let dateSame= moment(obj.DateTime).isSame(moment(this.editBookingDetail.DateTime), 'day');
     if(!dateSame && obj.PaymentType!=0){
      obj.VoidInvoice=true
      obj.IsNewInvoice=true
     }
    }
    obj.saveUserDetailRecord=this.saveUserDetailRecord
    this.webapi.request(API.UPDATE_BOOKING_CMS, obj)
          .subscribe(
            data => {
              this.editBookingMode = false
              var msg = data.headers.get('message');
              let invoiceMsg=this.InvoiceCopied
              let stateObj:any={}
              stateObj.selectedDate=this.sendSelectedDate
              stateObj.toast={
                title: "Success",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              }
              if(data.body.Data.Invoice){
                let invoiceUrl=data.body.Data.Invoice.hosted_invoice_url;
                stateObj.invoiceUrl=invoiceUrl
                stateObj.selectedDate=this.sendSelectedDate
                stateObj.toast={
                  title: "Success",
                  msg:invoiceMsg,
                  theme: 'bootstrap',
                  timeout: 3000
                }
              }
              this.newBooking = false;
              this.isFormSpinning = false;
              // this.resetNewBookingForm()
              this.router.navigate([this.navigateTo], {
                state: stateObj
              }).then(value=>{
                
                return;
              })

              // this.getStaffList();
              // this.getMetadata();
              

            },
            error => {
              this.isFormSpinning = false;

              var msg = error.headers.get('message');

              if (error.status == 424) {
                this.router.navigate([this.navigateTo], {
                  state: {
                    selectedDate:this.sendSelectedDate,
                    
                    toast:{
                      title: "Warning",
                      msg,
                      theme: 'bootstrap',
                      timeout: 3000
                    }
                  }
                }).then(value=>{
                  
                  return;
                })

              }else{
                this.toast.error({
                  title: "Error",
                  msg,
                  theme: 'bootstrap',
                  timeout: 3000
                })
              }
              
            }
          )
  }
  updateBookingConfirm(){
    this.IsNewInvoice=false;
    this.VoidInvoice=false
    this.callUpdateBookingAPI(this.objToSave)
  }
  
  isInvalidForBooking(){
    this.setBookingFormValidator()
    if(
      
      // this.bookingForm.get("UserId").value==null || this.bookingForm.get("UserId").value=='' ||
      // this.bookingForm.get("Name").value==null || this.bookingForm.get("Name").value=='' ||
      // this.bookingForm.get("Email").value==null || this.bookingForm.get("Email").value=='' ||
      this.bookingForm.get("DateTime").value==null || this.bookingForm.get("DateTime").value=='' ||
      this.bookingForm.get("Amount").value==null || this.bookingForm.get("Amount").value=='' ||
      this.bookingForm.get("BookedBy").value==null || this.bookingForm.get("BookedBy").value=='' ||
      this.bookingForm.get("FullAddress").value==null || this.bookingForm.get("FullAddress").value=='' ||
      
      // this.bookingForm.get("Elevator").value==null || this.bookingForm.get("Elevator").value=='' ||
      this.bookingForm.get("PaymentStatusName").value==null || this.bookingForm.get("PaymentStatusName").value==''||
      this.bookingForm.get("PaymentType").value==null 
      // this.bookingForm.get("Distance").value==null || this.bookingForm.get("Distance").value=='' ||
      // this.bookingForm.get("ReachOutTime").value==null || this.bookingForm.get("ReachOutTime").value==''
        ){
          // console.log("True here1");
      return true
    }else{
      if(!this.bookingForm.get("OrganisationLocationId").value){
       if( this.bookingForm.get("Zip").value==null || this.bookingForm.get("Zip").value=='' ||
       this.bookingForm.get("HouseNumber").value==null || this.bookingForm.get("HouseNumber").value==''||
       this.bookingForm.get("UserId").value==null || this.bookingForm.get("UserId").value=='' ||
      this.bookingForm.get("Name").value==null || this.bookingForm.get("Name").value=='' ||
      this.bookingForm.get("Email").value==null || this.bookingForm.get("Email").value==''){
        return true
       }
      }
      let productArray = this.bookingForm.get('Products') as FormArray;
      let prodIsInvalid=false;
      productArray.controls.forEach((element,index) => {
        if(
          element.get("ProductId").value==null || element.get("ProductId").value=='' ||
          element.get("Name").value==null || element.get("Name").value=='' ||
          element.get("StartTime").value==null || element.get("StartTime").value=='' ||
          // element.get("StaffName").value==null || element.get("StaffName").value=='' ||
          // element.get("GoogleEmail").value==null || element.get("GoogleEmail").value=='' ||
          // element.get("StaffId").value==null || element.get("StaffId").value=='' ||
          element.get("Amount").value==null || element.get("Amount").value==''||
          element.get("Duration").value==null || element.get("Duration").value==''
          
          ){
            prodIsInvalid=true
            // return true
        }
      });
      // console.log(prodIsInvalid);
      return prodIsInvalid
    }
  }
  isValidForBookingDraft(){
    
    
      let theOne = Object.keys(this.bookingForm.controls).find(key=> this.bookingForm.controls[key].value!=='')
      if ( !theOne ) {
          return true
      }else{
        return false
      }
  
  
    if(
      this.bookingForm.get("UserId").value==null || this.bookingForm.get("UserId").value=='' ||
      this.bookingForm.get("Name").value==null || this.bookingForm.get("Name").value=='' ||
     
      this.bookingForm.get("DateTime").value==null || this.bookingForm.get("DateTime").value=='' ||
      this.bookingForm.get("Amount").value==null || this.bookingForm.get("Amount").value=='' 

        ){
      return true
    }else{
      let productArray = this.bookingForm.get('Products') as FormArray;
  productArray.controls.forEach((element,index) => {
    if(
      element.get("ProductId").value==null || element.get("ProductId").value=='' ||
      element.get("Name").value==null || element.get("Name").value=='' ||
      element.get("StartTime").value==null || element.get("StartTime").value=='' ||
      element.get("StaffName").value==null || element.get("StaffName").value=='' ||
      element.get("GoogleEmail").value==null || element.get("GoogleEmail").value=='' ||
      element.get("StaffId").value==null || element.get("StaffId").value=='' ||
      element.get("Amount").value==null || element.get("Amount").value==''||
      element.get("Duration").value==null || element.get("Duration").value==''
      
      ){
        return true
    }else{
      return false
    }
  });
      return false
    }
  }

  saveBookingDraft() {
    let obj = { ...this.bookingForm.value };
    console.log(obj)
    
          if((!this.isPromoApplied )&&  obj.PromoCode){
            this.showNotAppliedPromoAlert = true;
            return;
          }
          if(!this.isPromoActive && this.isPromoApplied &&  obj.PromoCode!=null){
            this.showInvalidPromoAlert = true;
            return;
          }


    obj.Products.forEach((element,index) => {
      if(element.ProductId!=null){
        if(element.StaffId && element.GoogleEmail){
          obj.Products[index]['AvailableStaff'] = [{ "StaffId": element.StaffId, "GoogleEmail": element.GoogleEmail }]
          obj.Products[index]['Therapist'] = 1
          obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT;
        }else{
          obj.Products[index]['AvailableStaff']=[]
          obj.Products[index]['Therapist'] = 1
          obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
        }
       
        obj.Products[index]['Therapist']=1
       if(obj.Products[index]['StartTime']){
        let StartDate= moment(obj.DateTime).format("YYYY-MM-DD")
          let StartTime= element.StartTime //moment(element.StartTime).format("HH:mm")
          // obj.Products[index]['StartTime'] = moment(StartDate + ' ' + StartTime).utc().format("YYYY-MM-DDTHH:mm:ss");
          obj.Products[index]['StartTime'] = momentz.tz(StartDate + ' ' + StartTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).utc().format("YYYY-MM-DDTHH:mm:ss");

       }else{
        obj.Products[index]['StartTime'] = null
       }
        
         
        let Addons=[];
        if(element.AddOns && element.AddOns.length>0){
          element.AddOns.forEach(addon => {
            let foundAddOn= this.selectedTreatments[index].selectedTreatmentDetail.AddOns.find(add => add.AddOnId === addon)
            if(foundAddOn){
              Addons.push(foundAddOn)
            }
          });
        }
        obj.Products[index].AddOns=Addons
        // obj.Products[index].DispatchType=0
        
      }else{
        obj.Products.splice(index, 1);
      }
      
    });
  //  obj.DateTime=moment(obj.DateTime).utc().format("YYYY-MM-DDTHH:mm:ss");
   obj.DateTime = momentz.tz(obj.DateTime,environment.STAFF_ZONE).utc().format(),
    this.isFormSpinning = true;
    if(this.AddressObject){
      obj.Street=(this.AddressObject.StreetName)?this.AddressObject.StreetName:null
      obj.City=(this.AddressObject.City)?this.AddressObject.City:null
      obj.Distance=(this.AddressObject.Distance)?this.AddressObject.Distance:null
     
    }else{
      obj.Street=null
      obj.City=null
      obj.Distance=null
    }
   
    // obj.PaidPrice=obj.Amount
    obj.ReachOutTime=this.reachOutTime
    obj.Elevator= obj.Elevator ? 1 : 0
   
    let Userdata={}
    if(Object.keys(this.rootUser).length!=0){
      if (obj.UserId == null || obj.UserId == -1) {
        obj.Name = this.rootUser.Name,
          obj.Email = this.rootUser.Email
          obj.UserId =null
          Userdata={
            Name : this.rootUser.Name,
          Email: this.rootUser.Email,
          Contact : this.rootUser.Contact,
          Gender:this.rootUser.Gender,
          Street : this.rootUser.Street,
          Floor :this.rootUser.Floor,
          City :this.rootUser.City,
          Zip :this.rootUser.Zip,
          HouseNumber :this.rootUser.HouseNumber,
          Distance: this.rootUser.Distance,
          Elevator : this.rootUser.Elevator ? 1 : 0,
          Therapist : this.rootUser.Therapist,
          Notes : this.rootUser.Notes,
          DOB : this.rootUser.DOB,
          PreferredLanguage : this.rootUser.PreferredLanguage,
          ClientSource : this.rootUser.ClientSource,
          ReachOutTime : this.reachOutTime,
        ForceStaffAllot:false,
        
          }
          
      }else{
        
        if(this.rootUser.isUpdated){
          obj.userUpdated =1
          Userdata={
            Name : this.rootUser.Name,
          Email: this.rootUser.Email,
          Contact : this.rootUser.Contact,
          Gender:this.rootUser.Gender,
          Street : this.rootUser.Street,
          Floor :this.rootUser.Floor,
          City :this.rootUser.City,
          Zip :this.rootUser.Zip,
          HouseNumber :this.rootUser.HouseNumber,
          Distance: this.rootUser.Distance,
          Elevator : this.rootUser.Elevator ? 1 : 0,
          Therapist : this.rootUser.Therapist,
          Notes : this.rootUser.Notes,
          DOB : this.rootUser.DOB,
          PreferredLanguage : this.rootUser.PreferredLanguage,
          ClientSource : this.rootUser.ClientSource,
          ReachOutTime : this.reachOutTime,
        ForceStaffAllot:false,
        
          }
        }
      }
    }
         

 
          obj.Userdata=Userdata
          obj.saveUserDetailRecord=this.saveUserDetailRecord
    console.log(obj)
    // return
    this.webapi.request(API.BOOKING_DRAFT, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          
          this.newBooking=false;
          this.isFormSpinning = false;
          
          // this.getStaffList();
          // this.resetNewBookingForm()
          this.router.navigate([this.navigateTo], {
            state: {
              selectedDate:this.sendSelectedDate,
              toast:{
                title: "Success",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              }  
            }
          }).then(value=>{
            
            return;
          })
        },
        error => {
          this.isFormSpinning = false;
         
          var msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }
  updateBookingDraft() {
    let obj = { ...this.bookingForm.value };
    console.log(obj)
    if((!this.isPromoApplied )&&  obj.PromoCode ){
      this.showNotAppliedPromoAlert = true;
      return;
    }
    if(!this.isPromoActive && this.isPromoApplied &&  obj.PromoCode!=null){
      this.showInvalidPromoAlert = true;
      return;
    }
    obj.Products.forEach((element,index) => {
      if(element.ProductId!=null){
        if(element.StaffId && element.GoogleEmail){
          obj.Products[index]['AvailableStaff'] = [{ "StaffId": element.StaffId, "GoogleEmail": element.GoogleEmail }]
          obj.Products[index]['Therapist'] = 1
          obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.DIRECT_ASSIGNMENT;
        }else{
          obj.Products[index]['AvailableStaff']=[]
          obj.Products[index]['Therapist'] = 1
          obj.Products[index].DispatchType = this.PRODUCT_DISPATCH_TYPE.MANUAL_DISPATCH;
        }
        obj.Products[index]['Therapist']=1
       if( obj.Products[index]['StartTime']){
        let StartDate= moment(obj.DateTime).format("YYYY-MM-DD")
          let StartTime= element.StartTime //moment(element.StartTime).format("HH:mm")
          // obj.Products[index]['StartTime']=moment(StartDate+' '+StartTime).utc().format("YYYY-MM-DDTHH:mm:ss");
          obj.Products[index]['StartTime'] = momentz.tz(StartDate + ' ' + StartTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).utc().format("YYYY-MM-DDTHH:mm:ss");
       }else{
        obj.Products[index]['StartTime']=null
       }
        
        let Addons=[];
        if(element.AddOns && element.AddOns.length>0){
          element.AddOns.forEach(addon => {
            let foundAddOn= this.selectedTreatments[index].selectedTreatmentDetail.AddOns.find(add => add.AddOnId === addon)
            if(foundAddOn){
              Addons.push(foundAddOn)
            }
          });
        }
        obj.Products[index].AddOns=Addons
        // obj.Products[index].DispatchType=0
        
      }else{
        obj.Products.splice(index, 1);
      }
      
    });
  //  obj.DateTime=moment(obj.DateTime).utc().format("YYYY-MM-DDTHH:mm:ss");
   obj.DateTime = momentz.tz(obj.DateTime,environment.STAFF_ZONE).utc().format(),
    this.isFormSpinning = true;
    if(this.AddressObject){
      obj.Street=(this.AddressObject.StreetName)?this.AddressObject.StreetName:null
      obj.City=(this.AddressObject.City)?this.AddressObject.City:null
      obj.Distance=(this.AddressObject.Distance)?this.AddressObject.Distance:null
     
    }else{
      obj.Street=null
      obj.City=null
      obj.Distance=null
    }
   
    // obj.PaidPrice=obj.Amount
    obj.ReachOutTime=this.reachOutTime
    obj.Elevator= obj.Elevator ? 1 : 0

    let Userdata={}
    if(Object.keys(this.rootUser).length!=0){
      if (obj.UserId == null || obj.UserId == -1) {
        obj.Name = this.rootUser.Name,
          obj.Email = this.rootUser.Email
          obj.UserId =null
          Userdata={
            Name : this.rootUser.Name,
          Email: this.rootUser.Email,
          Contact : this.rootUser.Contact,
          Gender:this.rootUser.Gender,
          Street : this.rootUser.Street,
          Floor :this.rootUser.Floor,
          City :this.rootUser.City,
          Zip :this.rootUser.Zip,
          HouseNumber :this.rootUser.HouseNumber,
          Distance: this.rootUser.Distance,
          Elevator : this.rootUser.Elevator ? 1 : 0,
          Therapist : this.rootUser.Therapist,
          Notes : this.rootUser.Notes,
          DOB : this.rootUser.DOB,
          PreferredLanguage : this.rootUser.PreferredLanguage,
          ClientSource : this.rootUser.ClientSource,
          ReachOutTime : this.reachOutTime,
        ForceStaffAllot:false,
        FullAddress : this.rootUser.FullAddress,
        
          }
          
      }else{
        
        if(this.rootUser.isUpdated){
          obj.userUpdated =1
          Userdata={
            Name : this.rootUser.Name,
          Email: this.rootUser.Email,
          Contact : this.rootUser.Contact,
          Gender:this.rootUser.Gender,
          Street : this.rootUser.Street,
          Floor :this.rootUser.Floor,
          City :this.rootUser.City,
          Zip :this.rootUser.Zip,
          HouseNumber :this.rootUser.HouseNumber,
          Distance: this.rootUser.Distance,
          Elevator : this.rootUser.Elevator ? 1 : 0,
          Therapist : this.rootUser.Therapist,
          Notes : this.rootUser.Notes,
          DOB : this.rootUser.DOB,
          PreferredLanguage : this.rootUser.PreferredLanguage,
          ClientSource : this.rootUser.ClientSource,
          ReachOutTime : this.reachOutTime,
        ForceStaffAllot:false,
        FullAddress : this.rootUser.FullAddress,
        
          }
        }
      }
    }
    
    obj.Userdata=Userdata
 

 
   
    console.log(obj)
    // return
    this.webapi.request(API.BOOKING_DRAFT, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          
          this.newBooking=false;
          this.isFormSpinning = false;
          this.editBookingMode = false;
          this.editDraftMode = false;
          
          // this.getStaffList();
          // this.resetNewBookingForm()
          this.router.navigate([this.navigateTo], {
            state: {
              selectedDate:this.sendSelectedDate,
              toast:{
                title: "Success",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              }  
            }
          }).then(value=>{
            
            return;
          })
        },
        error => {
          this.isFormSpinning = false;
         
          var msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }

  checkFormData(){
  if(
    this.bookingForm.controls.UserId.value!=null ||
    this.bookingForm.controls.Name.value!=null ||
    this.bookingForm.controls.Email.value!=null ||
    this.bookingForm.controls.DateTime.value!=null ||
    this.bookingForm.controls.Amount.value!= 0 ||
    this.bookingForm.controls.BookingId.value!=null ||
    this.bookingForm.controls.Zip.value!=null ||
    this.bookingForm.controls.HouseNumber.value!=null ||
    this.bookingForm.controls.Elevator.value!=0 ||
    this.bookingForm.controls.PaymentStatusName.value!='PENDING' ||
    this.bookingForm.controls.Distance.value!=null ||
    this.bookingForm.controls.ReachOutTime.value!=null 
  
  ){
    return true
  }else{
    
    let productArray = this.bookingForm.get('Products') as FormArray;
    for (let controlInc = 0; controlInc < productArray.controls.length; controlInc++) {
      let element=productArray.controls[controlInc]
      console.log(element.get("Skills").value.length)
      if(
        // element.get("ProductId").value!=null ||
        // element.get("Name").value!=null ||
        // element.get("StartTime").value!=null ||
        // element.get("StaffName").value!=null ||
        // element.get("GoogleEmail").value!=null ||
        // element.get("StaffId").value!=null  ||
        // element.get("Amount").value!=0 ||
        // element.get("Duration").value!=null ||
        // element.get("AddOns").value!=null ||
        // element.get("CategoryId").value!=null ||
        // element.get("TotalAmount").value!=0 ||
        // element.get("PreparationTime").value!=null ||
        // element.get("BookingProductId").value!=null ||
        element.get("Skills").value.length>1
        
        ){
          return true
      }else{
        return false
      }
    }
    //   productArray.controls.forEach((element,index) => {
    //     if(
    //       element.get("ProductId").value!=null || element.get("ProductId").value!='' ||
    //       element.get("Name").value!=null || element.get("Name").value!='' ||
    //       element.get("StartTime").value!=null || element.get("StartTime").value!='' ||
    //       element.get("StaffName").value!=null || element.get("StaffName").value!='' ||
    //       element.get("GoogleEmail").value!=null || element.get("GoogleEmail").value!='' ||
    //       element.get("StaffId").value!=null || element.get("StaffId").value!='' ||
    //       element.get("Amount").value!=0 || element.get("Amount").value!=''||
    //       element.get("Duration").value!=null || element.get("Duration").value!=''||
    //       element.get("AddOns").value!=null || element.get("AddOns").value!=''||
    //       element.get("CategoryId").value!=null || element.get("AddOns").value!=''||
    //       element.get("TotalAmount").value!=0 || element.get("TotalAmount").value!=''||
    //       element.get("PreparationTime").value!=null || element.get("PreparationTime").value!=''||
    //       element.get("BookingProductId").value!=null || element.get("BookingProductId").value!=''||
    //       element.get("Skills").value!=null || element.get("Skills").value.length>0
          
    //       ){
    //         return 'sd'
    //     }else{
    //       return 'ss'
    //     }
      
      
    // })
  


}
  }
  

  checkNewBookingReq(bookingObj: any): boolean {
    let isNewBooking = false;
    console.log(this.editBookingDetail);
    console.log(bookingObj);
    if (this.editBookingDetail.Products.length !== bookingObj.Products.length) {
      isNewBooking = true;
      return isNewBooking;
    }
    if (this.editBookingDetail.PromoAmount !== bookingObj.PromoAmount) {
      isNewBooking = true;
      return isNewBooking;
    }
    if (this.editBookingDetail.PromoCode !== bookingObj.PromoCode) {
      isNewBooking = true;
      return isNewBooking;
    }
    if (this.editBookingDetail.Amount !== bookingObj.Amount) {
      isNewBooking = true;
      return isNewBooking;
    }
    for (let prInc = 0; prInc < bookingObj.Products.length; prInc++) {
      const product = bookingObj.Products[prInc];
      if (!product.BookingProductId) {
        isNewBooking = true;
        break;
      }
      let prodFound = this.editBookingDetail.Products.find(p => p.BookingProductId === product.BookingProductId);
      if (!prodFound) {
        isNewBooking = true;
        break;
      }
      if (prodFound.Duration !== product.Duration) {
        isNewBooking = true;
        break;
      }
      if (prodFound.Amount !== product.Amount) {
        isNewBooking = true;
        break;
      }
      if (prodFound.AddOns.length !== product.AddOns.length) {
        isNewBooking = true;
        break;
      }
      // let addOnInValid = false;
      // for (let addInc = 0; addInc < product.AddOns.length; addInc++) {
      //   const addOn = product.AddOns[addInc];
      //   if (!addOn.BookingProductAddOnId) {
      //     addOnInValid = true;
      //     break;
      //   }
      //   let addOnFound = prodFound.AddOns.find(ad => ad.BookingProductAddOnId === addOn.BookingProductAddOnId);
      //   if (!addOnFound) {
      //     addOnInValid = true;
      //   }
      //   if (addOnFound.Duration !== addOn.Duration) {
      //     addOnInValid = true;
      //   }
      //   if (addOnFound.Amount !== addOn.Amount) {
      //     addOnInValid = true;
      //   }
      // }
      // if (addOnInValid) {
      //   isNewBooking = true;
      //   break;
      // }
     
    }
    return isNewBooking;
  }

  validatePromocode(onchange){
    let promoCode=this.bookingForm.get('PromoCode').value;
    // let bookingDate=this.bookingForm.get('DateTime').value;
    console.log(promoCode)
    if(promoCode){
      let obj={
        PromoCode:promoCode,
        TimeZone:environment.STAFF_ZONE,
        // BookingDate:bookingDate
      }
      this.webapi.request(API.CHECK_PROMOCODE_CMS, obj)
        .subscribe(
          data => {
            
            this.PromoDetail = { ...data.body.Data }
            this.verifyPromoAmount(onchange)
            
            
  
         },
        error => {
          
         
          var msg = error.headers.get('message');
          if(this.isPromoApplied){
            this.removePromoCode()
          }
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
    }
  }

  calculateDiscount(amount,mode,value){
    let discount=amount;
    switch(mode){
      case 0:
        discount=(value*amount)/100;
        break;
      case 1:
        discount=value;
        break;
      default:
        discount=value
        break;

    }
    return discount;
  }
  setPromoCodeDataOnEdit(booking) {
    let PromoDetail = booking.PromoDetail
    this.discount=0
    if(!PromoDetail){
      PromoDetail={}
    }
    if(Object.keys(PromoDetail).length){
      this.discount = booking.PromoAmount
    this.isPromoApplied = true
    this.isPromoActive = true

    this.promocodeText += (PromoDetail.Mode == 0) ? PromoDetail.Value + '% Discount' : '€' + PromoDetail.Value + ' Discount'
    let productArray = this.bookingForm.get('Products') as FormArray;
        // let prodControls = productArray.controls
        // let totalAmtByCategory = 0
        productArray.controls.forEach((element, index) => {
          let bookingProdId=productArray.controls[index].get('BookingProductId').value
          if(bookingProdId){
            let findindex=booking.Products.findIndex(prod => prod.BookingProductId === bookingProdId);
            if(findindex!=-1){
              productArray.controls[index].get('Discount').setValue(booking.Products[findindex].Discount)
              productArray.controls[index].get('DiscountedAmount').setValue(booking.Products[findindex].DiscountedAmount)
            }
          }
        });
    }
    

  }
  verifyPromoAmount(onchange) {
    let PromoDetail = this.PromoDetail
    if (PromoDetail) {
      let msg = this.InvalidPromo;
      this.promocodeText = this.bookingForm.controls.PromoCode.value + ' - '
      if (PromoDetail.Type == 0) {
        let amount = this.bookingForm.get('Amount').value
        let travelFee = this.bookingForm.get('TravelFee').value
        if (travelFee) {
          amount = amount - travelFee
        }
        if (amount == 0) {
          msg = this.InvalidPromoAmount
          this.isPromoValid = false;
          if (this.isPromoApplied) {
            this.isPromoActive = false;
            // this.discount=0
          }
          this.discount = 0
          this.removePromoCode()
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
        } else {
          let discount = this.calculateDiscount(amount, PromoDetail.Mode, PromoDetail.Value)
          this.discount = (discount > PromoDetail.MaxAmount) ? PromoDetail.MaxAmount : (discount > amount) ? amount : discount
          // let discountedAmount=amount-discount
          // let finalAmount=(discountedAmount > PromoDetail.MaxAmount)?PromoDetail.MaxAmount:discountedAmount
          if (amount < PromoDetail.MinPurchaseAmount) {
            this.isPromoValid = false;
            if (this.isPromoApplied) {
              this.isPromoActive = false;
              // this.discount=0
            }
            this.discount = 0
            this.removePromoCode()
            this.toast.error({
              title: "Error",
              msg,
              theme: 'bootstrap',
              timeout: 3000
            })
          } else {
            this.isPromoApplied = true
            this.isPromoActive = true

            this.promocodeText += (PromoDetail.Mode == 0) ? PromoDetail.Value + '% Discount' : '€' + PromoDetail.Value + ' Discount'
            // this.bookingForm.controls.Amount.setValue(amount)
            // this.bookingForm.controls.PaidPrice.setValue(finalAmount)
            this.bookingForm.controls.PromoCodeId.setValue(PromoDetail.PromoCodeId)
            this.bookingForm.controls.PromoAmount.setValue(this.discount)
            let discountedAmount = amount - this.discount
            this.discountedAmount = Math.min(discountedAmount, 0);
            this.calculateTotalPrice()

          }
        }


      } else {
        let categoryFound = [];
        let categoryFoundIndex = [];
        let prodIndex = -1

        let productArray = this.bookingForm.get('Products') as FormArray;
        let prodControls = productArray.controls
        let totalAmtByCategory = 0
        productArray.controls.forEach((element, index) => {
          this.setControls(element, index)
          let category = element.get("CategoryId").value

          if (category && PromoDetail.Categories.includes(category)) {
            categoryFound.push(element);
            categoryFoundIndex.push(index)
            totalAmtByCategory += productArray.controls[index].get('TotalAmount').value
          }
        });
        if (totalAmtByCategory == 0) {
          msg=this.InvalidPromoAmount
          this.isPromoValid = false;
              if (this.isPromoApplied) {
                this.isPromoActive = false;
                // this.discount=0
              }
              this.discount = 0
              this.removePromoCode()
              this.toast.error({
                title: "Error",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              })
        } else {
          if (categoryFound.length > 0) {

            let discount = this.calculateDiscount(totalAmtByCategory, PromoDetail.Mode, PromoDetail.Value)
            let discountedAmount = totalAmtByCategory - discount
            this.discountedAmount = Math.min(discountedAmount, 0);
            this.discount = (discount > PromoDetail.MaxAmount) ? PromoDetail.MaxAmount : (discount > totalAmtByCategory) ? totalAmtByCategory : discount      // let finalAmount=(discountedAmount > PromoDetail.MaxAmount)?PromoDetail.MaxAmount:discountedAmount
            if (totalAmtByCategory < PromoDetail.MinPurchaseAmount) {
              this.isPromoValid = false;
              if (this.isPromoApplied) {
                this.isPromoActive = false;
                // this.discount=0
              }
              this.discount = 0
              this.removePromoCode()
              this.toast.error({
                title: "Error",
                msg,
                theme: 'bootstrap',
                timeout: 3000
              })

            } else {
              this.isPromoApplied = true
              this.isPromoActive = true
              // prodControls[prodIndex].get("TotalAmount").setValue(finalAmount)
              this.bookingForm.controls.PromoCodeId.setValue(PromoDetail.PromoCodeId)
              this.bookingForm.controls.PromoAmount.setValue(this.discount)
              this.calculateTotalPrice()
              if (PromoDetail.Mode == 0 && this.discount == discount) {
                categoryFoundIndex.forEach((element) => {
                  let prodAmt = productArray.controls[element].get('TotalAmount').value
                  let prodDiscount = (PromoDetail.Value * prodAmt) / 100;
                  let prodDiscountedAmount = prodAmt - prodDiscount
                  productArray.controls[element].get('DiscountedAmount').setValue(prodDiscountedAmount)
                  productArray.controls[element].get('Discount').setValue(prodDiscount)
                });
              } else {
                let discountInPercent = (this.discount / totalAmtByCategory) * 100
                categoryFoundIndex.forEach((element) => {
                  let prodAmt = productArray.controls[element].get('TotalAmount').value
                  let prodDiscount = (discountInPercent * prodAmt) / 100;
                  let prodDiscountedAmount = prodAmt - prodDiscount
                  productArray.controls[element].get('DiscountedAmount').setValue(prodDiscountedAmount)
                  productArray.controls[element].get('Discount').setValue(prodDiscount)
                });
              }
              this.promocodeText += (PromoDetail.Mode == 0) ? PromoDetail.Value + '% Discount' : '€' + PromoDetail.Value + ' Discount'

            }

          } else {
            let msg = this.InvalidCategoryPromo
            this.isPromoValid = false;
            if (this.isPromoApplied) {
              this.removePromoCode()
            }
            this.toast.error({
              title: "Error",
              msg,
              theme: 'bootstrap',
              timeout: 3000
            })

          }
        }

      }
    }

  }

  removePromoCode(){
    this.bookingForm.controls.PromoCodeId.setValue(null)
    this.bookingForm.controls.PromoAmount.setValue(null)
    this.bookingForm.controls.PromoCode.setValue(null)
    this.discount=0
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    prodControls.forEach((element, index) => {

      this.setControls(element, index)
    })
    this.PromoDetail=null
     this.calculateTotalPrice()
     this.isPromoApplied=false;
     this.isPromoActive=false;
     this.discount=0
  }

  editSendingInvoiceEmail(){
    this.showEditEmail=true
    this.StripeEmailEdit=this.StripeEmail;
  }
  cancelEmailConfirm(){
    this.showEditEmail=false
  }
  saveEmailConfirm(){
    console.log(this.StripeEmail)
    this.StripeEmail=this.StripeEmailEdit
    this.showEditEmail=false
    this.isNewEmail=true;
  }


  getStaffFilterList(firstLoad = null): void {
    this.isloadingStaffFilterList = true;
    if(firstLoad){
      this.isStaffListLoading=true
    }
    let obj = { ...this.staffFilterArray, IgnoreBookings: false }
    this.webapi.request(API.GET_STAFF_FILTER_LIST, {
      ...obj
    })
      .subscribe(
        data => {
          this.isStaffListLoading=false
          this.isloadingStaffFilterList = false;
          console.log("getStaffFilterList :", data);
          this.filterStaffList = [...data.body.data];
          this.autoCompleteStaffList = this.filterStaffList;
          this.filterStaffList2 =this.filterStaffList;
          this.sortStaffList()
          if (firstLoad) {
            if (!this.showFilterPopSingle) {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = true;
              })
            } else {
              this.filterStaffList.forEach(function (value, i) {
                value.selected = false;
              })
            }
                        

          }else{
            if(this.selectAllTherapistValue){
              this.filterStaffList.forEach(function (value, i) {
                value.selected = true;
              })
            }else{
              this.filterStaffList.forEach(function (value, i) {
                value.selected = false;
              })
            }
          }
          console.log(this.filterStaffList)
          // this.setConstraints();
          // this.setScroll()

        },
        error => {
          this.isStaffListLoading=false
          this.isloadingStaffFilterList = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  selectOptionInvalid(controls) {
    return {
      'selectOption-invalid': this.submitted && controls
    }
  }
  
  productGroup(index) {
    this.productList = this.bookingForm.get('Products') as FormArray;
    const formGroup = this.productList.controls[index] as FormGroup;
    return formGroup;
  }

  // disableStartDate = (selectedDate: Date): boolean => {
  //   var today = moment().utc().startOf("day");
  //   // console.log(today.format())
  //   var selectedStart = moment(selectedDate).utc().startOf("day")
  //   // console.log(selectedStart.format())
  //   if (today.isAfter(selectedStart)) {
  //     return true;
  //   } else if (today.isSame(selectedStart) || today.isBefore(selectedStart)) {
  //     return false;
  //   }
  // }
  disableBookingDate = (selectedDate: Date): boolean => {
    let today = moment().startOf("day");
    let selectedStart = moment(selectedDate);
    if (today.isBefore(selectedStart) || today.isSame(selectedStart)) {
      return false;
    }
    return true;
  }
  setTimeSlot(time) {
    console.log("set")
    let timeSlotFinal=[]
    let timeslotarry=this.timeSlots;
    let leadTime=this.calendarService.leadTimeData.TodayLeadTime
  
    let date=moment(this.selectedDate).format("YYYY-MM-DD");
    let firstIndex=108;//set for 09:00 by default
      timeslotarry.forEach(function (value, i) {
      let timeslotDate=  momentz.tz(date + ' ' + value,environment.STAFF_ZONE).format("YYYY-MM-DDTHH:mm:ss");
      let timeslot= moment(timeslotDate)
      var today = momentz.tz(environment.STAFF_ZONE).format("YYYY-MM-DDTHH:mm:ss");

      var duration =moment(timeslot,"YYYY-MM-DDTHH:mm:ss").diff(moment(today,"YYYY-MM-DDTHH:mm:ss"), "minutes");
     
      if(duration>0){
        if(firstIndex==108){
          firstIndex=i;
        }
        timeSlotFinal.push({time:value,disabled:false})
      }else{
       
        timeSlotFinal.push({time:value,disabled:true})
      }
      })
      this.StartTimeIndex=firstIndex;
      this.timeSlotFinal=timeSlotFinal

  }

  setBookingFormValidator(){
    if(!this.bookingForm.get("OrganisationLocationId").value){
      this.bookingForm.controls.UserId.setValidators([Validators.required]);
    this.bookingForm.controls.UserId.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Name.setValidators([Validators.required]);
    this.bookingForm.controls.Name.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Email.setValidators([Validators.required]);
    this.bookingForm.controls.Email.updateValueAndValidity({ onlySelf: true,emitEvent: false })
    }else{
      this.bookingForm.controls.UserId.clearValidators();
      this.bookingForm.controls.UserId.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      this.bookingForm.controls.Email.clearValidators();
      this.bookingForm.controls.Email.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
      this.bookingForm.controls.Name.clearValidators();
      this.bookingForm.controls.Name.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    }
    this.bookingForm.controls.UserId.setValidators([Validators.required]);
    this.bookingForm.controls.UserId.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Name.setValidators([Validators.required]);
    this.bookingForm.controls.Name.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Email.setValidators([Validators.required]);
    this.bookingForm.controls.Email.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.DateTime.setValidators([Validators.required]);
    this.bookingForm.controls.DateTime.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Amount.setValidators([Validators.required]);
    this.bookingForm.controls.Amount.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Zip.setValidators([Validators.required]);
    this.bookingForm.controls.Zip.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.HouseNumber.setValidators([Validators.required]);
    this.bookingForm.controls.HouseNumber.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.Elevator.setValidators([Validators.required]);
    this.bookingForm.controls.Elevator.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    this.bookingForm.controls.PaidPrice.setValidators([Validators.required]);
    this.bookingForm.controls.PaidPrice.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    
    let productArray = this.bookingForm.get('Products') as FormArray;

    productArray.controls.forEach((element, index) => {
      // console.log(element)
      element.get("ProductId").setValidators([Validators.required])
      element.get("ProductId").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("Name").setValidators([Validators.required])
      element.get("Name").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("StartTime").setValidators([Validators.required])
      element.get("StartTime").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("Duration").setValidators([Validators.required])
      element.get("Duration").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("StaffName").setValidators([Validators.required])
      element.get("StaffName").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("GoogleEmail").setValidators([Validators.required])
      element.get("GoogleEmail").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("StaffId").setValidators([Validators.required])
      element.get("StaffId").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      element.get("Amount").setValidators([Validators.required])
      element.get("Amount").updateValueAndValidity({ onlySelf: true,emitEvent: false })
      
    })
   
  }

  checkingLeadTime(index){
    console.log("checking")
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    let startTime=prodControls[index].get("StartTime").value
    console.log(startTime);
    if(startTime){

    
    let datetime= moment(this.bookingForm.controls.DateTime.value).format("YYYY-MM-DD")
    let selectedDateTime= momentz.tz(datetime + ' ' + startTime,'YYYY-MM-DDTHH:mm:ss',environment.STAFF_ZONE).format("YYYY-MM-DDTHH:mm:ss");
    let today = moment().tz(environment.STAFF_ZONE).format("YYYY-MM-DDTHH:mm:ss");
    var duration =moment(selectedDateTime,"YYYY-MM-DDTHH:mm:ss").diff(moment(today,"YYYY-MM-DDTHH:mm:ss"), "minutes");
    let leadTime=this.calendarService.leadTimeData.TodayLeadTime
    if(duration<leadTime){
      this.showRecentBookingAlert=true;
    }
 
    console.log("datetime",datetime)
    console.log("selectedDateTime",selectedDateTime)
    console.log("today",today)
    console.log("duration",duration)
    console.log("leadTime",leadTime)
  }

  }
  
  checkSameTime(index){
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    
    let startTime=prodControls[index].get("StartTime").value
    let staff= prodControls[index].get("StaffId").value
    let sameTime=false;
    let sameStaff=false;

    prodControls.forEach((element, eachIndex) => {
      if(eachIndex!=index){
        let prodStartTime=element.get("StartTime").value
        let prodStaff=element.get("StaffId").value
        if(prodStartTime==startTime && prodStartTime && startTime){
          sameTime=true;
          if(prodStaff==staff && prodStaff && staff){
            sameStaff=true
          }
        }
      }
    })
    if(sameTime){
      if(sameStaff){
        this.showSameStaffAlert=true;
        this.showSameTimeAlert=false;
      }else{
        this.showSameTimeAlert=true;
        this.showSameStaffAlert=false;
      }
      

    }else{
      this.showSameStaffAlert=false;
      this.showSameTimeAlert=false;
    }
  }

 

  sortUserList(): void {
    this.appUserList.sort((a, b) => {
      if ( a.Name.toLowerCase() < b.Name.toLowerCase() ){
        return -1;
      }
      if ( a.Name.toLowerCase() > b.Name.toLowerCase() ){
        return 1;
      }
      return 0;
    });
  }
  sortStaffList(): void {
    this.autoCompleteStaffList.sort((a, b) => {
      if ( a.Name.toLowerCase() < b.Name.toLowerCase() ){
        return -1;
      }
      if ( a.Name.toLowerCase() > b.Name.toLowerCase() ){
        return 1;
      }
      return 0;
    });
  }
  sortTreatmment(Product): void {
    Product.sort((a, b) => {
      if ( a.ProductName.toLowerCase() < b.ProductName.toLowerCase() ){
        return -1;
      }
      if ( a.ProductName.toLowerCase() > b.ProductName.toLowerCase() ){
        return 1;
      }
      return 0;
    });
    return Product
  }

  sortSpecialRequest(){
    
    this.SpecialRequestData.sort((a, b) => {
      if ( a.SpecialRequestName.toLowerCase() < b.SpecialRequestName.toLowerCase() ){
        return -1;
      }
      if ( a.SpecialRequestName.toLowerCase() > b.SpecialRequestName.toLowerCase() ){
        return 1;
      }
      return 0;
    });
  }
  sortOrganisationList(): void {
    // this.organisationList.sort((a, b) => {
    //   if ( a.Name.toLowerCase() < b.Name.toLowerCase() && ){
    //     return -1;
    //   }
    //   if ( a.Name.toLowerCase() > b.Name.toLowerCase() ){
    //     return 1;
    //   }
    //   return 0;
    // });

    this.organisationList.sort((a, b) => {
      if (a.OrganisationLocationId === -1 ) {
        return -1; // Keep the object with the 'keepOnTop' name at the beginning
      } else if (b.OrganisationLocationId === -1) {
        return 1; // Move the 'keepOnTop' object to the beginning
      } else {
        return a.Name.localeCompare(b.Name); // Sort the remaining objects by name
      }
    });
  }
  checkToday(formDate = null) {
    let today = moment().tz(environment.STAFF_ZONE).toDate();
    let selectedDay = moment(this.selectedDate, this.FORMAT_DD_MM_YYYY).startOf("day");
    
    if (selectedDay.isBefore(today)) {
      this.selectedDate = moment().tz(environment.STAFF_ZONE).toDate();
    }
    this.setTimeSlot(this.timeSlots)
  }

  changeIsWorking() {
    console.log(this.staffFilterArray)
    const { groups, skills, searchValue } = this.staffFilterArray
    let isFiltered = groups.length !== 0 || skills.length !== 0 || searchValue !== '';
    this.isWorkingLabel = (this.staffFilterArray.isWorking == '0') ? "All Therapists" : "Working";
    this.isWorkingLabel = `${this.isWorkingLabel} ${isFiltered ? "(Filtered)" : ""}`;
    this.getStaffFilterList(true)
  }
 onSearchKeyUp() {
    console.log(this.staffFilterArray)
    clearTimeout(this.typingTimeout);

      this.typingTimeout = setTimeout(() => {
        this.getStaffFilterList()
      }, 700);
   

  }
  selectGroupSelect(staffGroupData) {
    console.log(staffGroupData)
    let selectedGroups = []
    this.filteredGroups=[]
    staffGroupData.forEach(group => {
      if (group.selected === true) {
        selectedGroups.push(group.StaffGroupId)
        this.filteredGroups.push(group.Name);
      }
    })
    this.staffFilterArray.groups = selectedGroups
    console.log("selectGroupSelect this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()

  }

  selectOrgSelect(staffOrgData) {
    console.log(staffOrgData)
    let selectedOrganisations = []
    this.filteredOrg=[]
    staffOrgData.forEach(org => {
      if (org.selected === true) {
        selectedOrganisations.push(org.OrganisationLocationId)
        this.filteredOrg.push(org.Name);
      }
    })
    this.staffFilterArray.OrganisationLocationId = selectedOrganisations
    //console.log("selectGroupSelect this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()

  }
  selectSkill(categoryList) {
    console.log(categoryList)
    let selectedProducts = []
    this.filteredCategories=[]
    categoryList.forEach(cat => {
      cat.Products.forEach(product => {
        if (product.selected === true) {
          selectedProducts.push(product.ProductId)
          if (this.filteredCategories.indexOf(cat.Name) === -1) {
            this.filteredCategories.push(cat.Name)
          }
        }
      })
    })

    console.log(this.staffFilterArray)
    this.staffFilterArray.skills = selectedProducts
    console.log("selectSkill this.staffFilterArray", this.staffFilterArray)
    this.getStaffFilterList()
  }
  isEmailInvalid() {
    if(!this.StripeEmailEdit){
      
      return true;
    }else{

      const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
     
      return !emailRegex.test(this.StripeEmailEdit) ;
    }
  }
  pushGuestFormData(guest){
    let guestFormArray= this.fb.group({
      Name: [guest.Name],
      Relation: [guest.Relation],
      Contact: [guest.Contact],
      Gender: [guest.Gender],
      Notes: [guest.Notes],
    })
    return guestFormArray;

  }
  onBackButtonPressed(event) {
    console.log("back button")
   return false;
    
    
  }
  clearStaff(i) {
    console.log(i)
    let productArray = this.bookingForm.get('Products') as FormArray;
    let prodControls = productArray.controls
    
    prodControls[i].get("StaffName").setValue(null)
    prodControls[i].get("StaffId").setValue(null)
    prodControls[i].get("GoogleEmail").setValue(null)
    this.selectedTreatments[i].isStaffAvailable=null
    this.selectedTreatments[i].isSkillPresent=null
    
    
  }
  clearSelectedOrg(){
    this.bookingForm.controls.OrganisationLocationId.setValue(null)
  }

  setTreatments(organisationlocationId){
    let treatmentDetailNew=[]
console.log("called set")
    console.log("length treatmentDetailNew")
    console.log(treatmentDetailNew.length)
    this.treatmentDetail.forEach(treatment => {
      treatment.Products.forEach(prod=>{
        if(organisationlocationId){
         
          console.log("in org")
          if(prod.OrganisationLocationId==organisationlocationId){
            console.log("selected org")
            let catIndex=treatmentDetailNew.findIndex(cat => cat.CategoryId === prod.CategoryId)
            // console.log("catIndex",catIndex)
            // console.log("prod",prod)
            // console.log("treatment",treatment)
            // console.log(JSON.stringify(treatmentDetailNew))
            if(catIndex==-1){
              let treamentClone={...treatment}
              treamentClone.Products=[prod]
              treatmentDetailNew.push(treamentClone)
              // treatmentDetailNew[0].Products=[prod]
              
            }else{
              treatmentDetailNew[catIndex].Products.push(prod)
            }
          }

        }else{
          if(prod.OrganisationLocationId==null){
            console.log("in else")
            let catIndex=treatmentDetailNew.findIndex(cat => cat.CategoryId === prod.CategoryId)
            // console.log("catIndex",catIndex)
            // console.log("prod",prod)
            // console.log("treatment",treatment)
            // console.log(JSON.stringify(treatmentDetailNew))
            if(catIndex==-1){
              let treamentClone={...treatment}
              treamentClone.Products=[prod]
              treatmentDetailNew.push({...treamentClone})
              // treatmentDetailNew[0].Products=[prod]
              
            }else{
              treatmentDetailNew[catIndex].Products.push(prod)
            }
          }

        }
        console.log(JSON.stringify(treatmentDetailNew))
      })
      
    // if(treatment.Organisations.includes(organisationlocationId)){
    //   this.treatmentDetailFiltered.push(treatment)
    // }
    })
    this.treatmentDetailNew=[...treatmentDetailNew]
  }
  handleEditAddressChange(event){
    console.log(event)
    let zipcode=null
    let housenumber=null
    let Street=null
    let City=null
    event.address_components.forEach(block => {
      console.log(block)
      
      if( block.types.includes("postal_code")){
        zipcode=block.long_name;
      }
      if( block.types.includes("street_number")){
        housenumber=block.long_name;
      }
      if( block.types.includes("locality")){
        City=block.long_name;
      }
      if( block.types.includes("route")){
        Street=block.long_name;
      }
      
      this.bookingForm.controls.HouseNumber.setValue(housenumber)
      this.bookingForm.controls.Zip.setValue(zipcode,{emitEvent:true})
      this.bookingForm.controls.FullAddress.setValue(event.formatted_address)
      this.bookingForm.controls.Street.setValue(Street)
      this.bookingForm.controls.City.setValue(City)
      this.bookingForm.controls.Latitude.setValue(event.geometry.location.lat)
      this.bookingForm.controls.Longitude.setValue(event.geometry.location.lng)
      this.getDistance()
    })

  }
  handleUserEditAddressChange(event){
    console.log(event)
    let zipcode=null
    let housenumber=null
    let Street=null
    let City=null
    event.address_components.forEach(block => {
      console.log(block)
      
      if( block.types.includes("postal_code")){
        zipcode=block.long_name;
      }
      if( block.types.includes("street_number")){
        housenumber=block.long_name;
      }
      if( block.types.includes("locality")){
        City=block.long_name;
      }
      if( block.types.includes("route")){
        Street=block.long_name;
      }
      console.log(zipcode)
      this.userForm.controls.HouseNumber.setValue(housenumber)
      this.userForm.controls.Zip.setValue(zipcode)
      this.userForm.controls.FullAddress.setValue(event.formatted_address)
      this.userForm.controls.Street.setValue(Street)
      this.userForm.controls.City.setValue(City)
      // this.userForm.controls.Latitude.setValue(event.geometry.location.lat)
      // this.userForm.controls.Longitude.setValue(event.geometry.location.lng)
      this.getUserDistance()
    })

  }
  getDistance(isUser=null) {
    
    let Address=this.bookingForm.controls.FullAddress.value
    let obj={Address:Address}
    this.webapi.request(API.GET_DISTANCE, obj)
    .subscribe(
      data => {
        this.isloadingAddress=false;
        this.AddressObject = { ...data.body.Data };
        console.log(this.AddressObject)
        
          this.AddressShow=Address
          this.DistanceShow=this.AddressObject.Distance
          this.DistanceUnit=this.AddressObject.DistanceInMeter
          this.bookingForm.controls.Distance.setValue(this.AddressObject.DistanceInMeter)
    
        
        this.getReachOutTime()
        this.checkAddress()
      },
      error => {
        this.isloadingAddress=false;
        this.AddressShow=null
          this.DistanceShow=null
          this.DistanceUnit=null
          this.checkAddress()
        console.log("errp")
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
   
    
    

  }
  getUserDistance(isUser=null) {
    
    let Address=this.userForm.controls.FullAddress.value
    let obj={Address:Address}
    this.webapi.request(API.GET_DISTANCE, obj)
    .subscribe(
      data => {
        this.isloadingAddress=false;
        this.AddressObject = { ...data.body.Data };
        console.log(this.AddressObject)
        
        
          this.newUserAddressShow=Address
          this.newUserDistanceShow=this.AddressObject.Distance
        
          this.DistanceUnit=this.AddressObject.DistanceInMeter
          this.userForm.controls.Distance.setValue(this.AddressObject.DistanceInMeter)
    
        
        this.getUserReachOutTime()
        // this.checkUserAddress()
      },
      error => {
        this.isloadingAddress=false;
        this.newUserAddressShow=null
          this.newUserDistanceShow=null
          this.DistanceUnit=null
          // this.checkUserAddress()
        console.log("errp")
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          timeout: 3000,
          theme: "bootstrap"
        })
      }
    )
   
    
    

  }
  updatePaymentTypeOptions(){
    if(this.bookingForm.controls.OrganisationLocationId.value){
      this.PaymentType.forEach((type , index)=> {
        if(type.VALUE==1 || type.VALUE==2){
          this.PaymentType[index].DISABLED=true;
        }else{
          this.PaymentType[index].DISABLED=false;
         
        }
      })

    }else{
      if(!this.bookingForm.controls.Email.value){
        this.PaymentType.forEach((type,index) => {
          if(type.VALUE==1){
            this.PaymentType[index].DISABLED=true;
          }else{
            this.PaymentType[index].DISABLED=false;
          }
        }) 
      }else{
        this.PaymentType.forEach((type,index) => {
          
          this.PaymentType[index].DISABLED=false;
          
        })
      }
    } 
  }
  onSearch(value) {
    this.searchCustValue = value;
    if (value) {
      console.log(value.toLowerCase().trim())
      const trimmedValue = value.toLowerCase().trim();
      // console.log("trimmedValue",trimmedValue)
      // console.log("trimmedValue",trimmedValue.length)
      // console.log("Value",value.length)
      this.appUserList = this.appUserListAll.filter(option =>
        option.Name.toLowerCase().includes(trimmedValue)
      );
      this.sortUserList()
    } else {
      this.appUserList = []// Show all options if search is empty
    }
  }
   clearSelectedCustomer(){
    
    this.bookingForm.controls.UserId.setValue(null)
    this.bookingForm.controls.Name.setValue(null)
    this.bookingForm.controls.Email.setValue(null)
    if(!this.bookingForm.get('OrganisationLocationId').value){
      this.bookingForm.controls.Zip.setValue(null)
    this.bookingForm.controls.HouseNumber.setValue(null)
    this.bookingForm.controls.Elevator.setValue(null)
    this.bookingForm.controls.Street.setValue(null)
    this.bookingForm.controls.City.setValue(null)
    this.bookingForm.controls.ReachOutTime.setValue(null)
    this.bookingForm.controls.Latitude.setValue(null)
    this.bookingForm.controls.Longitude.setValue(null)
    this.bookingForm.controls.FullAddress.setValue(null)

    this.AddressShow=null
    this.DistanceShow=null
    this.bookingForm.controls.PaymentType.clearValidators();
    this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    
    if(!this.bookingForm.controls.OrganisationLocationId.value){
     
    this.bookingForm.controls.PaymentType.setValue(null)
      this.bookingForm.controls.PaymentType.clearValidators();
      this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    }else{
      this.bookingForm.controls.PaymentType.setValue(0)
      this.bookingForm.controls.PaymentType.clearValidators();
      this.bookingForm.controls.PaymentType.updateValueAndValidity({ onlySelf: true,emitEvent: false }); 
    }
    this.isNewEmail=false
this.showSendingInvoice=false
   
    }
    this.rootUser={} 
    this.appUserList=[]
    this.userDetail=null
    this.userDetailShow=null
     
  }
}