import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { WebService } from '../shared/services/web.service';
import { ToastyService } from 'ng2-toasty';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';
import * as momentz from 'moment-timezone';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import { TableService } from '../shared/services/table.service';
import { API } from '../shared/enums/apiNames.enum';
import { PromoService } from '../shared/services/promo.service';

@Component({
  selector: 'app-promo-code',
  templateUrl: './promo-code.component.html',
  styleUrls: ['./promo-code.component.css'],
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
export class PromoCodeComponent implements OnInit {
  loadingFlag: boolean = false;
  metadata: any;
  categoryList: any[];
  categoryFilterList: any[];
  promoData: any[];
  promoDataRaw: any[];
  promoFormVisible: boolean = false;
  promoForm: FormGroup;
  modeList: any[];
  sortName: string;
  sortValue: string;
  updateMode: boolean;
  rawUpdateData: any;
  updatePromoId: any;
  typeList: { text: string; value: number; byDefault: boolean; }[];
  typeSelector: any;
  typeCatSelected: boolean;
  valueSelector: any;
  maxSelector: any;
  modeSelector: any;
  modeSelected: boolean;
  minSelector: any;
  checkedData: any[];
  anyChecked: any;
  allChecked: boolean;
  startDate: any;
  startSelector: any;
  redeemSelector: any;
  redeemCountSelector: any;
  countList: ({ Label: string; Value: any; } | { Label: number; Value: number; })[];
  newCountValid: boolean;
  newCount: any | number;
  classList: { text: string; value: number; byDefault: boolean; }[];
  // DEFAULT_PAGE_SIZE: number;
  promoTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }, pagesData: any[]; };
  searchBoxValue: any;
  previousSearchValue: string;
  promoTablePageSizeOptions: number[];
  DEFAULT_PAGE_SIZE: any;
  startDateRange:any[]=[];
  endDateRange:any[]=[];
  startDateRangeCalled:any[]=[];
  endDateRangeCalled:any[]=[];
  startVisible:false;
  endVisible:false;
  PROMO_CODE_FILTER = {
    MODE: "valueType",
    TYPE: "promoType",
    CLASS: "codeGenerationType",
    STARTDATE:"startDate",
    ENDDATE:"endDate"
    
  }
  promoListSubscription: any;
 


  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private tableService: TableService,
    private promoService: PromoService
  ) {
    this.getMetadata();
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    this.promoForm = this.promoService.createPromoForm();
    this.countList = this.promoService.countList;
  }

  ngOnInit() {
    this.promoTablePageSizeOptions = [10, 20, 50, 100];
    this.promoTable = this.promoService.promoTable;
    this.modeList = this.promoService.modeList;
    this.typeList = this.promoService.typeList;
    this.classList = this.promoService.classList;
    this.previousSearchValue = "";
    this.promoListSubscription = this.promoService.promoListChanges.subscribe(promoChanges => {
      this.promoTable.pagesData = cloneDeep(promoChanges.pagesData);
      let selPage = this.promoTable.pagesData.find(f => f.pageNum === promoChanges.pageNum);
      if (selPage) {
        this.promoData = cloneDeep(selPage.data);
      }
    });
  }

  ngOnDestroy() {
    this.promoListSubscription.unsubscribe();
    this.promoTable = null;
  }

  getMetadata(): void {
    this.loadingFlag = true;
    this.webapi.request(API.METADATA, { Metadata: ['Category', 'PageSizeOptions'] })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          this.categoryList = [...this.metadata['Category']];
          this.categoryFilterList = [];
          this.categoryList.forEach(element => {
            this.categoryFilterList.push({
              text: element.Name,
              value: element.CategoryId,
              byDefault: false
            })
          });
          this.promoTablePageSizeOptions = this.metadata.PageSizeOptions;
          this.getPromoList({
            filters: [],
            pagination: {
              curPage: this.promoTable.pagination.curPage,
              size: this.DEFAULT_PAGE_SIZE
            },
            sort: this.promoTable.sort
          });
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

  getPromoList({
    sort,
    filters,
    pagination
  }): void {
    let pageExist = this.promoTable.pagesData.find(f => f.pageNum === pagination.curPage);
    let currentIds = [];
    let lastUpdated = null;
    if (pageExist) {
      currentIds = pageExist.data.map(f => f.PromoCodeId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      this.promoTable.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
    this.loadingFlag = true;
    this.webapi.request(API.PROMO_CODE, {
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
      LastUpdated: lastUpdated
    })
      .subscribe(
        data => {
          this.loadingFlag = false;
          this.promoService.updatePagesData(data, this.categoryList);
          // this.promoData = [...data.body.Data];
          // this.setConstraints(this.promoData);
          // this.promoTable.pagination.curPage = data.body.Pagination.Number;
          // this.promoTable.pagination.size = data.body.Pagination.Size;
          // this.promoTable.pagination.itemCount = data.body.TotalItems;
          // let pageExist = this.promoTable.pagesData.find(f => f.pageNum === this.promoTable.pagination.curPage);
          // if (pageExist) {
          //   this.promoData = this.tableService.setPageData(this.promoData, pageExist.data, data.body.CurrentIds, "PromoCodeId");
          //   pageExist.data = cloneDeep(this.promoData);
          //   pageExist.lastUpdated = data.body.LastUpdated;
          // } else {
          //   this.promoTable.pagesData.push({
          //     pageNum: this.promoTable.pagination.curPage,
          //     data: cloneDeep(this.promoData),
          //     lastUpdated: data.body.LastUpdated
          //   })
          // }
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

  setConstraints(promoData): void {
    promoData.forEach(promo => {
      let startTime = momentz.tz(promo.StartDate, environment.STAFF_ZONE).toDate();
      let endTime = momentz.tz(promo.EndDate, environment.STAFF_ZONE).toDate();
      promo.StartTime = startTime.getTime();
      promo.EndTime = endTime.getTime();
      promo.ShowStart = momentz.tz(promo.StartDate, environment.STAFF_ZONE).format('MMM DD YYYY, HH:mm z');
      promo.ShowEnd = momentz.tz(promo.EndDate, environment.STAFF_ZONE).format('MMM DD YYYY, HH:mm z');
      console.log(promo.ShowStart)
      console.log(promo.ShowEnd)
      if (promo.Type === 1) {
        promo.CategoryNames = "";
        promo.Categories.forEach((promoCat, index) => {
          let found = this.categoryList.find(f => f.CategoryId === promoCat);
          if (index === (promo.Categories.length - 1)) {
            promo.CategoryNames += found.Name
          } else {
            promo.CategoryNames += found.Name + ", "
          }
        });
      }
    });
  }

  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchPromo("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchPromo("");
    }
  }

  searchPromo(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.promoTable.activeFilters = [];
    this.promoTable.sort = {
      key: "",
      value: ""
    }
    this.promoTable.pagination = {
      curPage: 1,
      itemCount: this.promoTable.pagination.itemCount,
      size: this.promoTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    this.getPromoList({
      sort: this.promoTable.sort,
      filters: this.promoTable.activeFilters,
      pagination: this.promoTable.pagination
    })
  }

  changePageNumber(event) {
    this.getPromoList({
      sort: {
        key: this.promoTable.sort.key,
        value: this.promoTable.sort.value,
      },
      filters: this.promoTable.activeFilters,
      pagination: {
        curPage: event,
        size: this.promoTable.pagination.size
      }
    })
  }

  changePageSize(event) {
    this.promoTable.pagination.curPage = 1;
    this.loadingFlag = true;
    this.getPromoList({
      sort: {
        key: this.promoTable.sort.key,
        value: this.promoTable.sort.value,
      },
      filters: this.promoTable.activeFilters,
      pagination: {
        curPage: this.promoTable.pagination.curPage,
        size: event
      }
    })
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.promoTable.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.promoTable.sort = {
          key: "",
          value: ""
        }
      }
      this.promoTable.pagination.curPage = 1;
      this.promoTable.pagination.itemCount = 0;
      this.getPromoList({
        sort: this.promoTable.sort,
        filters: this.promoTable.activeFilters,
        pagination: this.promoTable.pagination
      })
    }
  }

  changeModeFilter(selectedFilter): void {
    // Check if filter is same as previous.
    let filterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.MODE);
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
      let modeFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.MODE);
      if (modeFilterExist) {
        this.promoTable.activeFilters = this.promoTable.activeFilters.filter(f => f.key !== this.PROMO_CODE_FILTER.MODE);
      }
    } else {
      // filter have some value
      let modeFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.MODE);
      if (!modeFilterExist) {
        this.promoTable.activeFilters.push({
          key: this.PROMO_CODE_FILTER.MODE,
          values: [selectedFilter]
        });
      } else {
        modeFilterExist.values = [selectedFilter]
      }
    }
    this.promoTable.pagination.curPage = 1;
    this.promoTable.pagination.itemCount = 0;
    this.getPromoList({
      sort: this.promoTable.sort,
      filters: this.promoTable.activeFilters,
      pagination: this.promoTable.pagination
    })
    // if (selectedFilters === 0 || selectedFilters === 1) {
    //   let data = this.promoDataRaw.filter(f => f.Mode === selectedFilters);
    //   this.promoData = [...data];
    // } else {
    //   this.promoData = cloneDeep(this.promoDataRaw);
    // }
  }

  changeClassFilter(selectedFilter): void {
    // Check if filter is same as previous.
    let filterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.CLASS);
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
      let classFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.CLASS);
      if (classFilterExist) {
        this.promoTable.activeFilters = this.promoTable.activeFilters.filter(f => f.key !== this.PROMO_CODE_FILTER.CLASS);
      }
    } else {
      // filter have some value
      let classFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.CLASS);
      if (!classFilterExist) {
        this.promoTable.activeFilters.push({
          key: this.PROMO_CODE_FILTER.CLASS,
          values: [selectedFilter]
        });
      } else {
        classFilterExist.values = [selectedFilter]
      }
    }
    this.promoTable.pagination.curPage = 1;
    this.promoTable.pagination.itemCount = 0;
    this.getPromoList({
      sort: this.promoTable.sort,
      filters: this.promoTable.activeFilters,
      pagination: this.promoTable.pagination
    })

    // if (typeof selectedFilter === "number") {
    //   this.promoData = this.promoDataRaw.filter(f => f.Class === selectedFilter)
    // } else {
    //   this.promoData = cloneDeep(this.promoDataRaw);
    // }
  }

  changeTypeFilter(selectedFilter): void {
    // Check if filter is same as previous.
    let filterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.TYPE);
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
      let typeFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.TYPE);
      if (typeFilterExist) {
        this.promoTable.activeFilters = this.promoTable.activeFilters.filter(f => f.key !== this.PROMO_CODE_FILTER.TYPE);
      }
    } else {
      // filter have some value
      let typeFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.TYPE);
      if (!typeFilterExist) {
        this.promoTable.activeFilters.push({
          key: this.PROMO_CODE_FILTER.TYPE,
          values: [selectedFilter]
        });
      } else {
        typeFilterExist.values = [selectedFilter]
      }
    }
    this.promoTable.pagination.curPage = 1;
    this.promoTable.pagination.itemCount = 0;
    this.getPromoList({
      sort: this.promoTable.sort,
      filters: this.promoTable.activeFilters,
      pagination: this.promoTable.pagination
    })

    // if (selectedFilters === 0 || selectedFilters === 1) {
    //   let data = this.promoDataRaw.filter(f => f.Type === selectedFilters);
    //   this.promoData = [...data];
    // } else {
    //   this.promoData = cloneDeep(this.promoDataRaw);
    // }
  }

  changeCategoryFilter(selectedFilters): void {
    // if (selectedFilters.length <= 0) {
    //   this.promoData = cloneDeep(this.promoDataRaw);
    // } else {
    //   let data = this.promoDataRaw.filter(promo => {
    //     var catFound = false;
    //     selectedFilters.forEach(filter => {
    //       const found = promo.Categories.find(category => category === filter)
    //       if (found) {
    //         catFound = true;
    //       }
    //     });
    //     return catFound;
    //   })
    //   this.promoData = [...data];
    // }
  }

  openPromoForm(): void {
    this.resetPromoForm();
    this.promoFormVisible = true;
    this.subscribeControls();
  }

  subscribeControls(): void {
    this.typeSelector = this.promoForm.controls.Type.valueChanges.subscribe((val) => {
      if (val === 0) {
        this.promoForm.controls.Categories.clearValidators();
        this.promoForm.controls.Categories.updateValueAndValidity();
        this.typeCatSelected = false;
      }
      if (val === 1) {
        this.promoForm.controls.Categories.setValidators(Validators.required);
        this.typeCatSelected = true;
      }
    })

    this.modeSelector = this.promoForm.controls.Mode.valueChanges.subscribe((val) => {
      if (typeof val === "number") {
        this.promoForm.controls.Value.reset();
        this.promoForm.controls.MaxAmount.reset();
        this.promoForm.controls.MinPurchaseAmount.reset();
      }
    })

    this.valueSelector = this.promoForm.controls.Value.valueChanges.subscribe((val) => {
      if (typeof val === "number") {
        if (this.promoForm.controls.Mode.value === 1) {
          if (val <= 0) {
            this.promoForm.controls.Value.setErrors({ 'incorrect': true });
          }
          this.promoForm.controls.MaxAmount.setValue(this.promoForm.controls.Value.value, { onlySelf: true, emitEvent: false, emitModelToViewChange: true })
        } else {
          if (val <= 0 || val > 100) {
            this.promoForm.controls.Value.setErrors({ 'incorrect': true });
          }
        }
      }
    })

    this.maxSelector = this.promoForm.controls.MaxAmount.valueChanges.subscribe((val) => {
      if (typeof val === "number") {
        if (val <= 0) {
          this.promoForm.controls.MaxAmount.setErrors({ 'incorrect': true });
        }
        if (this.promoForm.controls.Mode.value === 1) {
          this.promoForm.controls.Value.setValue(this.promoForm.controls.MaxAmount.value, { onlySelf: true, emitEvent: false, emitModelToViewChange: true })
        }
      }
    })

    this.minSelector = this.promoForm.controls.MinPurchaseAmount.valueChanges.subscribe((val) => {
      if (typeof val === "number") {
        if (val <= 0) {
          this.promoForm.controls.MinPurchaseAmount.setErrors({ 'incorrect': true });
        }
        // if (this.promoForm.controls.Mode.value === 1 && this.promoForm.controls.Value.value >= val) {
        //   this.promoForm.controls.MinPurchaseAmount.setErrors({ 'incorrect': true });
        // }
      }
    })

    this.startSelector = this.promoForm.controls.StartDate.valueChanges.subscribe((val) => {
      const startVal = moment(val).utc();
      const endVal = moment(this.promoForm.controls.EndDate.value).utc();
      if (endVal.isSame(startVal) || endVal.isBefore(startVal)) {
        this.promoForm.controls.EndDate.setErrors({ 'incorrect': true });
      }
    })

    this.redeemCountSelector = this.promoForm.controls.RedeemCount.valueChanges.subscribe((val) => {
      if (val === 0) {
        this.promoForm.controls.RedeemCount.setErrors({ 'incorrect': true });
      }
    })
  }

  unsubscribeControls(): void {
    if (this.typeSelector)
      this.typeSelector.unsubscribe();
    if (this.valueSelector)
      this.valueSelector.unsubscribe();
    if (this.maxSelector)
      this.maxSelector.unsubscribe();
  }

  checkNewCount(event: number): void {
    let found = this.countList.find(f => f.Value === event);
    if (event && !found) {
      this.newCountValid = true;
    } else {
      this.newCountValid = false;
    }
  }

  addNewCount(): void {
    this.countList.push({
      Label: this.newCount,
      Value: this.newCount
    });
    this.countList = [...this.countList];
    this.newCount = null;
    this.newCountValid = false;
  }

  closePromoForm(): void {
    this.resetPromoForm();
    this.promoFormVisible = false;
    this.loadingFlag = false;
  }

  resetPromoForm(): void {
    this.promoForm.reset();
    this.promoForm.controls.Type.setValue(0);
    this.promoForm.controls.Mode.setValue(0);
    this.promoForm.controls.StartDate.setValue(moment().startOf("day").toDate());
    var nextDay = moment().startOf("day").add(1, "day");
    this.promoForm.controls.EndDate.setValue(nextDay.toDate());
    this.updateMode = false;
    this.updatePromoId = null;
  }

  fillPromoForm(data): void {
    this.openPromoForm();
    let countFound = this.countList.find(f => f.Value === data.RedeemCount)
    if (!countFound) {
      this.countList.push({
        Label: data.RedeemCount,
        Value: data.RedeemCount
      })
    }
    if (!data.RedeemCount) {
      data.RedeemCount = "Unlimited";
    }
    console.log(data)
    this.promoForm.patchValue(data);
    this.updateMode = true;
    this.rawUpdateData = { ...data };
    this.updatePromoId = data.PromoCodeId;
  }

  submitPromo(): void {
    this.loadingFlag = true;
    let obj = { ...this.promoForm.value };
    var localStart = moment(obj.StartDate).format("YYYY-MM-DDTHH:mm:ss");
    localStart = localStart + "+02:00";
    obj.StartDate = moment(localStart).utc().format();
    var localEnd = moment(obj.EndDate).format("YYYY-MM-DDTHH:mm:ss");
    localEnd = localEnd + "+02:00";
    obj.EndDate = moment(localEnd).utc().format();
    if (obj.RedeemCount === "Unlimited") {
      obj.RedeemCount = null;
    }
    this.spinner.show();
    this.webapi.request(API.NEW_PROMO_CODE, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closePromoForm();
          this.spinner.hide();
          // this.promoData = [...data.body.Data];
          // this.setConstraints();
          // this.promoDataRaw = cloneDeep(this.promoData);
          // this.loadingFlag = false;
          this.loadPromoList();
        },
        error => {
          this.spinner.hide();
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

  loadPromoList() {
    this.getPromoList({
      filters: this.promoTable.activeFilters,
      pagination: {
        curPage: this.promoTable.pagination.curPage,
        size: this.promoTable.pagination.size
      },
      sort: this.promoTable.sort
    })
  }

  resetUpdateForm(): void {
    this.promoForm.patchValue(this.rawUpdateData);
  }

  disableStartDate = (selectedDate: Date): boolean => {
    var today = moment().utc().startOf("day");
    console.log(today.format())
    var selectedStart = moment(selectedDate).utc().startOf("day")
    console.log(selectedStart.format())
    if (today.isAfter(selectedStart)) {
      return true;
    } else if (today.isSame(selectedStart) || today.isBefore(selectedStart)) {
      return false;
    }
  }

  disableEndDate = (selectedDate: Date): boolean => {
    var startDate = moment(this.promoForm.controls.StartDate.value).utc();
    var selectedEnd = moment(selectedDate).utc().startOf("day")
    if (startDate.isAfter(selectedEnd) || startDate.isSame(selectedEnd)) {
      return true;
    } else {
      return false;
    }
  }

  updatePromo(): void {
    let obj = {
      PromoCodeId: this.updatePromoId,
      ...this.promoForm.value
    }
    if (this.promoForm.controls.Type.value === 0) {
      obj.Categories = [];
    }
    if (obj.RedeemCount === "Unlimited") {
      obj.RedeemCount = null;
    }
    this.spinner.show();
    this.webapi.request(API.UPDATE_PROMO_CODE, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closePromoForm();
          this.spinner.hide();
          // this.promoData = [...data.body.Data];
          // this.setConstraints();
          // this.promoDataRaw = cloneDeep(this.promoData);
          // this.loadingFlag = false;
          this.loadPromoList();
        },
        error => {
          this.spinner.hide();
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

  checkAll(value: boolean): void {
    this.promoData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.promoData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.PromoCodeId);
      }
    });
    this.anyChecked = this.promoData.some(e => e.checked);
    this.allChecked = this.promoData.every(e => e.checked);
  }

  deletePromo(promoId: number = null, multi = false): void {
    this.loadingFlag = true;
    let obj = {
      "DeletePromo": [promoId]
    }
    console.log(this.checkedData)
    if (multi) {
      obj.DeletePromo = [];
      obj.DeletePromo = this.checkedData;
    }
    this.webapi.request(API.DELETE_PROMO_CODE, obj)
      .subscribe(
        data => {
          this.loadingFlag = false;
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.loadPromoList();
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


  changeStartDateFilter(selectedFilter) {
    console.log(selectedFilter)
    this.startDateRangeCalled=selectedFilter
      // Check if filter is same as previous.
      let filterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.STARTDATE);
      if (selectedFilter === null ||selectedFilter.length<1) {
        // filter reset or clicked outside without applying.
        if (!filterExist) {
          return;
        }
      } else {
        // filter applied - check if its same as existing.
        if (filterExist && filterExist.values[0]==selectedFilter[0]&&filterExist.values[1]==selectedFilter[1]) {
          return;
        }
      }
  
      if (selectedFilter === null|| selectedFilter.length<1) {
        // filter reset
        let dateFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.STARTDATE);
        if (dateFilterExist) {
          this.promoTable.activeFilters = this.promoTable.activeFilters.filter(f => f.key !== this.PROMO_CODE_FILTER.STARTDATE);
        }
      } else {
        // filter have some value
        let dateFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.STARTDATE);
        if (!dateFilterExist) {
          this.promoTable.activeFilters.push({
            key: this.PROMO_CODE_FILTER.STARTDATE,
            values: selectedFilter
          });
        } else {
          dateFilterExist.values = selectedFilter
        }
      }
      this.promoTable.pagination.curPage = 1;
      this.promoTable.pagination.itemCount = 0;
      this.getPromoList({
        sort: this.promoTable.sort,
        filters: this.promoTable.activeFilters,
        pagination: this.promoTable.pagination
      })
  }

  changeEndDateFilter(selectedFilter) {
    this.endDateRangeCalled=selectedFilter
    // Check if filter is same as previous.
    let filterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.ENDDATE);
    if (selectedFilter === null ||selectedFilter.length<1) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist && filterExist.values[0]==selectedFilter[0]&&filterExist.values[1]==selectedFilter[1]) {
        return;
      }
    }

    if (selectedFilter === null || selectedFilter.length<1) {
      // filter reset
      let dateFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.ENDDATE);
      if (dateFilterExist) {
        this.promoTable.activeFilters = this.promoTable.activeFilters.filter(f => f.key !== this.PROMO_CODE_FILTER.ENDDATE);
      }
    } else {
      // filter have some value
      let dateFilterExist = this.promoTable.activeFilters.find(f => f.key === this.PROMO_CODE_FILTER.ENDDATE);
      if (!dateFilterExist) {
        this.promoTable.activeFilters.push({
          key: this.PROMO_CODE_FILTER.ENDDATE,
          values: selectedFilter
        });
      } else {
        dateFilterExist.values = selectedFilter
      }
    }
    this.promoTable.pagination.curPage = 1;
    this.promoTable.pagination.itemCount = 0;
    this.getPromoList({
      sort: this.promoTable.sort,
      filters: this.promoTable.activeFilters,
      pagination: this.promoTable.pagination
    })
}

resetStartDate(){
  
  this.startDateRange=[]
  this.startDateRangeCalled=[]
}
resetEndDate(){
  this.endDateRange=[]
  this.endDateRangeCalled=[]
}
  printForm(): void {
    console.log(this.promoForm.value)
  }

  
}
