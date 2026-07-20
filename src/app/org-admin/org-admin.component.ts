import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import * as cloneDeep from "lodash/cloneDeep";
import * as lodash from 'lodash';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver';
import * as moment from "moment";
import * as momentz from "moment-timezone";
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from "@angular/animations";

import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { GooglePlaceDirective } from "node_modules/ngx-google-places-autocomplete/ngx-google-places-autocomplete.directive";
import { CookieService } from 'ngx-cookie-service';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ZoneService } from '../shared/services/zone.service';
import { timingSafeEqual } from 'crypto';
import { TableService } from '../shared/services/table.service';
import { BookingService } from '../shared/services/booking.service';
import { CalendarService } from '../shared/services/calendar.service';
import { API } from '../shared/enums/apiNames.enum';
import { NgxImageCompressService } from 'ngx-image-compress';
import {
  faUnlock
  
  } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-org-admin',
  templateUrl: './org-admin.component.html',
  styleUrls: ['./org-admin.component.css']
})
export class OrgAdminComponent implements OnInit {
  sort: {
    key: string,
    value: string
  }
  pagination: {
    curPage: number,
    size: number,
    itemCount: number
  }
  adminTablePageSizeOptions: number[];
  DEFAULT_PAGE_SIZE: number=10;
  isLoading: boolean;
  searchBox1Value: any;
  orgAdminData: any[];
  adminTable: any;
  orgFormVisible: boolean;
  orgFilterList: any[];
  organisationForm: any;
  profileImageCompressing: boolean;
  profileImageUploaded: boolean;
  uploadedProfImgUrl: any;
  updateMode: boolean;
  searchBoxValue: any;
  previousSearchValue: any;
  selectedOrganisation: null;
  rawUpdateData: any;
  updateAdminId: any;
  organisationLocationId: any;
  organisationAdminDataRaw: any;
  imgUrl: any;
  imageModel: boolean;
  AdminId: any;
  confirmationCancelForm: boolean;
  showResetConfirmationAlert: boolean;
  loadingFlag: boolean;
  faUnlock=faUnlock
  imageModalStyle = {
    "padding": "0px",
    "width": "fit-content",
    "overflow": "hidden"
  }
  

  constructor( 
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private route: ActivatedRoute,
    private calendarService: CalendarService,
    private fb: FormBuilder,
    private imageCompress: NgxImageCompressService,
    ) { 
      this.organisationForm = this.fb.group({
        Name: [null, [Validators.required]],
        Email: [null, [Validators.required,CustomValidators.email]],
        Contact: [null, [Validators.required]],
        OrganisationLocationId: [null, [Validators.required]],
        ProfileImagePath:[null,{}]
    });
   
    
  }

  ngOnInit() {
    this.adminTablePageSizeOptions = [10, 20, 50, 100];
    this.pagination = {
      curPage: 1,
      size: this.DEFAULT_PAGE_SIZE,
      itemCount: 0
    }
    this.sort = {
      key: "",
      value: "",
    }
    this.adminTable = {
      sort: {
        key: "",
        value: ""
      },
      activeFilters: [],
      pagination: {
        curPage: 1,
        size: this.DEFAULT_PAGE_SIZE,
        itemCount: this.DEFAULT_PAGE_SIZE
      },
      pagesData: [{
        pageNum: 1,
        data: [],
        lastUpdated: null
      }]
    }
    this.getOrganisationList()
    this.getAdminList({
      sort: {
        key: "",
        value: "",
      },
      filters: [],
      pagination: {
        curPage: 1,
        size: this.DEFAULT_PAGE_SIZE
      }
    })

   
  }

