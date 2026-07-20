import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import { WebService } from '../shared/services/web.service';
import { API } from '../shared/enums/apiNames.enum';
import * as moment from 'moment';
import { AnyARecord } from 'dns';
import { CookieService } from "ngx-cookie-service";
import { debounceTime } from 'rxjs/operators'

interface ItemData {
  Time: string,
  Total: number,
  count: string
}
@Component({
  selector: 'app-check-availability',
  templateUrl: './check-availability.component.html',
  styleUrls: ['./check-availability.component.css'],
  host: {
    '(window:resize)': 'onResize($event)'
  }
})



export class CheckAvailabilityComponent implements OnInit {

  selectedValue = '1'


  alltreatmentAvailabilty = [
    {

      Time: '',
      TreatmentId: '1',
    },
    {

      Name: 'Sweedish Massage2',
      TreatmentId: '2',
    },
    {

      Name: 'Sweedish Massage3',
      TreatmentId: '3',
    },
    {

      Name: 'Sweedish Massage4',
      TreatmentId: '4',
    }
  ]

  allDurations = [

    {
      Name: '60m',
      Value: 60
    }
    ,
    {
      Name: '75m',
      Value: 75
    }
    ,
    {
      Name: '90m',
      Value: 90
    }

  ];
  prefTherapistList = [
    {
      text: "Either",
      value: 2,
      byDefault: false,
  },
    {
        text: "Male",
        value: 0,
        byDefault: false,
    },
    {
        text: "Female",
        value: 1,
        byDefault: false,
    },
    
];

  availabilityForm: FormGroup;
  listOfData: ItemData[] = [];
  categoryList: any;
  metadata: any;
  prods: any;
  HH_MM = "HH:mm";
  productData: any;
  timeData: any[]=[];
  availabilityData: any={};
  objectKeys = Object.keys;
  tablewidth: any;
  columnWidth: string;
  tablewidthString: string;
  columnWidthNum: number;
screenWidth:any
  isFormSpinning: boolean;
  myInterval: NodeJS.Timeout;
  showInstructions:boolean=false
  InstructionsData: string;
  windowHeight: number;
  tableHeight: string;
  DateChanges: any;


  constructor(
    private fb: FormBuilder,
    private webapi: WebService,
    private toast: ToastyService,
    private cookieService: CookieService

  ) {
    this.screenWidth = window.innerWidth
    this.availabilityForm = this.fb.group({
      Date: [moment(new Date()).format("MM/DD/YYYY"), [Validators.required]],
      Therapist: [2, [Validators.required]],
      Duration: [60, [Validators.required]],
      ReachOutTime: [20, [Validators.required]]

    })
   
    this.windowHeight=window.innerHeight
  }


  ngOnInit() {
    this.checkAvailability();
    if(this.myInterval){
      clearInterval(this.myInterval)
    }
    this.myInterval=setInterval(() => {
      this.checkAvailability();
    }, 300000);

    this.getInstructionsData()
    this.setTableHeight();
    // Listen to form changes with debounceTime
    this.availabilityForm.valueChanges
      .pipe(debounceTime(2300)) // Adjust debounce time as needed
      .subscribe(values => {
        this.checkAvailability();
      });

  }
  ngOnDestroy() {
    clearInterval(this.myInterval )
   
  }

  getMetadata() {
    return new Promise((resolve, reject) => {

      this.webapi.requestAnonymous(API.METADATA, {
        Metadata: ["Product"]
      })
        .subscribe(
          data => {
            this.metadata = { ...data.body.Data };
           
            if (this.metadata.Product) {
              this.productData = this.metadata.Product;
              
            }
            
            resolve(true)
          },
          error => {
            reject(true)
          }
        )
    })


  }

  getTime() {
    Promise.all(
      [this.getMetadata()
    ])
    .then(results => {
      const now = new Date(); // current time
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const timeStamps: Date[] = [];

    for (let timestamp = oneDayAgo; timestamp <= now; timestamp.setMinutes(timestamp.getMinutes() + 15)) {
      timeStamps.push(new Date(timestamp)); // add timestamp to array
    }
    
    let timeData = []
    timeStamps.forEach(time => {
     
      let timeDataArray: any = {}
      timeDataArray.Date = moment(time).format(this.HH_MM)
      timeDataArray.Total = Math.floor(Math.random() * 6)
      timeDataArray.Products=[]
      this.productData.forEach(prod => {
        timeDataArray.Products.push({
         ProductId : prod.ProductId,
       Name : prod.Name,
        Count : Math.floor(Math.random() * 6)
        })
        
      });
      timeData.push(timeDataArray)
    });
    this.timeData=timeData
    });
    
    
    

  }

