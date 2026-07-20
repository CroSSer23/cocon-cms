import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faTrashCan} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.css']
})

export class AvailabilityComponent implements OnInit {

  selectedValue='1'
  closeOrgForm:boolean
  resetOrganisationForm:boolean

  alltreatment = [ 
    {
      
      Name: 'Sweedish Massage',
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
      Name: '10m',
      DurationId:1
    },
    {
      Name: '15m',
      DurationId:2
    },
    {
      Name: '20m',
      DurationId:3
    },
    {
      Name: '30m',
      DurationId:4
    }
    ,
    {
      Name: '60m',
      DurationId:5
    }
    ,
    {
      Name: '90m',
      DurationId:6
    }
   
  ];

   availabilityForm:FormGroup;

  

  constructor(
    private fb: FormBuilder,
  ) { 
    console.log("ddd");
    this.availabilityForm=this.fb.group({
      BookingDate: [null,[Validators.required]],
      Products: this.fb.array([]) 
      
    })
    this.addProductControls();
   }
   get Products() {
    
    return this.availabilityForm.controls["Products"] as FormArray;
     
  }

  ngOnInit() {
  }

  

  pushProductControls() {
    console.log("called")
    return this.fb.group({
      SameTime: [null,[Validators.required]],
      ProductId: [null,[Validators.required]],
      Duration: [null,[Validators.required]],
      Preference: [null,[Validators.required]],
      })
     
  }

  addProductControls() {
    console.log("dd");
    let productArray = this.availabilityForm.get('Products') as FormArray;
    productArray.push(this.pushProductControls());
}

}
