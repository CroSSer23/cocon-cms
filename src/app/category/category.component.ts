import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { trigger, state, style, animate, transition } from "@angular/animations";
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import { ImageService } from '../shared/services/image.service';
import * as cloneDeep from "lodash/cloneDeep";
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgxImageCompressService } from 'ngx-image-compress';
import * as moment from "moment";

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
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
export class CategoryComponent implements OnInit {
  categoryData: any[];
  categoryDataRaw: any[];
  filterList: any[] = [];
  tableVisible: boolean = true;
  imgUrl: string;
  imageModel: boolean = false;
  formVisible: boolean = false;
  newCategoryForm: FormGroup;
  imageUploaded: boolean = false;
  bannerImage: any[];
  uploadedImgUrl: string;
  loadingFlag: boolean;
  sortName: string;
  sortValue: string;
  updateMode: boolean;
  categoryId: any;
  selectedView: string;
  views = [
    {
      value: "classic",
      label: "Classic"
    },
    {
      value: "cards",
      label: "Cards"
    }
  ]
  isSpinning: boolean;
  rawUpdateData: any;
  descChars: number;
  imageUploading: boolean;
  descSubs: any;
  imgResultBeforeCompress: string;
  imgResultAfterCompress: string;
  imageCompressing: boolean;
  currentPage: number=1;
  isRateFormOpen: boolean=false;
  isRateEdit: boolean=false;
  rateForm: FormGroup;
  TIME_FORMAT_HH_MM: string="HH:mm";  
  TIME_FORMAT_HH_MM_SS:string = "HH:mm:ss";
  selectedIndex: any;
  showInvalidRateMessage: boolean;
  startEndInvalid: boolean;

  constructor(
    private fb: FormBuilder,
    private webApi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private imageService: ImageService,
    private imageCompress: NgxImageCompressService
  ) {

    this.newCategoryForm = this.fb.group({
      Name: [null, [Validators.required]],
      Description: [null, [Validators.required]],
      ImagePath: [null],
      HourlyRate: this.fb.array([],[Validators.required]),
    });
    this.rateForm = this.fb.group({
      StartTime: [null, [Validators.required]],
      EndTime: [null, [Validators.required]],
      MondayRate: [null, [Validators.required]],
      TuesdayRate: [null, [Validators.required]],
      WednesdayRate: [null, [Validators.required]],
      ThursdayRate: [null, [Validators.required]],
      FridayRate: [null, [Validators.required]],
      SaturdayRate: [null, [Validators.required]],
      SundayRate: [null, [Validators.required]],
      Index: [null],
      
    });
    this.categoryData = [];
    this.getCategoryList();
  }

  ngOnInit() { }