  getAdminList({

    sort,
    filters,
    pagination,
    OrganisationLocationId=null
  }, callbackFn: any = null): void {

    this.isLoading = true
    this.webapi.request(API.GET_ADMIN, {
      Search: this.searchBoxValue ? this.searchBoxValue.trim() : "",
      Sort: {
        Key: sort.key,
        Value: sort.value
      },
      Filters: filters.map(fil => {
        return {
          Key: fil.key,
          Values: fil.values
        }
      }),
      Pagination: {
        Number: pagination.curPage,
        Size: pagination.size
      },
      CurrentIds: [],
      LastUpdated: '',
      OrganisationLocationId: OrganisationLocationId
    }).subscribe(
      data => {
        console.log(data)
        this.isLoading = false
        this.orgAdminData = [...data.body.Data]
        this.updatePagesData(data)
        // this.setConstraints({
        //   bookings: [...data.body.Data],
        // });
      },
      error => {
        this.isLoading = false
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
  updatePagesData(data) {
    let adminData = [...data.body.Data];
    
    this.adminTable.pagination.curPage = data.body.Pagination.Number;
    this.adminTable.pagination.size = data.body.Pagination.Size;
    this.adminTable.pagination.itemCount = data.body.TotalItems;
    

}

changePageNumber(event) {
  console.log(this.adminTable)
  this.getAdminList({
    sort: {
      key: this.adminTable.sort.key,
      value: this.adminTable.sort.value,
    },
    filters: this.adminTable.activeFilters,
    pagination: {
      curPage: event,
      size: this.adminTable.pagination.size
    },
    OrganisationLocationId:this.selectedOrganisation
  })
}

changePageSize(event) {
  this.adminTable.pagination.curPage = 1;
  this.isLoading = true;
  this.getAdminList({
    sort: {
      key: this.adminTable.sort.key,
      value: this.adminTable.sort.value,
    },
    filters: this.adminTable.activeFilters,
    pagination: {
      curPage: this.adminTable.pagination.curPage,
      size: event
    },
    OrganisationLocationId:this.selectedOrganisation
  })
}

// Sort the table according to given key.
sortList(sort: { key: string; value: string }): void {
  let { key, value } = sort;
  if (key) {
    // currentTab.activeFilters = [];
    this.adminTable.sort = {
      key,
      value: value === "ascend" ? "ascending" : "descending",
    }
    if (value === null) {
      this.adminTable.sort = {
        key: "",
        value: ""
      }
    }
    this.adminTable.pagination.curPage = 1;
    this.adminTable.pagination.itemCount = 0;
    this.getAdminList({
      sort: this.adminTable.sort,
      filters: this.adminTable.activeFilters,
      pagination: this.adminTable.pagination,
      OrganisationLocationId:this.selectedOrganisation
    })
  }
}

openAdminForm(): void {
  // this.resetFormData();
 // this.selectedCategories = [];
 // let blocks = this.weekForm.get('BlockTime') as FormArray;
 // while (blocks.length !== 0) {
 //   blocks.removeAt(0);
 // }
 this.orgFormVisible = true;
 
}
getOrganisationList(){
  this.calendarService.getOrganisationList(false).then(results => {

    let organisationList = this.calendarService.organisationList
    this.orgFilterList=[...organisationList]
    
    this.sortOrganisationList()
    console.log(this.orgFilterList)
  });
}
sortOrganisationList(): void {
 
  this.orgFilterList.sort((a, b) => {
    if (a.OrganisationLocationId === -1 ) {
      return -1; // Keep the object with the 'keepOnTop' name at the beginning
    } else if (b.OrganisationLocationId === -1) {
      return 1; // Move the 'keepOnTop' object to the beginning
    } else {
      return a.Name.localeCompare(b.Name); // Sort the remaining objects by name
    }
  });
}

disableSubmit() {
  if (!this.organisationForm.valid) {
    return true;
  }
  let rateNotInserted = false;
 
  // const notOneWorking = this.weekSchedule.every(f => !f.IsWorking);
  // if (notOneWorking) {
  //   return true;
  // }
  
  return rateNotInserted;
}

compressProfileImage() {
  this.imageCompress.uploadFile().then(({ image, orientation }) => {
    this.profileImageCompressing = true;
    this.imageCompress.compressFile(image, orientation, 50, 90).then(
      result => {
        this.profileImageUploaded = true;
        this.profileImageCompressing = false;
        this.uploadedProfImgUrl = result;
      }
    );
  });
}

saveAdminData(): void {
  this.spinner.show();
  if(this.uploadedProfImgUrl){
    Promise.all(
      [this.uploadProfileImage()])
      .then(results => {
        
        this.saveAdmin();

      });
}else{
    this.saveAdmin();
  }
  

}
uploadProfileImage() {
  return new Promise((resolve, reject) => {
    let dataUrl = this.uploadedProfImgUrl.split("base64,");
      this.webapi.request("uploadImage", {
        Base: dataUrl[1]
      }).subscribe(
        data => {
          let response = data.body.Data;
          let imagePath = response.ImagePath;
          console.log(response)
          this.organisationForm.controls.ProfileImagePath.setValue(imagePath);
          console.log(this.organisationForm.value);
          resolve(true)
        },
        error => {
          this.spinner.hide();
          reject(error.headers.get('message'),)
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  })
}

saveAdmin(){
  this.webapi.request(API.NEW_ADMIN, this.organisationForm.value)
  .subscribe(
    data => {
      var msg = data.headers.get('message');
      console.log("saved")
      this.spinner.hide();
      this.getAdminList({
        sort: {
          key: "",
          value: "",
        },
        filters: [],
        pagination: {
          curPage: 1,
          size: this.DEFAULT_PAGE_SIZE
        },
        OrganisationLocationId:this.selectedOrganisation
      })
      this.resetFormData();
      this.orgFormVisible = false;
      this.toast.success({
        title: "Success",
        msg,
        theme: "bootstrap",
        timeout: 2000
      })
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

resetFormData(){
  this.organisationForm.reset();
    this.updateMode = false;
    this.profileImageUploaded = false;
    this.uploadedProfImgUrl = undefined;
}
 // Used to search for input value
 onKeyUp(): void {
  if (this.searchBoxValue !== this.previousSearchValue) {
    this.searchOrgAdmin("");
  }
}
searchOrgAdmin(value: string): void {
  if (this.searchBoxValue === this.previousSearchValue) {
    return;
  }
  this.previousSearchValue = this.searchBoxValue;
  this.adminTable.activeFilters = [];
  this.adminTable.sort = {
    key: "",
    value: ""
  }
  this.adminTable.pagination = {
    curPage: 1,
    itemCount: this.adminTable.pagination.itemCount,
    size: this.adminTable.pagination.size
  }
  let val: string;
  val = value.toLowerCase();
  this.getAdminList({
    sort: {
      key: this.adminTable.sort.key,
      value: this.adminTable.sort.value,
    },
    filters: this.adminTable.activeFilters,
    pagination: {
      curPage: this.adminTable.pagination.curPage,
      size: this.adminTable.pagination.size
    },
    OrganisationLocationId:this.selectedOrganisation
  })
}

resetSearch(): void {
  this.searchBoxValue = "";
  if (this.searchBoxValue !== this.previousSearchValue) {
    this.searchOrgAdmin("");
  }
}
changeOrganisation(selectedOrg) {
  if(selectedOrg){
    this.getAdminList({
      sort: {
        key: this.adminTable.sort.key,
        value: this.adminTable.sort.value,
      },
      filters: this.adminTable.activeFilters,
      pagination: {
        curPage: this.adminTable.pagination.curPage,
        size: this.adminTable.pagination.size
      },
      OrganisationLocationId:selectedOrg
    })
  }else{
    this.getAdminList({
      sort: {
        key: this.adminTable.sort.key,
        value: this.adminTable.sort.value,
      },
      filters: this.adminTable.activeFilters,
      pagination: {
        curPage: this.adminTable.pagination.curPage,
        size: this.adminTable.pagination.size
      }
    })
  }
  
}

clearSelectedOrg(i){
  this.selectedOrganisation=null
  this.getAdminList({
    sort: {
      key: this.adminTable.sort.key,
      value: this.adminTable.sort.value,
    },
    filters: this.adminTable.activeFilters,
    pagination: {
      curPage: this.adminTable.pagination.curPage,
      size: this.adminTable.pagination.size
    },
    OrganisationLocationId:this.selectedOrganisation
  })
   
  
  }
  fillEditForm(data): void {
    console.log(data)
    this.openAdminForm();
    this.organisationForm.patchValue(data);
    this.uploadedProfImgUrl = data.ProfImageURL;
    this.profileImageUploaded = true;
    this.updateMode = true;
    this.organisationLocationId = data.OrganisationLocationId;
    this.AdminId = data.AdminId;
    
    this.organisationAdminDataRaw = data;
  }

  showImageModal(url): void {
    this.imgUrl = url;
    this.imageModel = true;
  }
  hideImageModal(): void {
    this.imgUrl = undefined;
    this.imageModel = false;
  }
  updateAdmin(): void {
    this.spinner.show();
    if(this.uploadedProfImgUrl !== this.organisationAdminDataRaw.ProfImageURL){
      Promise.all(
        [ this.uploadProfileImage()])
        .then(results => {
          
          this.finalUpdate();

        });
    }
    else if(this.uploadedProfImgUrl !== this.organisationAdminDataRaw.ProfImageURL){
      Promise.all(
        [this.uploadProfileImage()])
        .then(results => {
          this.finalUpdate();
          

        });
    }else{
      this.finalUpdate();
    }
    

  }
  finalUpdate() {
    let obj = {
      UpdateAdminId:this.AdminId,
      ...this.organisationForm.value
    }
    console.log(obj)
    // return;
    this.webapi.request(API.UPDATE_ADMIN, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          console.log("saved")
          this.spinner.hide();
          this.getAdminList({
            sort: {
              key: this.adminTable.sort.key,
              value: this.adminTable.sort.value,
            },
            filters: this.adminTable.activeFilters,
            pagination: {
              curPage: this.adminTable.pagination.curPage,
              size: this.adminTable.pagination.size
            },
            OrganisationLocationId:this.selectedOrganisation
          })
          this.resetFormData();
          this.orgFormVisible = false;
          this.toast.success({
            title: "Success",
            msg,
            theme: "bootstrap",
            timeout: 2000
          })
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
  closeOrgForm(): void {
   
  
   
    if(this.organisationForm.pristine) {
      this.resetFormData()
      this.orgFormVisible = false;
   }else{
    this.confirmationCancelForm = true
   }
    
  }
  cancelFormCancel(){
    this.confirmationCancelForm = false
  }
  cancelConfirm(){
    this.resetFormData()
      this.orgFormVisible = false;
      this.confirmationCancelForm = false
  }
  resetOrganisationForm(): void {
    if (this.organisationForm.pristine) {

      this.resetFormData()
    } else {
      this.showResetConfirmationAlert = true
    }



  }
  resetFormConfirm(){
    if(this.updateMode){
      this.resetUpdateFormData(this.organisationAdminDataRaw)
    }else{
      this.resetFormData()
    }
    // this.showResetConfirmationAlert=false
  }
  resetUpdateFormData(data){
    this.organisationForm.reset();
    this.organisationForm.patchValue(data);
    console.log("here")
    this.updateMode = true;
    this.organisationLocationId = data.OrganisationLocationId;
    console.log("herew")
  
    this.organisationAdminDataRaw = data;
    this.uploadedProfImgUrl= data.ProfImageURL;
    console.log("here2")
    
  }
  resetUpdateForm(data): void {
    if (this.organisationForm.pristine) {
      this.resetUpdateFormData(data)
      
    } else {
      this.showResetConfirmationAlert = true
    }
   
        
  }


  deleteAdmin(AdminId): void {
    this.loadingFlag = true;
    this.spinner.show();
    let obj = {
      DeleteAdminId: AdminId,
    }
    
    console.log(obj);
    
    this.webapi.request(API.DELETE_ADMIN, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          console.log("saved")
          this.spinner.hide();
          this.loadingFlag = false;
          this.getAdminList({
            sort: {
              key: this.adminTable.sort.key,
              value: this.adminTable.sort.value,
            },
            filters: this.adminTable.activeFilters,
            pagination: {
              curPage: this.adminTable.pagination.curPage
            },
            OrganisationLocationId:this.selectedOrganisation
          })
          this.resetFormData();
          this.orgFormVisible = false;
          this.toast.success({
            title: "Success",
            msg,
            theme: "bootstrap",
            timeout: 2000
          })
        },
        error => {
          this.spinner.hide();
          this.loadingFlag = false;
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          theme: 'bootstrap',
          timeout: 3000
        })
        }
      )
  }

  resetPassword(AdminId){
    this.spinner.show();
    this.webapi.request(API.RESET_PASSWORD, {
      ResetPasswordAdminId:AdminId 
    })
    .subscribe(
      data => {
        var msg = data.headers.get('message');
        console.log("saved")
        this.spinner.hide();
        this.toast.success({
          title: "Success",
          msg,
          theme: "bootstrap",
          timeout: 2000
        })
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




}
