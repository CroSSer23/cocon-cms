import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import { FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import * as cloneDeep from "lodash/cloneDeep";
import { CustomValidators } from 'ng2-validation';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from 'moment';
import { TableService } from '../shared/services/table.service';
import { StaffService } from '../shared/services/staff.service';
import { API } from '../shared/enums/apiNames.enum';
import { CalendarService } from '../shared/services/calendar.service';


@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css'],
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
export class StaffComponent implements OnInit {
  isSpinning: boolean;
  metadata: any;
  categoryList: any[];
  staffData: any[];
  staffDataRaw: any[];
  staffForm: FormGroup;
  loadingFlag: boolean;
  staffFormVisible: boolean = false;
  sortName: string;
  sortValue: string;
  categoryFilterList: any[];
  editBlockId: any;
  genderList = [
    {
      Id: 0,
      Name: "Male",
      text: "Male",
      value: 0,
      byDefault: false
    },
    {
      Id: 1,
      Name: "Female",
      text: "Female",
      value: 1,
      byDefault: false
    }
  ]
  updateMode: boolean;
  genderSelected: any;
  rawUpdateData: any;
  checkedData: number[];
  anyChecked: boolean;
  allChecked: boolean;
  workingDaysCheckbox: { label: string; value: string; }[];
  staffDetail: any;
  scheduleDrawerVisible: boolean;
  weekForm: FormGroup;
  weekSchedule = [
    {
      DayCode: "Monday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Tuesday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Wednesday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Thursday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Friday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Saturday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
    {
      DayCode: "Sunday",
      IsWorking: false,
      DayStart: null,
      DayEnd: null,
      BlockTime: [],
      Active: false
    },
  ];
  blockTimeForm: FormGroup;
  blockEditMode: boolean;
  dayEditMode: boolean;
  dayEditCode: any;
  deletedBlocks: any[];
  vacDrawerVisible: boolean;
  staffVacData: any[];
  vacLoading: boolean;
  selectedVacStaff: any;
  specialityListener: any;
  selectedCategories: any[];
  staffGroupList: any[];
  newGroupName: string;
  newGroupExist: boolean;
  submitButtonTitle: string;

  DEFAULT_RANK: 5;
  rgstrCodeDlgVisible: boolean;
  regCodeForm: FormGroup;
  isSendingCode: boolean;
  rankOptions: { value: number; label: number; }[] = [
    { value: 1, label: 1 },
    { value: 2, label: 2 },
    { value: 3, label: 3 },
    { value: 4, label: 4 },
    { value: 5, label: 5 },
    { value: 6, label: 6 },
    { value: 7, label: 7 },
    { value: 8, label: 8 },
    { value: 9, label: 9 },
    { value: 10, label: 10 }
  ];
  isDetailVisible: boolean;
  staffTablePageSizeOptions: number[];
  DEFAULT_PAGE_SIZE: number;
  staffTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }; pagesData: any[] };
  searchBoxValue: any;
  previousSearchValue: any;
  STAFF_FILTER = {
    GENDER: "gender",
    SPECIALITY: "speciality"
  }
  staffListSubscription: any;
  orgFilterList: any[]=[];
  selectedOrganisation:any

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private tableService: TableService,
    private staffService: StaffService,
    private calendarService: CalendarService
  ) {
    this.getMetadata();
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    this.staffForm = this.fb.group({
      Name: [null, [Validators.required]],
      Address: [null],
      GoogleEmail: [null, [Validators.required, CustomValidators.email]],
      Contact: [null, [Validators.required]],
      Products: [null, [Validators.required]],
      Gender: [null, [Validators.required]],
      StaffGroupId: [null, [Validators.required]],
      Rank: [5, [Validators.required]],
      City: [null],
      Zip: [null],
      COCONRating: [null, [Validators.required]],
      Organisations: [null]
    });
    this.weekForm = this.fb.group({
      DayCode: [null, [Validators.required]],
      DayStart: [null, [Validators.required]],
      DayEnd: [null, [Validators.required]],
      BlockTime: this.fb.array([])
    });
    this.blockTimeForm = this.fb.group({
      DayCode: [null, [Validators.required]],
      Name: [null, [Validators.required]],
      StartTime: [null, [Validators.required]],
      EndTime: [null, [Validators.required]]
    })
    this.regCodeForm = this.fb.group({
      Email: [null],
      Phone: [null]
    })
    this.selectedVacStaff = null;
  }

  ngOnInit() {
    this.staffTablePageSizeOptions = [10, 20, 50, 100];
    this.staffTable = this.staffService.staffTable;
    this.staffListSubscription = this.staffService.staffListChanges.subscribe(staffChanges => {
      this.staffTable.pagesData = cloneDeep(staffChanges.pagesData);
      let selPage = this.staffTable.pagesData.find(f => f.pageNum === staffChanges.pageNum);
      if (selPage) {
        this.staffData = cloneDeep(selPage.data);
      }
    });
    this.getOrganisationList()
  }

  ngOnDestroy() {
    this.staffListSubscription.unsubscribe();
  }

  getMetadata(): void {
    this.loadingFlag = true;
    this.webapi.request(API.METADATA, {
      Metadata: ["Category", "Product", "StaffGroup", "PageSizeOptions"]
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          let cats = this.metadata['Category'];
          let prods = this.metadata['Product'];
          this.staffGroupList = this.metadata['StaffGroup'];
          this.staffTablePageSizeOptions = this.metadata.PageSizeOptions;
          this.categoryList = [];
          cats.forEach(element => {
            let catObj = {
              CategoryId: element.CategoryId,
              Name: element.Name,
              Products: []
            }
            let catProds = prods.filter(f => f.CategoryId === element.CategoryId);
            catProds.forEach(pro => {
              catObj.Products.push({
                ProductId: pro.ProductId,
                Name: pro.Name
              })
            });
            this.categoryList.push(catObj);
          });
          this.categoryFilterList = [];
          this.categoryList.forEach(element => {
            this.categoryFilterList.push({
              text: element.Name,
              value: element.CategoryId,
              byDefault: false
            })
          });
          this.getStaffList({
            filters: [],
            pagination: {
              curPage: this.staffTable.pagination.curPage,
              size: this.DEFAULT_PAGE_SIZE
            },
            sort: this.staffTable.sort
          });
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

  getStaffList({
    sort,
    filters,
    pagination,
    OrganisationLocationId=null
  }): void {
    console.log("OrganisationLocationId"+OrganisationLocationId)
    let pageExist = this.staffTable.pagesData.find(f => f.pageNum === pagination.curPage);
    let currentIds = [];
    let lastUpdated = null;
    if (pageExist) {
      currentIds = pageExist.data.map(f => f.StaffId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      this.staffTable.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
    this.loadingFlag = true;
    this.webapi.request(API.STAFF, {
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
      CurrentIds: currentIds,
      LastUpdated: lastUpdated,
      OrganisationLocationId:OrganisationLocationId
    })
      .subscribe(
        data => {
          this.loadingFlag = false;
          console.log(data)
          this.staffService.updatePagesData(data, this.metadata['Product'], this.staffGroupList);
          // this.staffData = [...data.body.Data];
          // this.setConstraints(this.staffData);
          // this.staffTable.pagination.curPage = data.body.Pagination.Number;
          // this.staffTable.pagination.size = data.body.Pagination.Size;
          // this.staffTable.pagination.itemCount = data.body.TotalItems;
          // let pageExist = this.staffTable.pagesData.find(f => f.pageNum === this.staffTable.pagination.curPage);
          // if (pageExist) {
          //   this.staffData = this.tableService.setPageData(this.staffData, pageExist.data, data.body.CurrentIds, "StaffId");
          //   pageExist.data = cloneDeep(this.staffData);
          //   pageExist.lastUpdated = data.body.LastUpdated;
          // } else {
          //   this.staffTable.pagesData.push({
          //     pageNum: this.staffTable.pagination.curPage,
          //     data: cloneDeep(this.staffData),
          //     lastUpdated: data.body.LastUpdated
          //   })
          // }
          // this.staffDataRaw = cloneDeep(this.staffData);
          
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

  setConstraints(staffData: any[]): void {
    staffData.forEach(staff => {
      staff.expand = false;
      const categoryNames = [];
      staff.Categories.forEach(element => {
        categoryNames.push(element.CategoryName);
        element.Products.forEach(product => {
          let prodData = this.metadata["Product"].find(f => f.ProductId === product.ProductId);
          if (prodData) {
            product.Name = prodData.Name;
          }
        });
      });
      staff.CategoryName = categoryNames.toString();
      if (staff.StaffGroupId) {
        let staffGroup = this.staffGroupList.find(f => f.StaffGroupId === staff.StaffGroupId);
        if (staffGroup) {
          staff.StaffGroupName = staffGroup.Name;
        }
      }
    })
  }

  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchStaff("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchStaff("");
    }
  }

  searchStaff(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.staffTable.activeFilters = [];
    this.staffTable.sort = {
      key: "",
      value: ""
    }
    this.staffTable.pagination = {
      curPage: 1,
      itemCount: this.staffTable.pagination.itemCount,
      size: this.staffTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    if(this.selectedOrganisation){
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination,
        OrganisationLocationId:this.selectedOrganisation
      })
    }else{
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination
      })
    }
    
  }

  changePageNumber(event) {
    this.loadingFlag = true;
    if(this.selectedOrganisation){
      this.getStaffList({
        sort: {
          key: this.staffTable.sort.key,
          value: this.staffTable.sort.value,
        },
        filters: this.staffTable.activeFilters,
        pagination: {
          curPage: event,
          size: this.staffTable.pagination.size
        },
        OrganisationLocationId:this.selectedOrganisation
      })

    }else{
      this.getStaffList({
        sort: {
          key: this.staffTable.sort.key,
          value: this.staffTable.sort.value,
        },
        filters: this.staffTable.activeFilters,
        pagination: {
          curPage: event,
          size: this.staffTable.pagination.size
        }
      })
    }
    
  }

  changePageSize(event) {
    this.staffTable.pagination.curPage = 1;
    this.loadingFlag = true;
    if(this.selectedOrganisation){
      this.getStaffList({
        sort: {
          key: this.staffTable.sort.key,
          value: this.staffTable.sort.value,
        },
        filters: this.staffTable.activeFilters,
        pagination: {
          curPage: this.staffTable.pagination.curPage,
          size: event
        },
        OrganisationLocationId:this.selectedOrganisation
      })
    }else{
      this.getStaffList({
        sort: {
          key: this.staffTable.sort.key,
          value: this.staffTable.sort.value,
        },
        filters: this.staffTable.activeFilters,
        pagination: {
          curPage: this.staffTable.pagination.curPage,
          size: event
        }
      })
    }
    
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.staffTable.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.staffTable.sort = {
          key: "",
          value: ""
        }
      }
      this.staffTable.pagination.curPage = 1;
      this.staffTable.pagination.itemCount = 0;
      if(this.selectedOrganisation){
        this.getStaffList({
          sort: this.staffTable.sort,
          filters: this.staffTable.activeFilters,
          pagination: this.staffTable.pagination,
          OrganisationLocationId:this.selectedOrganisation
        })
      }else{
        this.getStaffList({
          sort: this.staffTable.sort,
          filters: this.staffTable.activeFilters,
          pagination: this.staffTable.pagination
        })
      }
      
    }
  }

  changeFilter(selectedFilters: any[]): void {
    let filterExist = this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.SPECIALITY);
    if (!selectedFilters.length) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist) {
        if (JSON.stringify(filterExist.values.sort()) === JSON.stringify(selectedFilters.sort())) {
          return;
        }
      }
    }


    if (selectedFilters.length === 0) {
      let statusFilter = this.staffTable.activeFilters.length ? this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.SPECIALITY) : null;
      if (statusFilter) {
        this.staffTable.activeFilters = this.staffTable.activeFilters.filter(f => f.key !== this.STAFF_FILTER.SPECIALITY);
      }
    } else {
      let statusFilter = this.staffTable.activeFilters.length ? this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.SPECIALITY) : null;
      if (statusFilter) {
        statusFilter.values = selectedFilters;
      } else {
        this.staffTable.activeFilters.push({
          key: this.STAFF_FILTER.SPECIALITY,
          values: selectedFilters
        })
      }
    }
    this.staffTable.pagination.curPage = 1;
    this.staffTable.pagination.itemCount = 0;
    if(this.selectedOrganisation){
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination,
        OrganisationLocationId:this.selectedOrganisation
      })
    }else{
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination
      })
    }
    
    // if (selectedFilters.length <= 0) {
    //   this.staffData = cloneDeep(this.staffDataRaw);
    // } else {
    //   let data = this.staffDataRaw.filter(f => {
    //     let cats = [];
    //     f.Categories.forEach(element => {
    //       cats.push(element.CategoryId);
    //     });
    //     var found = false;
    //     for (let i = 0; i < selectedFilters.length; i++) {
    //       var filter = selectedFilters[i];
    //       cats.forEach(cat => {
    //         if (cat === filter) {
    //           found = true;
    //         }
    //       });
    //     }
    //     return found;
    //   })
    //   this.staffData = [...data];
    // }

  }

  changeGenderFilter(selectedFilter: any): void {
    // Check if filter is same as previous.
    let filterExist = this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.GENDER);
    if (selectedFilter === null) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist && filterExist.values.includes(selectedFilter)) {
        return;
      }
    }

    if (selectedFilter === null) {
      // filter reset
      let modeFilterExist = this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.GENDER);
      if (modeFilterExist) {
        this.staffTable.activeFilters = this.staffTable.activeFilters.filter(f => f.key !== this.STAFF_FILTER.GENDER);
      }
    } else {
      // filter have some value
      let modeFilterExist = this.staffTable.activeFilters.find(f => f.key === this.STAFF_FILTER.GENDER);
      if (!modeFilterExist) {
        this.staffTable.activeFilters.push({
          key: this.STAFF_FILTER.GENDER,
          values: [selectedFilter]
        });
      } else {
        modeFilterExist.values = [selectedFilter]
      }
    }
    this.staffTable.pagination.curPage = 1;
    this.staffTable.pagination.itemCount = 0;
    
    if(this.selectedOrganisation){
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination,
        OrganisationLocationId:this.selectedOrganisation
      })
    }else{
      this.getStaffList({
        sort: this.staffTable.sort,
        filters: this.staffTable.activeFilters,
        pagination: this.staffTable.pagination
      })
    }
    // if (selectedFilters !== 0 && selectedFilters !== 1) {
    //   this.staffData = [...this.staffDataRaw];
    // } else {
    //   let data = this.staffDataRaw.filter(f => f.Gender === selectedFilters);
    //   this.staffData = [...data];
    // }
  }

  expandChange(event, staffId) {
    if (!event) {
      this.staffData.forEach(element => element.expand = false);
    } else {
      this.staffData.forEach(element => {
        if (staffId !== element.StaffId) {
          element.expand = false;
        } else {
          element.expand = true;
        }
      });
    }
  }

  checkAll(value: boolean): void {
    this.staffData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.staffData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.StaffId);
      }
    });
    this.anyChecked = this.staffData.some(e => e.checked);
    this.allChecked = this.staffData.every(e => e.checked);
  }

  deleteStaff(staffId: number = null, multi = false): void {
    let obj = {
      DeleteStaff: [staffId],
      Pagination: this.staffTable.pagination
    }
    if (multi) {
      obj.DeleteStaff = [];
      obj.DeleteStaff = this.checkedData;
    }
    console.log(obj);
    this.loadingFlag = true;
    this.webapi.request(API.DELETE_STAFF, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');

          if(this.selectedOrganisation){
            this.getStaffList({
              sort: this.staffTable.sort,
              filters: this.staffTable.activeFilters,
              pagination: this.staffTable.pagination,
              OrganisationLocationId:this.selectedOrganisation
            })
          }else{
            this.getStaffList({
              sort: this.staffTable.sort,
              filters: this.staffTable.activeFilters,
              pagination: this.staffTable.pagination
            })
          }
          

          // this.staffData = [...data.body.Data];
          // this.setConstraints();
          // this.staffDataRaw = cloneDeep(this.staffData);
          this.toast.success({
            title: "Success",
            msg,
            timeout: 3000,
            theme: 'bootstrap'
          })
          this.checkAll(false);
          this.loadingFlag = false;
        },
        error => {
          this.loadingFlag = false;
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

  openStaffForm(): void {
    this.resetStaffForm();
    this.selectedCategories = [];
    // let blocks = this.weekForm.get('BlockTime') as FormArray;
    // while (blocks.length !== 0) {
    //   blocks.removeAt(0);
    // }
    this.staffFormVisible = true;
    this.specialityListener = this.staffForm.get("Products").valueChanges.subscribe(val => {
      if (val) {
        let oldCats = [...this.selectedCategories];
        this.selectedCategories = [];
        val.forEach(productId => {
          let prodCategory = this.metadata['Product'].find(f => f.ProductId === productId);
          if(prodCategory){
            let catInserted = this.selectedCategories.find(f => f.CategoryId === prodCategory.CategoryId);
            if (!catInserted) {
              let categ = this.metadata['Category'].find(cat => cat.CategoryId === prodCategory.CategoryId);
              let olde = oldCats.find(f => f.CategoryId === categ.CategoryId);
              this.selectedCategories.push({
                CategoryId: prodCategory.CategoryId,
                Name: categ.Name,
                Rate: olde ? olde.Rate : null
              })
            }
          }
          
        });
      }
    });
  }

  addBlockTimeControls() {
    let blockArray = this.weekForm.get('BlockTime') as FormArray;
    blockArray.push(this.pushBlockControls());
  }

  pushBlockControls(obj = null) {
    if (!obj) {
      return this.fb.group({
        StaffBlockTimeId: [null],
        BlockTimeId: [null],
        Name: [null, [Validators.required]],
        StartTime: [null, [Validators.required]],
        EndTime: [null, [Validators.required]]
      })
    } else {
      let startTime = moment(obj.StartTime, "HH:mm").toDate();
      let endTime = moment(obj.EndTime, "HH:mm").toDate();
      return this.fb.group({
        StaffBlockTimeId: [obj.StaffBlockTimeId ? obj.StaffBlockTimeId : null],
        BlockTimeId: [obj.BlockTimeId ? obj.BlockTimeId : null],
        Name: [obj.Name, [Validators.required]],
        StartTime: [startTime, [Validators.required]],
        EndTime: [endTime, [Validators.required]]
      })
    }
  }

  saveDisabled(): boolean {
    if (!this.weekForm.valid) {
      return true;
    }
    let weekFormValue = this.weekForm.value;
    let blocks = weekFormValue.BlockTime;
    blocks.forEach(element => {
      if (
        !element.Name ||
        !element.StartTime ||
        !element.EndTime
      ) {
        return true;
      }
    });
    return false;
  }

  addDayWorking() {
    const startObj = moment(this.weekForm.controls.DayStart.value).format("HH:mm");
    const endObj = moment(this.weekForm.controls.DayEnd.value).format("HH:mm");
    const startTime = moment(startObj, "HH:mm");
    const endTime = moment(endObj, "HH:mm");
    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      this.toast.error({
        title: "Please enter valid day timing.",
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    let weekFormValue = this.weekForm.value;
    let blocks = weekFormValue.BlockTime;
    let isBlockValid = true;
    blocks.forEach(block => {
      const valid = this.validateBlocks(startTime.format("HH:mm"), endTime.format("HH:mm"), block);
      if (!valid) {
        isBlockValid = false;
        return;
      } else {
        block.StartTime = moment(block.StartTime).format("HH:mm");
        block.EndTime = moment(block.EndTime).format("HH:mm");
      }
    });
    if (!isBlockValid) {
      this.toast.error({
        title: "Please enter block time within valid range.",
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      });
      return;
    }
    let dayObject = this.weekSchedule.find(f => f.DayCode === this.weekForm.controls.DayCode.value);
    dayObject.IsWorking = true;
    dayObject.DayStart = startTime.format("HH:mm");
    dayObject.DayEnd = endTime.format("HH:mm");
    dayObject.BlockTime = blocks;
    if (dayObject.BlockTime.length > 0) {
      dayObject.Active = true;
    }
    if (this.dayEditMode) {
      if (dayObject.DayCode !== this.dayEditCode) {
        const dayPrev = this.weekSchedule.find(f => f.DayCode === this.dayEditCode);
        dayPrev.IsWorking = false;
        dayPrev.DayStart = null;
        dayPrev.DayEnd = null;
        dayPrev.Active = false;
        dayPrev.BlockTime = [];
      }
    }
    this.resetWeekForm();
    this.scrollToSchedule();
    this.dayEditMode = false;
    this.dayEditCode = null;
  }

  resetWeekForm() {
    this.weekForm.reset();
    let blockArray = this.weekForm.get('BlockTime') as FormArray;
    while (blockArray.length !== 0) {
      blockArray.removeAt(0);
    }
  }

  removeDayWorking(dayCode) {
    const dayFound = this.weekSchedule.find(f => f.DayCode === dayCode);
    if (dayFound) {
      dayFound.Active = false;
      dayFound.DayStart = null;
      dayFound.DayEnd = null;
      dayFound.BlockTime = [];
      dayFound.IsWorking = false;
    }
  }

  scrollToSchedule() {
    window.scrollTo({
      behavior: "smooth",
      top: 700,
      left: 0
    })
  }

  scrollToTop() {
    window.scrollTo({
      behavior: "smooth",
      top: 0,
      left: 0
    })
  }

  closePanel(event, dayCode) {
    if (!event) {
      const dayFound = this.weekSchedule.find(f => f.DayCode === dayCode);
      dayFound.Active = false;
    }
  }

  resetStaffForm(): void {
    this.staffForm.reset();
    // this.weekSchedule.forEach(f => {
    //   f.IsWorking = false;
    //   f.DayStart = null;
    //   f.DayEnd = null;
    //   f.BlockTime = [];
    //   f.Active = false;
    // });
    // this.resetWeekForm();
    // this.editBlockId = null;
    // this.dayEditCode = null;
    // this.dayEditMode = false;
    // this.blockEditMode = false;
    this.updateMode = false;
    this.rawUpdateData = null;
    this.submitButtonTitle = "";
    this.selectedCategories = [];
    // this.deletedBlocks = [];
    this.scrollToTop();
  }

  resetUpdateForm(): void {
    this.staffForm.patchValue(this.rawUpdateData);
    this.selectedCategories = [...this.rawUpdateData.SelectedCategories];
    // this.resetWeekForm();
    // this.deletedBlocks = [];
    // this.rawUpdateData.WorkingDays.forEach(day => {
    //   const dayFound = this.weekSchedule.find(f => f.DayCode === day.DayCode);
    //   dayFound.DayCode = day.DayCode;
    //   dayFound.IsWorking = day.IsWorking;
    //   dayFound.DayStart = day.DayStart;
    //   dayFound.DayEnd = day.DayEnd;
    //   dayFound.BlockTime = day.BlockTime;
    //   dayFound.Active = true;
    //   setTimeout(() => {
    //     dayFound.Active = false;
    //   }, 10);
    // });
    this.scrollToTop();
  }

  closeStaffForm(): void {
    this.resetStaffForm();
    this.staffFormVisible = false;
  }

  createTempId() {
    return moment().toDate().getTime() + "" + Math.random();
  }

  addBlockTime(): void {
    let tempStartTime = moment(this.blockTimeForm.controls.StartTime.value).format("HH:mm");
    let tempEndTime = moment(this.blockTimeForm.controls.EndTime.value).format("HH:mm");
    let newStartTime = moment(tempStartTime, "HH:mm");
    let newEndTime = moment(tempEndTime, "HH:mm");
    let startTime = "";
    let endTime = "";
    if (newEndTime.isBefore(newStartTime) || newEndTime.isSame(newStartTime)) {
      this.toast.error({
        title: "Please enter a valid block time.",
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    const dayTiming = this.weekSchedule.find(f => f.DayCode === this.blockTimeForm.controls.DayCode.value);
    const dayStart = moment(dayTiming.DayStart, "HH:mm");
    const dayEnd = moment(dayTiming.DayEnd, "HH:mm");
    if (
      !newStartTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
      !newEndTime.isBetween(dayStart, dayEnd, "minute", "[]")
    ) {
      this.toast.error({
        title: "Please enter a valid block time.",
        msg: "",
        timeout: 3000,
        theme: "bootstrap"
      })
      return;
    }
    startTime = newStartTime.format("HH:mm");
    endTime = newEndTime.format("HH:mm");
    let blockObject = {
      TempId: this.createTempId(),
      Name: this.blockTimeForm.controls.Name.value,
      StartTime: startTime,
      EndTime: endTime
    }
    if (this.blockEditMode) {
      if (this.blockTimeForm.controls.DayCode.value !== this.dayEditCode) {
        // remove block from prev day code and add to new one.
        const dayExist = this.weekSchedule.find(day => day.DayCode === this.dayEditCode);
        dayExist.BlockTime = dayExist.BlockTime.filter(f => f.TempId !== this.editBlockId);
        const newDay = this.weekSchedule.find(f => f.DayCode === this.blockTimeForm.controls.DayCode.value);
        newDay.BlockTime.push(blockObject);
      } else {
        const found = dayTiming.BlockTime.find(f => f.TempId === this.editBlockId);
        found.Name = this.blockTimeForm.controls.Name.value;
        found.StartTime = startTime;
        found.EndTime = endTime;
      }
    } else {
      dayTiming.BlockTime.push(blockObject);
    }
    this.blockTimeForm.reset();
    dayTiming.Active = true;
    this.scrollToSchedule();
    this.editBlockId = null;
    this.blockEditMode = false;
  }

  editBlockData(dayCode, data): void {
    window.scrollTo({
      behavior: "smooth",
      top: 300,
      left: 0
    })
    this.blockTimeForm.patchValue({
      DayCode: dayCode,
      Name: data.Name,
      StartTime: moment(data.StartTime, "HH:mm").toDate(),
      EndTime: moment(data.EndTime, "HH:mm").toDate(),
    })
    this.blockEditMode = true;
    this.dayEditCode = dayCode;
    this.editBlockId = data.TempId;
  }

  editDayWorking(day): void {
    this.resetWeekForm();
    const dayFound = this.weekSchedule.find(f => f.DayCode === day.DayCode);
    window.scrollTo({
      behavior: "smooth",
      top: 300,
      left: 0
    })
    let obj = {
      DayCode: day.DayCode,
      DayStart: moment(day.DayStart, "HH:mm").toDate(),
      DayEnd: moment(day.DayEnd, "HH:mm").toDate()
    }
    this.weekForm.patchValue(obj);
    let blockArray = this.weekForm.get('BlockTime') as FormArray;
    day.BlockTime.forEach(block => {
      blockArray.push(this.pushBlockControls(block));
    });
    this.dayEditMode = true;
    this.dayEditCode = day.DayCode;
    dayFound.Active = true;
    setTimeout(() => {
      dayFound.Active = false;
    }, 100);
  }

  deleteBlock(index: number): void {
    const day = this.weekForm.get('BlockTime') as FormArray;
    let value = day.value[index];
    if (value.StaffBlockTimeId) {
      this.deletedBlocks.push(value.StaffBlockTimeId);
    }
    day.removeAt(index);
    // this.editBlockId = null;
    // const dayFound = this.weekSchedule.find(f => f.DayCode === dayCode);
    // dayFound.BlockTime = dayFound.BlockTime.filter(f => f.TempId !== tempId);
    // if (dayFound.BlockTime.length === 0) {
    //   dayFound.Active = false;
    // }
  }

  disableSubmit() {
    if (!this.staffForm.valid) {
      return true;
    }else{
      return false;
    }
    // let rateNotInserted = false;
    // this.selectedCategories.forEach(cat => {
    //   if (!cat.Rate) {
    //     rateNotInserted = true;
    //   }
    // });
    // const notOneWorking = this.weekSchedule.every(f => !f.IsWorking);
    // if (notOneWorking) {
    //   return true;
    // }
    // rateNotInserted ? this.submitButtonTitle = "Please fill category rates" : "";
    // return rateNotInserted;
  }

  submitStaff(): void {
    // const valid = this.checkBlocks();
    // if (!valid) {
    //   return;
    // }
    // let finalWeekSchedule = [];
    // this.weekSchedule.forEach(element => {
    //   element.BlockTime.forEach(f => {
    //     delete f.StaffBlockTimeId;
    //     delete f.BlockTimeId;
    //   });
    //   finalWeekSchedule.push({
    //     DayCode: element.DayCode,
    //     IsWorking: element.IsWorking,
    //     DayStart: element.DayStart,
    //     DayEnd: element.DayEnd,
    //     BlockTime: element.BlockTime
    //   })
    // });
    let obj = {
      ...this.staffForm.value
    }
    obj.Categories = [];
    obj.Products.forEach(productId => {
      let prodData = this.metadata["Product"].find(f => f.ProductId === productId);
      let cat = this.metadata["Category"].find(f => f.CategoryId === prodData.CategoryId);
      let catRate = this.selectedCategories.find(f => f.CategoryId === cat.CategoryId);
      let catInserted = obj.Categories.find(f => f.CategoryId === cat.CategoryId);
      if (!catInserted) {
        obj.Categories.push({
          CategoryId: cat.CategoryId,
          Rate: catRate.Rate,
          Products: [{
            ProductId: productId,
            Rate: catRate.Rate
          }]
        })
      } else {
        if (!catInserted.Products.find(f => f.ProductId === productId)) {
          catInserted.Products.push({
            ProductId: productId,
            Rate: catRate.Rate
          })
        }
      }
    });
    delete obj.Products;
    this.spinner.show();
    this.webapi.request(API.NEW_STAFF, obj)
      .subscribe(
        data => {
          if(this.selectedOrganisation){
            this.getStaffList({
              sort: this.staffTable.sort,
              filters: this.staffTable.activeFilters,
              pagination: this.staffTable.pagination,
              OrganisationLocationId:this.selectedOrganisation
            })
          }else{
            this.getStaffList({
              sort: this.staffTable.sort,
              filters: this.staffTable.activeFilters,
              pagination: this.staffTable.pagination
            })
          }
          // this.staffData = [...data.body.Data];
          // this.setConstraints();
          // this.staffDataRaw = cloneDeep(this.staffData);
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            timeout: 3000,
            theme: "bootstrap"
          })
          this.spinner.hide();
          this.closeStaffForm();
        },
        error => {
          this.spinner.hide();
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

  fillStaffForm(data): void {
    this.openStaffForm();
    let staffFormPatch = {
      Name: data.Name,
      Products: [],
      Contact: data.Contact,
      GoogleEmail: data.GoogleEmail,
      Address: data.Address,
      StaffGroupId: data.StaffGroupId ? data.StaffGroupId : null,
      Rank: data.Rank ? data.Rank : this.DEFAULT_RANK,
      Gender: data.Gender,
      City: data.City ? data.City : null,
      Zip: data.Zip ? data.Zip : null,
      COCONRating: data.COCONRating ? data.COCONRating : 0,
      SelectedCategories: [],
      Organisations:data.Organisations?data.Organisations:null
    }
    this.selectedCategories = [];
    data.Categories.forEach(category => {
      this.selectedCategories.push({
        CategoryId: category.CategoryId,
        Name: category.CategoryName,
        Rate: category.CategoryRate
      })
      category.Products.forEach(product => {
        staffFormPatch.Products.push(product.ProductId);
      });
    });
    staffFormPatch.SelectedCategories = [...this.selectedCategories];
    this.staffForm.patchValue(staffFormPatch);
    // data.WorkingDays.forEach(day => {
    //   const dayFound = this.weekSchedule.find(f => f.DayCode === day.DayCode);
    //   dayFound.DayCode = day.DayCode;
    //   dayFound.IsWorking = day.IsWorking;
    //   dayFound.DayStart = moment(day.DayStart, "HH:mm:ss").format("HH:mm");
    //   dayFound.DayEnd = moment(day.DayEnd, "HH:mm:ss").format("HH:mm");
    //   dayFound.BlockTime = day.BlockTime;
    // });
    // this.genderSelected = data.Gender;
    this.updateMode = true;
    this.rawUpdateData = cloneDeep(staffFormPatch);
    this.rawUpdateData.StaffId = data.StaffId;
  }

  updateStaff(): void {
    // const valid = this.checkBlocks();
    // if (!valid) {
    //   return;
    // }
    // let finalWeekSchedule = [];
    // this.weekSchedule.forEach(element => {
    //   let newBlocks = [];
    //   let editBlocks = [];
    //   element.BlockTime.forEach(block => {
    //     if (block.StaffBlockTimeId) {
    //       editBlocks.push(block);
    //     } else {
    //       newBlocks.push(block);
    //     }
    //   });
    //   finalWeekSchedule.push({
    //     DayCode: element.DayCode,
    //     IsWorking: element.IsWorking,
    //     DayStart: element.DayStart,
    //     DayEnd: element.DayEnd,
    //     BlockTime: newBlocks,
    //     EditBlocks: editBlocks
    //   })
    // });

    // let DeleteBlocks = this.deletedBlocks;
    let obj = {
      StaffId: this.rawUpdateData.StaffId,
      ...this.staffForm.value
    }
    obj.Categories = [];
    obj.Products.forEach(productId => {
      let prodData = this.metadata["Product"].find(f => f.ProductId === productId);
      if(prodData){
        let cat = this.metadata["Category"].find(f => f.CategoryId === prodData.CategoryId);
      let catRate = this.selectedCategories.find(f => f.CategoryId === cat.CategoryId);
      let catInserted = obj.Categories.find(f => f.CategoryId === cat.CategoryId);
      if (!catInserted) {
        obj.Categories.push({
          CategoryId: cat.CategoryId,
          Rate: catRate.Rate,
          Products: [{
            ProductId: productId,
            Rate: catRate.Rate
          }]
        })
      } else {
        if (!catInserted.Products.find(f => f.ProductId === productId)) {
          catInserted.Products.push({
            ProductId: productId,
            Rate: catRate.Rate
          })
        }
      }
      }
    });
    obj.SendPush = this.checkSkillsChange(obj.Categories);
    this.spinner.show();
    this.webapi.request(API.UPDATE_STAFF, obj)
      .subscribe(
        data => {
         if(this.selectedOrganisation){
          this.getStaffList({
            sort: this.staffTable.sort,
            filters: this.staffTable.activeFilters,
            pagination: this.staffTable.pagination,
            OrganisationLocationId:this.selectedOrganisation
          })
         }else{
          this.getStaffList({
            sort: this.staffTable.sort,
            filters: this.staffTable.activeFilters,
            pagination: this.staffTable.pagination
          })
         }
          // this.staffData = [...data.body.Data];
          // this.setConstraints();
          // this.staffDataRaw = cloneDeep(this.staffData);
          var msg = data.headers.get('message');
          this.toast.success({
            title: "",
            msg,
            timeout: 3000,
            theme: "bootstrap"
          })
          this.spinner.hide();
          this.closeStaffForm();
        },
        error => {
          this.spinner.hide();
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

  checkSkillsChange(newCategories): boolean {
    let skillsUpdated = false;
    let newProducts = [];
    for (let newInc = 0; newInc < newCategories.length; newInc++) {
      const category = newCategories[newInc];
      let catFound = this.rawUpdateData.SelectedCategories.find(f => f.CategoryId === category.CategoryId);
      if (!catFound) {
        skillsUpdated = true;
        break;
      }
      category.Products.forEach(product => {
        newProducts.push(product.ProductId);
      });
    }
    for (let newPIn = 0; newPIn < newProducts.length; newPIn++) {
      const product = newProducts[newPIn];
      let foundInExist = this.rawUpdateData.Products.find(f => f === product);
      if (!foundInExist) {
        skillsUpdated = true;
      }
    }
    for (let newPIn = 0; newPIn < this.rawUpdateData.Products.length; newPIn++) {
      const product = this.rawUpdateData.Products[newPIn];
      let foundInExist = newProducts.find(f => f === product);
      if (!foundInExist) {
        skillsUpdated = true;
      }
    }
    return skillsUpdated;
  }

  checkBlocks(): boolean {
    let blocksValid = true;
    this.weekSchedule.forEach(dayTiming => {
      if (!blocksValid) {
        return;
      }
      const dayStart = moment(dayTiming.DayStart, "HH:mm");
      const dayEnd = moment(dayTiming.DayEnd, "HH:mm");
      dayTiming.BlockTime.forEach(block => {
        let startTime = moment(block.StartTime, "HH:mm");
        let endTime = moment(block.EndTime, "HH:mm");
        if (
          !startTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
          !endTime.isBetween(dayStart, dayEnd, "minute", "[]")
        ) {
          this.toast.error({
            title: `Due to this update block time got out of range, please correct and save.`,
            msg: "",
            timeout: 3000,
            theme: "bootstrap"
          })
          blocksValid = false;
          return;
        }
      });
    });
    return blocksValid;
  }

  validateBlocks(start: string, end: string, block: any): boolean {
    const dayStart = moment(start, "HH:mm");
    const dayEnd = moment(end, "HH:mm");
    let startTime = moment(block.StartTime, "HH:mm");
    let endTime = moment(block.EndTime, "HH:mm");
    if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
      return false;
    }
    if (
      !startTime.isBetween(dayStart, dayEnd, "minute", "[]") ||
      !endTime.isBetween(dayStart, dayEnd, "minute", "[]")
    ) {
      return false;
    }
    return true;
  }

  viewUpVacations(staffId) {
    this.selectedVacStaff = this.staffData.find(f => f.StaffId === staffId);
    this.vacLoading = true;
    let obj = {
      StaffId: staffId,
      ShowUpcoming: true
    }
    this.vacDrawerVisible = true;
    this.staffVacData = [];
    this.webapi.request(API.VACATION, obj)
      .subscribe(
        data => {
          this.staffVacData = [...data.body.Data];
          this.setVacConstraints();
          this.vacLoading = false;
        },
        error => {
          this.staffVacData = [];
          this.vacLoading = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  setVacConstraints() {
    this.staffVacData.forEach(vac => {
      if (vac.Template === 0) {
        vac.TimingString = `Full Day`;
      } else {
        vac.TimingString = `${moment(vac.StartDate).format("HH:mm")} - ${moment(vac.EndDate).format("HH:mm")}`;
      }
      vac.DateString = "";
      if (vac.DayCount === 1) {
        vac.DateString = moment(vac.StartDate).format("MMM DD YYYY");
      } else {
        vac.DateString = `${moment(vac.StartDate).format("MMM DD YYYY")} - ${moment(vac.EndDate).format("MMM DD YYYY")}`
      }
      if (vac.Status === 3) {
        vac.RetreatString = "Retreated";
      }
    })
  }

  closeVacDrawer() {
    this.vacDrawerVisible = false;
  }

  openScheduleDrawer() {
    this.scheduleDrawerVisible = true;
  }

  closeScheduleDrawer() {
    this.scheduleDrawerVisible = false;
  }

  scheduleMask = {
    'background-color': 'rgba(0, 0, 0, 0.20)'
  }

  printForm() {
    console.log(this.staffForm.value)
  }

  checkNewGroup(event: any) {
    let groupAlreadyExist = this.staffGroupList.find(f => f.Name === event);
    if (groupAlreadyExist) {
      this.newGroupExist = true;
    } else {
      this.newGroupExist = false;
    }
  }

  addNewGroup() {
    let newGroupName = this.newGroupName;
    if (newGroupName) {
      let obj = {
        Metadata: ["StaffGroup", "NewGroup"],
        GroupName: newGroupName
      }
      this.spinner.show();
      this.webapi.request(API.METADATA, obj)
        .subscribe(
          data => {
            let metaInfo = { ...data.body.Data };
            this.metadata['StaffGroup'] = metaInfo['StaffGroup'];
            this.staffGroupList = this.metadata["StaffGroup"];
            this.spinner.hide();
            this.toast.success({
              title: "",
              msg: "Group added successfully.",
              timeout: 2000,
              theme: "bootstrap"
            })
            this.newGroupName = "";
          },
          error => {
            this.spinner.hide();
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              timeout: 3000,
              theme: "bootstrap"
            })
          }
        )
    }
  }

  openRegistrationCodeDialog(): void {
    this.rgstrCodeDlgVisible = true;
    this.regCodeForm.reset();
  }

  closeRgrCodeModal(): void {
    this.rgstrCodeDlgVisible = false;
  }

  disableRgrSend(): boolean {
    let email = this.regCodeForm.controls.Email.value;
    let phone = this.regCodeForm.controls.Phone.value;
    if (email && this.regCodeForm.controls.Email.invalid) {
      return true;
    }
    if (!email && !phone) {
      return true;
    }
    return false;
  }

  sendRegCode(): void {
    let obj = {
      Email: this.regCodeForm.controls.Email.value ? this.regCodeForm.controls.Email.value : null,
      Phone: this.regCodeForm.controls.Phone.value ? this.regCodeForm.controls.Phone.value : null
    }
    let validatePhone;
    if (obj.Email || obj.Phone) {
      this.isSendingCode = true;
      this.webapi.request(API.SEND_REG_CODE, obj)
        .subscribe(
          data => {
            this.isSendingCode = false;
            this.rgstrCodeDlgVisible = false;
            this.toast.success({
              title: "",
              msg: data.headers.get('message'),
              timeout: 3000,
              theme: "bootstrap"
            })
          },
          error => {
            this.isSendingCode = false;
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              timeout: 3000,
              theme: "bootstrap"
            })
          });
    }
  }

  openStaffDetail(staffId: number, event: any = null): void {
    console.log(window.getSelection().toString())
    if(!window.getSelection().toString()) {
    if (event) {
      let exemptTargets = ["IMG", "I"]
      if (exemptTargets.includes(event.target.nodeName)) {
        return;
      }
    }
    let obj = {
      StaffId: staffId
    }
    this.spinner.show();
    this.webapi.request(API.STAFF_DETAIL, obj)
      .subscribe(
        data => {
          this.spinner.hide();
          this.staffDetail = data.body.Data;
          this.staffDetail.StaffGroupName = "";
          let group = this.metadata['StaffGroup'].find(f => f.StaffGroupId === this.staffDetail.StaffGroupId);
          if (group) {
            this.staffDetail.StaffGroupName = group.Name;
          }
          this.staffDetail.Categories.forEach(category => {
            category.Products.forEach(product => {
              let prod = this.metadata['Product'].find(f => f.ProductId === product.ProductId);
              if(prod){
                product.Name = prod.Name;
              }
            });
          });
          console.log(this.staffDetail)
          this.isDetailVisible = true;
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            timeout: 3000,
            theme: "bootstrap"
          })
        });
  }
}
  closeDetail() {
    this.staffDetail = null;
    this.isDetailVisible = false;
  }
  stopViewDetail(event) {
    event.stopPropagation()
  }

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    }
}
getOrganisationList(){
  this.calendarService.getOrganisationList(true).then(results => {

    let organisationList = this.calendarService.organisationList
    this.orgFilterList=[...organisationList]
    
    this.sortOrganisationList()
    console.log(this.orgFilterList)
  });
}
sortOrganisationList(): void {
  // this.orgFilterList.sort((a, b) => {
  //   if ( a.Name.toLowerCase() < b.Name.toLowerCase() ){
  //     return -1;
  //   }
  //   if ( a.Name.toLowerCase() > b.Name.toLowerCase() ){
  //     return 1;
  //   }
  //   return 0;
  // });
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
changeOrganisation(selectedOrg) {
  if(selectedOrg){
    this.getStaffList({
      filters: [],
      pagination: {
        curPage: this.staffTable.pagination.curPage,
        size: this.DEFAULT_PAGE_SIZE
      },
      sort: this.staffTable.sort,
      OrganisationLocationId:selectedOrg
    })
  }else{
    this.getStaffList({
      filters: [],
      pagination: {
        curPage: this.staffTable.pagination.curPage,
        size: this.DEFAULT_PAGE_SIZE
      },
      sort: this.staffTable.sort
    }
  )
  }
  
}
clearSelectedOrg(i){
  this.selectedOrganisation=null
  this.getStaffList({
    filters: [],
    pagination: {
      curPage: this.staffTable.pagination.curPage,
      size: this.DEFAULT_PAGE_SIZE
    },
    sort: this.staffTable.sort
  }
)
   
  
  }
}