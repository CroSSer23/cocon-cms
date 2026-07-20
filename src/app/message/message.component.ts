import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { ToastyService } from 'ng2-toasty';
import * as clonedeep from "lodash/cloneDeep";
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from "moment";
import * as momentz from "moment-timezone";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from "src/environments/environment";
import { TableService } from '../shared/services/table.service';
import * as cloneDeep from 'lodash/cloneDeep';
import { MessageService } from '../shared/services/message.service';
import { API } from '../shared/enums/apiNames.enum';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
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
export class MessageComponent implements OnInit {
  loadingFlag: boolean;
  messageData: any;
  messageDataRaw: any;
  sortName: string;
  sortValue: string;
  messageForm: FormGroup
  updateMode: boolean;
  messageFormVisible: boolean;
  descChars: number;
  descSubs: any;
  rawUpdateData: any;
  updateMessageId: any;
  checkedData: number[];
  anyChecked: any;
  allChecked: any;
  messageTypeList: { Type: number; Name: string; }[];
  selectedType: number;
  applyFilter: boolean;
  showFilters: boolean;
  typeSubscriber: any;
  applyFilterSubscriber: any;
  filterTypeList: { Type: number; Name: string; }[];
  showRangeSelector: boolean;
  filterTypeSubscriber: any;
  showCategorySelector: boolean;
  metadata: any;
  categoryList: any;
  categoryFilterList: any[];
  DEFAULT_PAGE_SIZE: number;
  messageTablePageSizeOptions: number[];
  messageTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }; pagesData: any[] };
  searchBoxValue: any;
  previousSearchValue: any;
  MESSAGE_FILTER = {
    MESSAGE_TYPE: "messageType",
    DATERANGE:"dateRange"
  }
  messageListSubscription: any;
  dateRange:any[]=[];
  dateRangeCalled:any[]=[];
  visible:false;
  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private tableService: TableService,
    private messageService: MessageService
  ) {
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    this.messageTablePageSizeOptions = [10, 20, 50, 100];
    this.messageTable = this.messageService.messageTable;
    this.getMessageList({
      filters: [],
      pagination: {
        curPage: this.messageTable.pagination.curPage,
        size: this.DEFAULT_PAGE_SIZE
      },
      sort: this.messageTable.sort
    });
    this.messageForm = this.fb.group({
      Type: [null, [Validators.required]],
      Title: [null, [Validators.required]],
      Description: [null, [Validators.required]],
      ApplyFilter: [false],
      FilterType: [null],
      DateRange: [null],
      Categories: [null],
    });
    this.messageTypeList = [
      {
        Type: 0,
        Name: "User"
      },
      {
        Type: 1,
        Name: "Staff"
      },
      {
        Type: 4,
        Name: "Guest"
      },
      {
        Type: 2,
        Name: "All"
      }
    ];
    this.selectedType = 2;
    this.filterTypeList = [
      {
        Type: 0,
        Name: "Users not booked"
      },
      {
        Type: 1,
        Name: "Users not booked in XX days"
      },
      {
        Type: 2,
        Name: "Users booked XXX category in last XX days"
      },
      {
        Type: 3,
        Name: "Users not booked XXX category in the last XX days"
      },
    ];
  }

  ngOnInit() {
    this.resetFiltersUI();
    this.getMetadata();
    this.messageListSubscription = this.messageService.messageListChanges.subscribe(messageChanges => {
      this.messageTable.pagesData = cloneDeep(messageChanges.pagesData);
      let selPage = this.messageTable.pagesData.find(f => f.pageNum === messageChanges.pageNum);
      if (selPage) {
        this.messageData = cloneDeep(selPage.data);
      }
    });
  }

  resetFiltersUI() {
    this.applyFilter = false;
    this.showFilters = false;
    this.showRangeSelector = false;
    this.showCategorySelector = false;
  }

  getMessageList({
    sort,
    filters,
    pagination
  }): void {
    let pageExist = this.messageTable.pagesData.find(f => f.pageNum === pagination.curPage);
    let currentIds = [];
    let lastUpdated = null;
    if (pageExist) {
      currentIds = pageExist.data.map(f => f.MessageId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      this.messageTable.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
    this.loadingFlag = true;
    this.webapi.request(API.MESSAGE, {
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
          this.messageService.updatePagesData(data);
          // this.messageData = [];
          // this.messageData = [...data.body.Data];
          // this.messageData.forEach(element => {
          //   element.DateShow = momentz.tz(element.Date, environment.STAFF_ZONE).format("MMM DD YYYY, HH:mm z");
          // });
          // // this.messageDataRaw = clonedeep(this.messageData);
          // this.messageTable.pagination.curPage = data.body.Pagination.Number;
          // this.messageTable.pagination.size = data.body.Pagination.Size;
          // this.messageTable.pagination.itemCount = data.body.TotalItems;
          // let pageExist = this.messageTable.pagesData.find(f => f.pageNum === this.messageTable.pagination.curPage);
          // if (pageExist) {
          //   this.messageData = this.tableService.setPageData(this.messageData, pageExist.data, data.body.CurrentIds, "MessageId");
          //   pageExist.data = cloneDeep(this.messageData);
          //   pageExist.lastUpdated = data.body.LastUpdated;
          // } else {
          //   this.messageTable.pagesData.push({
          //     pageNum: this.messageTable.pagination.curPage,
          //     data: cloneDeep(this.messageData),
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

  getMetadata(): void {
    // this.loadingFlag = true;
    this.webapi.request(API.METADATA, {
      Metadata: ["Category", "PageSizeOptions"]
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          this.categoryList = this.metadata['Category'];
          this.categoryFilterList = [];
          this.categoryList.forEach(element => {
            this.categoryFilterList.push({
              text: element.Name,
              value: element.CategoryId,
              byDefault: false
            })
          });
        },
        error => {
          // this.loadingFlag = false;
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


  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchMessage("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchMessage("");
    }
  }

  searchMessage(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.messageTable.activeFilters = [];
    this.messageTable.sort = {
      key: "",
      value: ""
    }
    this.messageTable.pagination = {
      curPage: 1,
      itemCount: this.messageTable.pagination.itemCount,
      size: this.messageTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    this.getMessageList({
      sort: this.messageTable.sort,
      filters: this.messageTable.activeFilters,
      pagination: this.messageTable.pagination
    })
  }

  changePageNumber(event) {
    console.log(event)
    this.loadingFlag = true;
    this.getMessageList({
      sort: {
        key: this.messageTable.sort.key,
        value: this.messageTable.sort.value,
      },
      filters: this.messageTable.activeFilters,
      pagination: {
        curPage: event,
        size: this.messageTable.pagination.size
      }
    })
  }

  changePageSize(event) {
    this.messageTable.pagination.curPage = 1;
    this.loadingFlag = true;
    this.getMessageList({
      sort: {
        key: this.messageTable.sort.key,
        value: this.messageTable.sort.value,
      },
      filters: this.messageTable.activeFilters,
      pagination: {
        curPage: this.messageTable.pagination.curPage,
        size: event
      }
    })
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.messageTable.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.messageTable.sort = {
          key: "",
          value: ""
        }
      }
      this.messageTable.pagination.curPage = 1;
      this.messageTable.pagination.itemCount = 0;
      this.getMessageList({
        sort: this.messageTable.sort,
        filters: this.messageTable.activeFilters,
        pagination: this.messageTable.pagination
      })
    }
  }

  changeView(selectedFilter) {
    // Check if filter is same as previous.
    let filterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.MESSAGE_TYPE);
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
      let messageTypeFilterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.MESSAGE_TYPE);
      if (messageTypeFilterExist) {
        this.messageTable.activeFilters = this.messageTable.activeFilters.filter(f => f.key !== this.MESSAGE_FILTER.MESSAGE_TYPE);
      }
    } else {
      // filter have some value
      let messageTypeFilterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.MESSAGE_TYPE);
      if (!messageTypeFilterExist) {
        this.messageTable.activeFilters.push({
          key: this.MESSAGE_FILTER.MESSAGE_TYPE,
          values: [selectedFilter]
        });
      } else {
        messageTypeFilterExist.values = [selectedFilter]
      }
    }
    this.messageTable.pagination.curPage = 1;
    this.messageTable.pagination.itemCount = 0;
    this.getMessageList({
      sort: this.messageTable.sort,
      filters: this.messageTable.activeFilters,
      pagination: this.messageTable.pagination
    })

    // if (event !== 2) {
    //   this.messageData = this.messageDataRaw.filter(f => f.Type === event);
    // } else {
    //   this.messageData = clonedeep(this.messageDataRaw);
    // }
  }

  openMessageForm(): void {
    this.resetMessageForm();
    this.messageFormVisible = true;
    this.descChars = 150;
    this.descSubs = this.messageForm.get("Description").valueChanges.subscribe(val => {
      if (val) {
        this.descChars = 150 - val.length
      }
    });

    this.typeSubscriber = this.messageForm.controls.Type.valueChanges.subscribe((val) => {
      this.applyFilter = val === 0;
      if (val !== 0) {
        this.messageForm.controls.ApplyFilter.reset()
        this.resetFilterForm();
      }
    });

    this.applyFilterSubscriber = this.messageForm.controls.ApplyFilter.valueChanges.subscribe((val) => {
      this.showFilters = val;
      if (!val) {
        this.resetFilterForm();
      }
    });

    this.filterTypeSubscriber = this.messageForm.controls.FilterType.valueChanges.subscribe((val) => {
      this.showRangeSelector = val !== 0;
      this.showCategorySelector = val > 1;
    });
  }

  resetFilterForm() {
    this.messageForm.controls.FilterType.reset();
    this.messageForm.controls.DateRange.reset();
    this.messageForm.controls.Categories.reset();

    this.showFilters = false;
    this.showRangeSelector = false;
    this.showCategorySelector = false;
  }

  checkAll(value: boolean): void {
    this.messageData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.messageData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.MessageId);
      }
    });
    this.anyChecked = this.messageData.some(e => e.checked);
    this.allChecked = this.messageData.every(e => e.checked);
  }

  deleteMessage(messageId: number = null, multi = false): void {
    let obj = {
      DeleteMessage: [messageId]
    }
    if (multi) {
      obj.DeleteMessage = [];
      obj.DeleteMessage = this.checkedData;
    }
    this.loadingFlag = true;
    this.webapi.request(API.DELETE_MESSAGE, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          // this.messageData = [...data.body.Data];
          // this.messageData.forEach(element => {
          //   element.DateShow = moment(element.Date).format("MMM DD YYYY, h:mm");
          // });
          // this.messageDataRaw = clonedeep(this.messageData);
          this.loadMessageList();
          this.toast.success({
            title: "Success",
            msg,
            timeout: 3000,
            theme: 'bootstrap'
          })
          this.checkAll(false);
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

  resetMessageForm(): void {
    this.messageForm.reset();
    this.messageForm.controls.Type.enable();
    this.updateMode = false;
    this.rawUpdateData = null;
    this.updateMessageId = null;
    this.resetFiltersUI();
  }

  closeMessageForm(): void {
    this.resetMessageForm();
    this.messageFormVisible = false;

    this.descSubs.unsubscribe();
    this.typeSubscriber.unsubscribe();
    this.applyFilterSubscriber.unsubscribe();
    this.filterTypeSubscriber.unsubscribe();
  }

  fillMessageForm(data): void {
    this.openMessageForm();
    this.messageForm.patchValue(data);
    this.messageForm.controls.Type.disable();
    this.updateMode = true;
    this.rawUpdateData = { ...data };
    this.updateMessageId = data.MessageId;
  }

  resetUpdateForm(): void {
    this.messageForm.patchValue(this.rawUpdateData);
  }

  submitMessage(): void {
    let obj = { ...this.messageForm.value };
    if (obj.DateRange) {
      obj.StartDate = moment(obj.DateRange[0]).format("YYYY-MM-DD");
      obj.EndDate = moment(obj.DateRange[1]).format("YYYY-MM-DD");
    }

    if (obj.Type !== 0 || !obj.ApplyFilter) {
      obj.ApplyFilter = false;
      obj.FilterType = null;
      obj.DateRange = null;
      obj.Categories = null;
    }

    if (obj.ApplyFilter && obj.FilterType !== 0 && (
      !obj.StartDate ||
      !obj.EndDate ||
      (obj.FilterType >= 2 && (obj.Categories == null || obj.Categories.length === 0)))
    ) {
      this.toast.error({
        title: "Error",
        msg: "Please fill all the required fields.",
        theme: 'bootstrap',
        timeout: 3000
      })
      return;
    }

    this.spinner.show();
    this.webapi.request(API.NEW_MESSAGE, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.loadingFlag = true;
          // this.messageData = [...data.body.Data];
          // this.messageData.forEach(element => {
          //   element.DateShow = moment(element.Date).format("MMM DD YYYY, h:mm");
          // });
          // this.messageDataRaw = clonedeep(this.messageData);
          this.spinner.hide();
          this.closeMessageForm();
          this.loadMessageList();
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.loadingFlag = false;
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
  loadMessageList() {
    this.getMessageList({
      filters: this.messageTable.activeFilters,
      pagination: {
        curPage: this.messageTable.pagination.curPage,
        size: this.messageTable.pagination.size
      },
      sort: this.messageTable.sort
    })
  }

  updateMessage(): void {
    this.spinner.show();
    let obj = {
      MessageId: this.updateMessageId,
      ...this.messageForm.value
    }
    obj.Type = this.messageForm.controls.Type.value;
    this.webapi.request(API.UPDATE_MESSAGE, obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.loadingFlag = true;

          // this.messageData = [...data.body.Data];
          // this.messageData.forEach(element => {
          //   element.DateShow = moment(element.Date).format("MMM DD YYYY, h:mm");
          // });
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.spinner.hide();
          this.closeMessageForm();
          // this.messageDataRaw = clonedeep(this.messageData);
          this.loadMessageList();
          this.loadingFlag = false;
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

  resetDateFilter(){
  
    this.dateRange=[]
    this.dateRangeCalled=[]
  }

  changeDateFilter(selectedFilter) {
    this.dateRangeCalled=selectedFilter
    // Check if filter is same as previous.
    let filterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.DATERANGE);
    if (selectedFilter === null || selectedFilter.length<1) {
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

    if (selectedFilter === null || selectedFilter.length<1 ) {
      // filter reset
      let dateFilterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.DATERANGE);
      if (dateFilterExist) {
        this.messageTable.activeFilters = this.messageTable.activeFilters.filter(f => f.key !== this.MESSAGE_FILTER.DATERANGE);
      }
    } else {
      // filter have some value
      let dateFilterExist = this.messageTable.activeFilters.find(f => f.key === this.MESSAGE_FILTER.DATERANGE);
      if (!dateFilterExist) {
        this.messageTable.activeFilters.push({
          key: this.MESSAGE_FILTER.DATERANGE,
          values: selectedFilter
        });
      } else {
        dateFilterExist.values = selectedFilter
      }
    }
    console.log(this.messageTable.activeFilters)
    this.messageTable.pagination.curPage = 1;
    this.messageTable.pagination.itemCount = 0;
    this.getMessageList({
      sort: this.messageTable.sort,
      filters: this.messageTable.activeFilters,
      pagination: this.messageTable.pagination
    })
}
}