  getCategoryList(showLoad = false): void {
    if (showLoad) {
      this.loadingFlag = true;
    }
    this.webApi.requestAnonymous('getCategory', null)
      .subscribe(
        data => {
          this.categoryData = [...data.body.Data];
          console.log(this.categoryData)
          this.setConstraints();
          this.categoryDataRaw = cloneDeep(this.categoryData);
          this.selectedView = "classic";
          if (this.loadingFlag) {
            this.loadingFlag = false;
          }
        },
        error => {
          this.loadingFlag = false;
          // this.spinner.hide();
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

  refreshList() {
    this.getCategoryList();
  }
  onPageChange(event){
    this.currentPage=event
  }
  reorder(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex, event.currentIndex)
    if(this.currentPage==1){
      moveItemInArray(this.categoryData, event.previousIndex, event.currentIndex);
    }else{
      let previousIndex=(10*(this.currentPage-1))+event.previousIndex
      let currentIndex=(10*(this.currentPage-1))+event.currentIndex
      console.log(previousIndex, currentIndex)
      moveItemInArray(this.categoryData, previousIndex, currentIndex);
    }
    moveItemInArray(this.categoryData, event.previousIndex, event.currentIndex);
    let obj = {
      Type: "Category",
      Order: []
    }
    this.categoryData.forEach(element => {
      obj.Order.push(element.CategoryId);
    });
    this.webApi.request("reorderCatalog", obj)
      .subscribe(
        data => {
          this.getCategoryList(true);
        },
        error => {
          this.toast.error({
            title: error.headers.get('message'),
            msg: "",
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }

  // Used to search for input value
  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.categoryDataRaw.filter((d) => {
        if (
          (d.Name && d.Name.toLowerCase().indexOf(val) !== -1) ||
          (d.Description && d.Description.toLowerCase().indexOf(val) !== -1)
        ) {
          return d;
        }
      });
      this.categoryData = temp;
      this.categoryData = [...this.categoryData];
      this.loadingFlag = false;
    }
    else {
      this.categoryData = [...this.categoryDataRaw];
    }
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    if (this.sortName) {
      const data = this.categoryData.sort((a, b) =>
        this.sortValue === "ascend"
          ? a[this.sortName] > b[this.sortName]
            ? 1
            : -1
          : b[this.sortName] > a[this.sortName]
            ? 1
            : -1
      );
      this.categoryData = [...data];
    }
  }

  changeFilter(selectedFilters: any[]): void {
    if (selectedFilters.length === 0) {
      this.categoryData = [...this.categoryDataRaw];
    } else {
      let temp = this.categoryDataRaw.filter(f => {
        var found = selectedFilters.find(fi => f.CategoryId === fi);
        if (found) {
          return true;
        } else {
          return false;
        }
      })
      this.categoryData = [...temp];
    }
  }

  setConstraints() {
    this.filterList = [];
    this.categoryData.forEach(element => {
      element.ImageURL = this.imageService.getImageUrl(element.ImagePath);
      this.filterList.push({
        text: element.Name,
        value: element.CategoryId,
        byDefault: false
      })
    });
  }

  changeView(event): void {
    this.tableVisible = !this.tableVisible;
  }

  openCategory(): void {
    this.resetCategoryForm();
    this.tableVisible = true;
    this.formVisible = true;
    this.descChars = 150;
    this.descSubs = this.newCategoryForm.get("Description").valueChanges.subscribe(val => {
      if (val) {
        this.descChars = 150 - val.length
      }
    });
    let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
    
  }

  closeCategory(): void {
    this.selectedView === "classic" ? this.tableVisible = true : this.tableVisible = false;
    this.formVisible = false;
    this.resetCategoryForm();
  }

  showImageModal(url): void {
    this.imgUrl = url;
    this.imageModel = true;
  }

  hideImageModal(): void {
    this.imgUrl = undefined;
    this.imageModel = false;
  }

  beforeUpload = (file: any): boolean => {
    // console.log(file.originFileObj)
    // this.bannerImage = [...[]];
    // this.bannerImage.push(file);
    // this.imageUploading = true;
    // this.handleUpload();
    return false;
  }

  compressImage() {
    this.imageCompress.uploadFile().then(({ image, orientation }) => {
      this.imageCompressing = true;
      this.imageCompress.compressFile(image, orientation, 50, 90).then(
        result => {
          this.imageUploaded = true;
          this.imageCompressing = false;
          this.uploadedImgUrl = result;
        }
      );
    });
  }

  async handleUpload() {
    const file = this.bannerImage[0];
    if (file) {
      let name = new Date();
      let filename = name.getMonth() + "" + name.getDate() + "" + name.getFullYear() + "_" + name.getTime();
      console.log(file);
      // let fileKey = await this.imageService.uploadImage(file, filename);
      // if (fileKey) {
      //   this.newCategoryForm.controls.ImagePath.setValue(fileKey);
      //   this.imageUploaded = true;
      //   this.imageUploading = false;
      //   this.uploadedImgUrl = this.imageService.getImageUrl(fileKey);
      // }
    }
  }


  resetCategoryForm(): void {
    this.newCategoryForm.reset();
    this.bannerImage = [];
    this.imageUploaded = false;
    this.uploadedImgUrl = undefined;
    this.updateMode = false;
    this.categoryId = undefined;
    this.descChars = 150;
    const items = this.newCategoryForm.get('HourlyRate') as FormArray;
    items.clear(); // This will reset the form array
  }

  resetUpdateForm(): void {
    this.newCategoryForm.patchValue(this.rawUpdateData);
    this.uploadedImgUrl = (this.rawUpdateData.ImagePath==null?null:this.rawUpdateData.ImageURL);;
    const items = this.newCategoryForm.get('HourlyRate') as FormArray;
    items.clear(); // This will reset the form array
    let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
    if(this.rawUpdateData.HourlyRate.length){
      this.rawUpdateData.HourlyRate.forEach(element => {
        rateArray.push(this.pushRateControls(element));
      })
    }
  }

  submitCategory(): void {
    console.log(this.newCategoryForm.value);
   
    this.spinner.show();
    if(this.uploadedImgUrl){
      let dataUrl = this.uploadedImgUrl.split("base64,");
      this.webApi.request("uploadImage", {
        Base: dataUrl[1]
      }).subscribe(
        data => {
          console.log(data)
          let response = data.body.Data;
          let imagePath = response.ImagePath;
          this.newCategoryForm.controls.ImagePath.setValue(imagePath);
          
          this.saveCategory()
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
    }else{
      this.saveCategory()
    }
    
    
  }

  saveCategory(): void {
    let obj={...this.newCategoryForm.value}
   obj.HourlyRate.forEach(rate => {
    rate.StartTime= moment(rate.StartTime).format(this.TIME_FORMAT_HH_MM)
    rate.EndTime=moment(rate.EndTime).format(this.TIME_FORMAT_HH_MM)
    });
    
console.log(obj)
    this.webApi.request("newCategory", obj)
          .subscribe(
            data => {
              // this.categoryData = [...data.body.Data];
              // this.setConstraints();
              // this.categoryDataRaw = cloneDeep(this.categoryData);
              this.getCategoryList();
              this.spinner.hide();
              this.toast.success({
                title: "Success",
                msg: "Category added successfully",
                theme: "bootstrap",
                timeout: 2000
              })
              this.closeCategory();
            },
            error => {
              this.spinner.hide();
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
  fillEditCategory(data): void {
    this.openCategory();
    this.newCategoryForm.patchValue(data);
    this.uploadedImgUrl = (data.ImagePath==null?null:data.ImageURL);
    this.imageUploaded = true;
    this.updateMode = true;
    this.categoryId = data.CategoryId;
    this.rawUpdateData = data;
    let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
    if(data.HourlyRate.length){
      data.HourlyRate.forEach(element => {
        rateArray.push(this.pushRateControls(element));
      })
    }
  }

  updateCategory(): void {
    this.spinner.show();
    if (this.uploadedImgUrl !== this.rawUpdateData.ImageURL && this.uploadedImgUrl) {
      // need to upload the image and then submit category
      let dataUrl = this.uploadedImgUrl.split("base64,");
      this.webApi.request("uploadImage", {
        Base: dataUrl[1]
      }).subscribe(
        data => {
          let response = data.body.Data;
          let imagePath = response.ImagePath;
          this.newCategoryForm.controls.ImagePath.setValue(imagePath);
          this.finalUpdate();
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
    } else {
      this.finalUpdate();
    }
  }

  finalUpdate() {
    let obj = {
      CategoryId: this.categoryId,
      ...this.newCategoryForm.value
    }
    console.log(obj)
    obj.HourlyRate.forEach(rate => {
      let isStartTimeFormatted = moment(rate.StartTime, this.TIME_FORMAT_HH_MM, true).isValid();
      let isEndTimeFormatted = moment(rate.EndTime, this.TIME_FORMAT_HH_MM, true).isValid();
      console.log(isStartTimeFormatted)
      console.log(isEndTimeFormatted)
      if(isStartTimeFormatted){
        rate.StartTime= moment(rate.StartTime).format(this.TIME_FORMAT_HH_MM)
      }
      if(isEndTimeFormatted){
        rate.EndTime=moment(rate.EndTime).format(this.TIME_FORMAT_HH_MM)
      }
      

      });
    this.webApi.request('updateCategory', obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          // this.categoryData = [...data.body.Data];
          // this.setConstraints();
          // this.categoryDataRaw = cloneDeep(this.categoryData);
          this.getCategoryList();
          this.spinner.hide();
          this.toast.success({
            title: "Success",
            msg,
            theme: "bootstrap",
            timeout: 2000
          })
          this.closeCategory();
        },
        error => {
          this.spinner.hide();
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

  cardViewStyle = {
    "padding": "0px"
  }

  imageModalStyle = {
    "padding": "0px",
    "width": "fit-content",
    "overflow": "hidden"
  }
  openRateForm(){
    this.isRateFormOpen=true;
  }
  saveRate(){
   let index=null
   index= this.rateForm.controls.Index.value;
   console.log(index)
   let isStartEndValid=this.validateRateStartEnd(this.rateForm.value)
   if(isStartEndValid){
    let isRateValid=this.validateRate(this.rateForm.value,index);
   console.log("isRateValid",isRateValid)
   if(isRateValid){
    if(index==null){
      let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
      rateArray.push(this.pushRateControls(this.rateForm.value));
    }else{
     
      console.log("else")
      let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
      const controls = rateArray.at(index) as FormGroup;
      controls.patchValue(this.rateForm.value);
      
    
    }
    
    this.closeRateForm()
    
    this.resetRateForm()
    this.showInvalidRateMessage=false;
   
   }else{
    this.showInvalidRateMessage=true;
    

   }

   }else{
    
    this.startEndInvalid=true;

   }
   
    
  }
  closeRateForm(){
    this.isRateFormOpen=false
    this.isRateEdit=false
  }
  resetRateForm(){
    if(this.isRateEdit==true){
      this.editRate(this.selectedIndex)
    }else{
      this.rateForm.reset()
    }
    this.showInvalidRateMessage=false;
    this.startEndInvalid=false;
  }
  pushRateControls(obj=null){
    if(obj){
      return this.fb.group({
        StartTime:obj.StartTime,
        EndTime: obj.EndTime,
        MondayRate: obj.MondayRate,
        TuesdayRate: obj.TuesdayRate,
        WednesdayRate: obj.WednesdayRate,
        ThursdayRate: obj.ThursdayRate,
        FridayRate: obj.FridayRate,
        SaturdayRate:obj.SaturdayRate,
        SundayRate: obj.SundayRate,
        Index: null,
      })
    }else{
      return this.fb.group({
        StartTime: [null, [Validators.required]],
        EndTime: [null, [Validators.required]],
        MondayRate: [null, [Validators.required]],
        TuesdayRate: [null, [Validators.required]],
        WednesdayRate: [null, [Validators.required]],
        ThursdayRate: [null, [Validators.required]],
        FridayRate: [null, [Validators.required]],
        SaturdayRate: [null, [Validators.required]],
        SundayRate: [null, [Validators.required]],
        Index: [null],
      })
    }
    
  }
  editRate(index){
    this.selectedIndex=index
    if(index!=null){
      let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
      let rateControls = rateArray.controls
      
      let obj={
        StartTime: moment(rateControls[index].get('StartTime').value, this.TIME_FORMAT_HH_MM).toDate(),
        EndTime:   moment(rateControls[index].get('EndTime').value, this.TIME_FORMAT_HH_MM).toDate(),
        MondayRate: `${rateControls[index].get('MondayRate').value}`,
        TuesdayRate: `${rateControls[index].get('TuesdayRate').value}`,
        WednesdayRate:`${rateControls[index].get('WednesdayRate').value}`,
        ThursdayRate: `${rateControls[index].get('ThursdayRate').value}`,
        FridayRate: `${rateControls[index].get('FridayRate').value}`,
        SaturdayRate:`${rateControls[index].get('SaturdayRate').value}`,
        SundayRate: `${rateControls[index].get('SundayRate').value}`,
        Index: index,

    }
    this.rateForm.patchValue(obj)
    this.openRateForm();
    this.isRateEdit=true
    
  }
}
 deleteRate(index){
  const formArray = this.newCategoryForm.get('HourlyRate') as FormArray;
  formArray.removeAt(index);

 }
 formatDate(date){
  
  const isAlreadyFormatted = moment(date, this.TIME_FORMAT_HH_MM_SS, true).isValid();
  if (isAlreadyFormatted) {
    // Date is already in 'hh:mm' format
    const time = moment(date, 'HH:mm:ss');
    return moment( time).format(this.TIME_FORMAT_HH_MM) 
    return date
  } else {
    // Date is not in 'hh:mm' format, format it
    return moment( date).format(this.TIME_FORMAT_HH_MM) 
  }
 
 }
  validateRate(obj,rateIndex) {
    let rateArray = this.newCategoryForm.get('HourlyRate') as FormArray;
    let rateControls = rateArray.controls
    let checkStart = moment(moment(obj.StartTime).format(this.TIME_FORMAT_HH_MM),this.TIME_FORMAT_HH_MM)
    let checkEnd = moment(moment(obj.EndTime).format(this.TIME_FORMAT_HH_MM),this.TIME_FORMAT_HH_MM)
    let isValid=true
    // check if start and end is valid
    if(checkStart.isSameOrAfter(checkEnd)){
      this.startEndInvalid=true
    }
    rateControls.forEach((element, index) => {
      let startTocheck = moment(element.get('StartTime').value, this.TIME_FORMAT_HH_MM)
      let endToCheck = moment(element.get('EndTime').value, this.TIME_FORMAT_HH_MM)

      // Check if Start time is overlapping
      if(checkStart.isAfter(startTocheck) && checkStart.isBefore(endToCheck) && rateIndex!=index) {
      //  start time is overlapping
      isValid= false;
      return false
      }
      // Check if Start time is overlapping
      if(startTocheck.isAfter(checkStart) && startTocheck.isBefore(checkEnd) && rateIndex!=index) {
        //  start time is overlapping
        isValid= false;
        return false
        }
      // Check if end time is overlapping
      if(checkEnd.isAfter(startTocheck) && checkEnd.isBefore(endToCheck) && rateIndex!=index) {
        //  end time  is overlapping
        isValid= false;
        return false
        }
        // Check if Start time is overlapping
      if(endToCheck.isAfter(checkStart) && endToCheck.isBefore(checkEnd) && rateIndex!=index) {
        //  start time is overlapping
        isValid= false;
        return false
        }
    })
    return isValid
  }
  validateRateStartEnd(obj) {
    
    let checkStart = moment(moment(obj.StartTime).format(this.TIME_FORMAT_HH_MM),this.TIME_FORMAT_HH_MM)
    let checkEnd = moment(moment(obj.EndTime).format(this.TIME_FORMAT_HH_MM),this.TIME_FORMAT_HH_MM)
    let isValid=true
    // check if start and end is valid
    if(checkStart.isSameOrAfter(checkEnd)){
      isValid= false;
      
    }
    return isValid
  }
}