  checkAvailability(){
    this.isFormSpinning=true
    let obj = { ...this.availabilityForm.value };
    obj.Date=moment(obj.Date).format("MM/DD/YYYY")
   
    obj.ReachOutTime=parseInt(this.cookieService.get("reachouttime"));
    obj.OrganisationLocationId=parseInt(this.cookieService.get("organisationlocationId"));
    console.log(obj)
    this.webapi.request(API.CHECK_AVAILABILITY, obj)
            .subscribe(
              data => {
                this.isFormSpinning=false
                this.availabilityData = { ...data.body.Data };
                this.setAvailabilityData()
                this.tablewidth=(this.availabilityData.Products.length *115)+112+115+'px';
                console.log(this.availabilityData)
              },
              error => {
                this.isFormSpinning=false
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
  setAvailabilityData() {
    for (var key in this.availabilityData.StaffAvailability) {
      let genderWiseData={
        Male:0,
        Female:0
      }
      this.availabilityData.StaffAvailability[key].TotalStaff.forEach(staff=>{
       let staffFound= this.availabilityData.Staff.find(f => f.StaffId === staff);
       if(staffFound){
        switch(staffFound.Gender){
          case 0: 
          genderWiseData.Male+=1
          break;
          case 1: 
          genderWiseData.Female+=1;
        }
       }

      })
      this.availabilityData.StaffAvailability[key].GenderWiseData=genderWiseData
      let prodWiseGenderCount={}
      for (var prodIndex in this.availabilityData.StaffAvailability[key].ProductWiseStaff) {
        let prod=this.availabilityData.StaffAvailability[key].ProductWiseStaff[prodIndex]
        let staffGenderForProduct={
          Male:0,
          Female:0
        }
        prod.forEach(staff=>{
          
          let staffFound= this.availabilityData.Staff.find(f => f.StaffId === staff);
          if(staffFound){
           switch(staffFound.Gender){
             case 0: 
             staffGenderForProduct.Male+=1
             break;
             case 1: 
             staffGenderForProduct.Female+=1;
           }
          }
   
         })
         prodWiseGenderCount[prodIndex]=staffGenderForProduct
         
      }
      this.availabilityData.StaffAvailability[key].ProductWiseGender=prodWiseGenderCount
      console.log(this.availabilityData)

    }
  }
  disableBookingDate = (selectedDate: Date): boolean => {
    let today = moment().startOf("day");
    let selectedStart = moment(selectedDate);
    if (today.isBefore(selectedStart) || today.isSame(selectedStart)) {
      return false;
    }
    return true;
  }
  
  cancelModal(){
    this.showInstructions=false;
  }
  getInstructionsData(){
    this.InstructionsData='';
    if(this.InstructionsData==''){
      this.webapi.request(API.GET_BOOKING_INSTRUCTIONS,{Type:'AVAILABILITY'})
      .subscribe(
        data => {
          let InstructionsRawData = { ...data.body.Data };
          this.InstructionsData = InstructionsRawData.Text
          console.log(this.InstructionsData)
        },
        error => {
          console.log(error)
        }
      )
    }
   
  }
  onResize(event){
    this.windowHeight=window.innerHeight;
    this.setTableHeight();
  }
  setTableHeight(){
    if(this.windowHeight<899){
      this.tableHeight='51vh'
    }else if(this.windowHeight>=899 && this.windowHeight<1000){
      this.tableHeight='53vh'
    }
    else if(this.windowHeight>=1000 && this.windowHeight<1100){
      this.tableHeight='54vh'
    }
    else if(this.windowHeight>=1100 && this.windowHeight<1500){
      this.tableHeight='57vh'
    }
    else if(this.windowHeight>=1600 && this.windowHeight<1800){
      this.tableHeight='59vh'
    }
    else if(this.windowHeight>=1800 && this.windowHeight<2100){
      this.tableHeight='60vh'
    }
    else if(this.windowHeight>=2100){
      this.tableHeight='70vh'
    }
    else{
      this.tableHeight='50vh'
    }
    
  }
  subscribeChanges() {
  this.DateChanges = this.availabilityForm.get('Date').valueChanges.subscribe(val => {


  })
}


}
