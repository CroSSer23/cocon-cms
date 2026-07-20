import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { NgxImageCompressService } from 'ngx-image-compress';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import * as cloneDeep from "lodash/cloneDeep";
import { API } from '../shared/enums/apiNames.enum';
import {
faUnlock

} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-organisations',
  templateUrl: './organisations.component.html',
  styleUrls: ['./organisations.component.css']
})
export class OrganisationsComponent implements OnInit {
  orgTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }; pagesData: any[] };
  orgTablePageSizeOptions: number[];
  searchBoxValue: string;
  previousSearchValue: string;
  orgFormVisible: boolean = false;
  organisationForm: FormGroup;
  updateMode: boolean;
  imageCompressing: boolean;
  imageUploaded: boolean = false;
  uploadedImgUrl: string;
  DEFAULT_PAGE_SIZE:number=10
  loadingFlag: boolean;
  organisationData: any[]=[];
  organisationDataRaw: any;
  metadata: any;
  orgType: any;
  organisationLocationId: any;
  organisationId: any;
  showResetConfirmationAlert: boolean;
  confirmationCancelForm: boolean;
  faUnlock=faUnlock
  imagePath: any=null;
  profileImageCompressing: boolean;
  profileImageUploaded: boolean;
  uploadedProfImgUrl: string;
  imgUrl: any;
  imageModel: boolean;
  showAddAdminPopup: boolean;
  

  constructor(
    private fb: FormBuilder,
    private webapi: WebService,
    private imageCompress: NgxImageCompressService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
  ) {
    this.orgTablePageSizeOptions = [10, 20, 50, 100];
    this.orgTable = {
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
    
    this.organisationForm = this.fb.group({
      Name: [null, [Validators.required]],
      Type: [null, [Validators.required]],
      Street: [null],
      Email: [null, [Validators.required, CustomValidators.email]],
      Contact: [null, [Validators.required]],
      City: [null, [Validators.required]],
      Zip: [null, [Validators.required]],
      HouseNumber:[null],
      Floor:[null],
      Elevator:[0],
      ImagePath:[null],
      ProfileImagePath:[null],
      ContactNumber:[null,[ Validators.pattern(/^[\d\s()+-]+$/)]]

      
    });
    this.getMetadata();
    console.log(this.orgTable)
    this.getOrganisationList(false,{
      sort: {
        key: this.orgTable.sort.key,
        value: this.orgTable.sort.value,
      },
      filters: this.orgTable.activeFilters,
      pagination: {
        curPage: this.orgTable.pagination.curPage,
        size: this.orgTable.pagination.size,
      }
    })

   }

  ngOnInit() {
  }

  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchOrg("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchOrg("");
    }
  }

  searchOrg(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.orgTable.activeFilters = [];
    this.orgTable.sort = {
      key: "",
      value: ""
    }
    this.orgTable.pagination = {
      curPage: 1,
      itemCount: this.orgTable.pagination.itemCount,
      size: this.orgTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    this.getOrganisationList(false,{
      sort: {
        key: this.orgTable.sort.key,
        value: this.orgTable.sort.value,
      },
      filters: this.orgTable.activeFilters,
      pagination: {
        curPage: this.orgTable.pagination.curPage,
        size: this.orgTable.pagination.size,
      }
    })
  }
  changePageSize(event) {
    this.orgTable.pagination.curPage = 1;
    this.loadingFlag = true;
    this.getOrganisationList(false,{
      sort: {
        key: this.orgTable.sort.key,
        value: this.orgTable.sort.value,
      },
      filters: this.orgTable.activeFilters,
      pagination: {
        curPage: this.orgTable.pagination.curPage,
        size: event
      }
    })
  }

  openOrgForm(): void {
     this.resetFormData();
    // this.selectedCategories = [];
    // let blocks = this.weekForm.get('BlockTime') as FormArray;
    // while (blocks.length !== 0) {
    //   blocks.removeAt(0);
    // }
    this.orgFormVisible = true;
    
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
resetFormData(){
  this.organisationForm.reset();
    this.updateMode = false;
    this.organisationLocationId = undefined;
    this.organisationId =undefined;
    this.imageUploaded = false;
    this.uploadedImgUrl = undefined;
    this.updateMode = false;
    this.profileImageUploaded = false;
    this.uploadedProfImgUrl = undefined;
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
      this.resetUpdateFormData(this.organisationDataRaw)
    }else{
      this.resetFormData()
    }
    // this.showResetConfirmationAlert=false
  }
  resetUpdateFormData(data){
    this.organisationForm.reset();
    this.organisationForm.patchValue(data);
    this.uploadedImgUrl = data.ImageURL;
    this.imageUploaded = true;
    this.updateMode = true;
    this.organisationLocationId = data.OrganisationLocationId;
    this.organisationId = data.OrganisationId;
    this.organisationDataRaw = data;
    this.uploadedProfImgUrl= data.ProfImageURL;
    this.imageUploaded = true;
  }
  resetUpdateForm(data): void {
    if (this.organisationForm.pristine) {
      this.resetUpdateFormData(data)
      
    } else {
      this.showResetConfirmationAlert = true
    }
   
        
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

 
  saveOrganisationData(saveAdmin=false): void {
    this.spinner.show();
    if(this.uploadedImgUrl && this.uploadedProfImgUrl){
      Promise.all(
        [this.uploadImage(), this.uploadProfileImage()])
        .then(results => {
          
          this.saveOrganisation(saveAdmin);

        });
    }else if(this.uploadedImgUrl && !this.uploadedProfImgUrl){
      Promise.all(
        [this.uploadImage()])
        .then(results => {
          
          this.saveOrganisation(saveAdmin);

        });
    }
    else if(!this.uploadedImgUrl && this.uploadedProfImgUrl){
      Promise.all(
        [this.uploadProfileImage()])
        .then(results => {
          this.saveOrganisation(saveAdmin);
          

        });
    }else{
      this.saveOrganisation(saveAdmin);
    }
    // if (this.uploadedImgUrl) {
    //   let dataUrl = this.uploadedImgUrl.split("base64,");
    //   this.webapi.request("uploadImage", {
    //     Base: dataUrl[1]
    //   }).subscribe(
    //     data => {
    //       console.log(data)
    //       let response = data.body.Data;
    //       let imagePath = response.ImagePath;
    //       this.organisationForm.controls.ImagePath.setValue(imagePath);
    //       console.log(this.organisationForm.value);
    //       //if profile pic is there
    //       if (this.uploadedProfImgUrl) {
    //         let dataUrl = this.uploadedProfImgUrl.split("base64,");
    //         this.webapi.request("uploadImage", {
    //           Base: dataUrl[1]
    //         }).subscribe(
    //           data => {
    //             let response = data.body.Data;
    //             let imagePath = response.ImagePath;
    //             this.organisationForm.controls.ProfileImagePath.setValue(imagePath);
    //             console.log(this.organisationForm.value);
    //             this.saveOrganisation();
    //           },
    //           error => {
    //             this.spinner.hide();
    //             this.toast.error({
    //               title: "Error",
    //               msg: error.headers.get("message"),
    //               theme: 'bootstrap',
    //               timeout: 3000
    //             })
    //           }
    //         )
    //       } else {
    //       this.saveOrganisation();
    //       }
          
          
    //     },
    //     error => {
    //       this.spinner.hide();
    //       this.toast.error({
    //         title: "Error",
    //         msg: error.headers.get("message"),
    //         theme: 'bootstrap',
    //         timeout: 3000
    //       })
    //     }
    //   )
    // } else {
    //    //if profile pic is there
    //    if (this.uploadedProfImgUrl) {
    //     let dataUrl = this.uploadedProfImgUrl.split("base64,");
    //     this.webapi.request("uploadImage", {
    //       Base: dataUrl[1]
    //     }).subscribe(
    //       data => {
    //         let response = data.body.Data;
    //         let imagePath = response.ImagePath;
    //         this.organisationForm.controls.ProfileImagePath.setValue(imagePath);
    //         console.log(this.organisationForm.value);
    //         this.saveOrganisation();
    //       },
    //       error => {
    //         this.spinner.hide();
    //         this.toast.error({
    //           title: "Error",
    //           msg: error.headers.get("message"),
    //           theme: 'bootstrap',
    //           timeout: 3000
    //         })
    //       }
    //     )
    //   } else {
    //     this.saveOrganisation();
    //   }
      
    // }

  }

  getOrganisationList(showLoad = false,{
    sort,
    filters,
    pagination
  }): void {
    if (showLoad) {
      this.loadingFlag = true;
    }
    console.log(pagination)
    this.webapi.requestAnonymous(API.GET_ORGANISATION,{
      Search: this.searchBoxValue,
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
      AddCocon:false
    } )
      .subscribe(
        data => {
          this.organisationData = [...data.body.Data];
          
          this.organisationDataRaw = cloneDeep(this.organisationData);
         this.updatePagesData(data)
          if (this.loadingFlag) {
            this.loadingFlag = false;
          }
          // this.organisationData = [];
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
  updatePagesData(data) {
    this.setConstraints();
    this.orgTable.pagination.curPage = data.body.Pagination.Number;
    this.orgTable.pagination.size = data.body.Pagination.Size;
    this.orgTable.pagination.itemCount = data.body.TotalItems;
   
  
    

}

  fillEditOrganisation(data): void {
    console.log(data)
    this.openOrgForm();
    this.organisationForm.patchValue(data);
    this.uploadedImgUrl = data.ImageURL;
    this.uploadedProfImgUrl = data.ProfImageURL;
    this.imagePath = data.ImagePath;
    this.imageUploaded = true;
    this.profileImageUploaded = true;
    this.updateMode = true;
    this.organisationLocationId = data.OrganisationLocationId;
    this.organisationId = data.OrganisationId;
    
    this.organisationDataRaw = data;
  }

  deleteOrganisation(OrganisationLocationId): void {
    let obj = {
      OrganisationLocationId: OrganisationLocationId,
    }
    
    console.log(obj);
    this.loadingFlag = true;
    this.webapi.request(API.DELETE_ORGANISATION, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          console.log("saved")
          this.spinner.hide();
          this.getOrganisationList(false,{
            sort: {
              key: this.orgTable.sort.key,
              value: this.orgTable.sort.value,
            },
            filters: this.orgTable.activeFilters,
            pagination: {
              curPage: this.orgTable.pagination.curPage,
              size: this.orgTable.pagination.size,
            }
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
        this.toast.error({
          title: "Error",
          msg: error.headers.get("message"),
          theme: 'bootstrap',
          timeout: 3000
        })
        }
      )
  }

  getMetadata(): void {
    this.loadingFlag = true;
    this.webapi.request(API.METADATA, {
      Metadata: ["BusinessType"]
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          this.orgType=this.metadata["BusinessTypeData"]
        },
        error => {
          this.loadingFlag = false;
          var msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  
  setConstraints() {
    // let maxId = 0;
    this.organisationData.forEach(org => {
      // if (booking.BookingId > maxId) {
      //   maxId = booking.BookingId;
      // }
      
      org.Address = (org.Floor ? org.Floor + ", " : "") + (org.Street ? org.Street + ", " : "") + (org.HouseNumber ? org.HouseNumber + ", " : "") +(org.City ?  org.City+", "  : "") + (org.Zip ? org.Zip  : "");
     console.log(org.Address)
    });
    
    // this.bookingListCategories.forEach(tab => {
    //   tab.BookingsRaw = cloneDeep(tab.Bookings);
    // });
  }

  finalUpdate() {
    let obj = {
      OrganisationLocationId: this.organisationLocationId,
      OrganisationId: this.organisationId,
      ...this.organisationForm.value
    }
    console.log(obj)
    // return;
    this.webapi.request(API.UPDATE_ORGANISATION, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          console.log("saved")
          this.spinner.hide();
          this.getOrganisationList(false,{
            sort: {
              key: this.orgTable.sort.key,
              value: this.orgTable.sort.value,
            },
            filters: this.orgTable.activeFilters,
            pagination: {
              curPage: this.orgTable.pagination.curPage,
              size: this.orgTable.pagination.size,
            }
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

  saveOrganisation(saveAdmin=false){
    let obj={...this.organisationForm.value}
    obj.SaveAdmin=saveAdmin
    this.webapi.request(API.NEW_ORGANISATION, obj)
    .subscribe(
      data => {
        var msg = data.headers.get('message');
        console.log("saved")
        this.spinner.hide();
        this.getOrganisationList(false,{
          sort: {
            key: this.orgTable.sort.key,
            value: this.orgTable.sort.value,
          },
          filters: this.orgTable.activeFilters,
          pagination: {
            curPage: this.orgTable.pagination.curPage,
            size: this.orgTable.pagination.size,
          }
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

  updateOrganisation(): void {
    this.spinner.show();
    if(this.uploadedImgUrl !== this.organisationDataRaw.ImageURL && this.uploadedProfImgUrl !== this.organisationDataRaw.ProfImageURL){
      Promise.all(
        [this.uploadImage(), this.uploadProfileImage()])
        .then(results => {
          
          this.finalUpdate();

        });
    }else if(this.uploadedImgUrl !== this.organisationDataRaw.ImageURL && this.uploadedProfImgUrl == this.organisationDataRaw.ProfImageURL){
      Promise.all(
        [this.uploadImage()])
        .then(results => {
          
          this.finalUpdate();

        });
    }
    else if(this.uploadedImgUrl == this.organisationDataRaw.ImageURL && this.uploadedProfImgUrl !== this.organisationDataRaw.ProfImageURL){
      Promise.all(
        [this.uploadProfileImage()])
        .then(results => {
          this.finalUpdate();
          

        });
    }else{
      this.finalUpdate();
    }
    

  }
  updateOrganisation1(): void {
    this.spinner.show();
    if (this.uploadedImgUrl !== this.organisationDataRaw.ImageURL) {
      // need to upload the image and then submit category
      let dataUrl = this.uploadedImgUrl.split("base64,");
      this.webapi.request("uploadImage", {
        Base: dataUrl[1]
      }).subscribe(
        data => {
          let response = data.body.Data;
          let imagePath = response.ImagePath;
          this.organisationForm.controls.ImagePath.setValue(imagePath);
          console.log(this.organisationForm.value);
          if (this.uploadedProfImgUrl !== this.organisationDataRaw.ProfImageURL) {
            // need to upload the image and then submit category
            let dataUrl = this.uploadedProfImgUrl.split("base64,");
            this.webapi.request("uploadImage", {
              Base: dataUrl[1]
            }).subscribe(
              data => {
                let response = data.body.Data;
                let imagePath = response.ImagePath;
                this.organisationForm.controls.ProfileImagePath.setValue(imagePath);
                console.log(this.organisationForm.value);
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
  resetPassword(organisationLocationId){
    this.spinner.show();
    this.webapi.request(API.RESET_PASSWORD, {
      OrganisationLocationId:organisationLocationId 
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

  showImageModal(url): void {
    this.imgUrl = url;
    this.imageModel = true;
  }
  hideImageModal(): void {
    this.imgUrl = undefined;
    this.imageModel = false;
  }

  uploadImage() {
    return new Promise((resolve, reject) => {
      let dataUrl = this.uploadedImgUrl.split("base64,");
      this.webapi.request("uploadImage", {
        Base: dataUrl[1]
      }).subscribe(
        data => {
          console.log(data)
          let response = data.body.Data;
          let imagePath = response.ImagePath;
          this.organisationForm.controls.ImagePath.setValue(imagePath);
          console.log(this.organisationForm.value);
          resolve(true)
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            theme: 'bootstrap',
            timeout: 3000
          })
          reject(error.headers.get('message'),)
        }
     
        )
    })
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

  imageModalStyle = {
    "padding": "0px",
    "width": "fit-content",
    "overflow": "hidden"
  }
  changePageNumber(event) {
    this.loadingFlag = true;
    this.getOrganisationList(false,{
      sort: {
        key: this.orgTable.sort.key,
        value: this.orgTable.sort.value,
      },
      filters: this.orgTable.activeFilters,
      pagination: {
        curPage: event,
        size: this.orgTable.pagination.size
      }
    })
  }
  showAddAdminModal(){
    this.showAddAdminPopup=true
  }
  confirmSaveData(saveAdmin=false){
    this.saveOrganisationData(saveAdmin)
  }

}
