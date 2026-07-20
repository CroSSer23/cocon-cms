import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import * as cloneDeep from "lodash/cloneDeep";
import { ToastyService } from 'ng2-toasty';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from "moment";
import { TableService } from '../shared/services/table.service';
import { LocationRequestService } from '../shared/services/location-request.service';
import { API } from '../shared/enums/apiNames.enum';

@Component({
  selector: 'app-location-request',
  templateUrl: './location-request.component.html',
  styleUrls: ['./location-request.component.css'],
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
export class LocationRequestComponent implements OnInit {
  locationData: any[];
  locationDataRaw: any[];
  loadingFlag: boolean;
  searchBoxValue: string;
  serviceArea: number;
  serviceFilterList: { text: string; value: number; byDefault: boolean; }[];
  DEFAULT_PAGE_SIZE: number;
  locationTable: { sort: { key: string; value: string; }; activeFilters: any[]; pagination: { curPage: number; size: number; itemCount: number; }; pagesData: any[]; };
  locationTablePageSizeOptions: number[];
  previousSearchValue: string;
  LOCATION_FILTER = {
    ADDRESS_FILTER: "addressStatus",
    DATERANGE:"dateRange"
  }
  locationListSubscription: any;
  dateRange: any[]=[];
  dateRangeCalled: any[]=[];
  visible:false;

  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private tableService: TableService,
    private locationReqService : LocationRequestService
  ) {
    this.DEFAULT_PAGE_SIZE = this.tableService.getDefaultPageSize();
    this.locationTablePageSizeOptions = [10, 20, 50, 100];
    this.locationTable = this.locationReqService.locationTable
    this.getLocationList({
      filters: [],
      pagination: {
        curPage: this.locationTable.pagination.curPage,
        size: this.DEFAULT_PAGE_SIZE
      },
      sort: this.locationTable.sort
    });
    this.serviceFilterList = [
      {
        text: "Got in service area",
        value: 0,
        byDefault: false
      },
      {
        text: "Out of service area",
        value: 1,
        byDefault: false
      },
      {
        text: "Unknown distance",
        value: 2,
        byDefault: false
      }
    ]
  }

  ngOnInit() {
    this.locationListSubscription = this.locationReqService.locationListChanges.subscribe(locationChanges => {
      this.locationTable.pagesData = cloneDeep(locationChanges.pagesData);
      let selPage = this.locationTable.pagesData.find(f => f.pageNum === locationChanges.pageNum);
      if (selPage) {
        this.locationData = cloneDeep(selPage.data);
      }
    });
  }

  getLocationList({
    sort,
    filters,
    pagination
  }) {
    let pageExist = this.locationTable.pagesData.find(f => f.pageNum === pagination.curPage);
    let currentIds = [];
    let lastUpdated = null;
    if (pageExist) {
      currentIds = pageExist.data.map(f => f.LocationRequestId);
      lastUpdated = pageExist.lastUpdated;
    } else {
      this.locationTable.pagesData.push({
        pageNum: pagination.curPage,
        data: [],
        lastUpdated: null
      })
    }
    this.loadingFlag = true;
    this.webapi.request(API.LOCATION_REQUEST, {
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
          this.serviceArea = data.body.Data.ServiceArea;
          this.loadingFlag = false;
          this.locationReqService.updatePagesData(data);
          // this.locationReqService.updatePagesData(data);
          // this.locationData = [...data.body.Data.LocationRequest];
          // this.locationData.forEach(element => {
          //   element.CreatedShow = moment(element.Created).format("DD MMM YYYY")
          // });
          // // this.locationDataRaw = cloneDeep(this.locationData);
          // this.locationTable.pagination.curPage = data.body.Pagination.Number;
          // this.locationTable.pagination.size = data.body.Pagination.Size;
          // this.locationTable.pagination.itemCount = data.body.TotalItems;
          // let pageExist = this.locationTable.pagesData.find(f => f.pageNum === this.locationTable.pagination.curPage);
          // if (pageExist) {
          //   this.locationData = this.tableService.setPageData(this.locationData, pageExist.data, data.body.CurrentIds, "LocationRequestId");
          //   pageExist.data = cloneDeep(this.locationData);
          //   pageExist.lastUpdated = data.body.LastUpdated;
          // } else {
          //   this.locationTable.pagesData.push({
          //     pageNum: this.locationTable.pagination.curPage,
          //     data: cloneDeep(this.locationData),
          //     lastUpdated: data.body.LastUpdated
          //   })
          // }
        },
        error => {
          this.loadingFlag = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  // Used to search for input value
  onKeyUp(): void {
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchLocation("");
    }
  }

  resetSearch(): void {
    this.searchBoxValue = "";
    if (this.searchBoxValue !== this.previousSearchValue) {
      this.searchLocation("");
    }
  }

  searchLocation(value: string): void {
    if (this.searchBoxValue === this.previousSearchValue) {
      return;
    }
    this.previousSearchValue = this.searchBoxValue;
    this.locationTable.activeFilters = [];
    this.locationTable.sort = {
      key: "",
      value: ""
    }
    this.locationTable.pagination = {
      curPage: 1,
      itemCount: this.locationTable.pagination.itemCount,
      size: this.locationTable.pagination.size
    }
    let val: string;
    val = value.toLowerCase();
    this.getLocationList({
      sort: this.locationTable.sort,
      filters: this.locationTable.activeFilters,
      pagination: this.locationTable.pagination
    })
  }

  changePageNumber(event) {
    this.loadingFlag = true;
    this.getLocationList({
      sort: {
        key: this.locationTable.sort.key,
        value: this.locationTable.sort.value,
      },
      filters: this.locationTable.activeFilters,
      pagination: {
        curPage: event,
        size: this.locationTable.pagination.size
      }
    })
  }

  changePageSize(event) {
    this.locationTable.pagination.curPage = 1;
    this.loadingFlag = true;
    this.getLocationList({
      sort: {
        key: this.locationTable.sort.key,
        value: this.locationTable.sort.value,
      },
      filters: this.locationTable.activeFilters,
      pagination: {
        curPage: this.locationTable.pagination.curPage,
        size: event
      }
    })
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    let { key, value } = sort;
    if (key) {
      // currentTab.activeFilters = [];
      this.locationTable.sort = {
        key,
        value: value === "ascend" ? "ascending" : "descending",
      }
      if (value === null) {
        this.locationTable.sort = {
          key: "",
          value: ""
        }
      }
      this.locationTable.pagination.curPage = 1;
      this.locationTable.pagination.itemCount = 0;
      this.getLocationList({
        sort: this.locationTable.sort,
        filters: this.locationTable.activeFilters,
        pagination: this.locationTable.pagination
      })
    }
  }

  changeFilter(selectedFilter) {
    // Check if filter is same as previous.
    let filterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.ADDRESS_FILTER);
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
      let serviceFilterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.ADDRESS_FILTER);
      if (serviceFilterExist) {
        this.locationTable.activeFilters = this.locationTable.activeFilters.filter(f => f.key !== this.LOCATION_FILTER.ADDRESS_FILTER);
      }
    } else {
      // filter have some value
      let serviceFilterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.ADDRESS_FILTER);
      if (!serviceFilterExist) {
        this.locationTable.activeFilters.push({
          key: this.LOCATION_FILTER.ADDRESS_FILTER,
          values: [selectedFilter]
        });
      } else {
        serviceFilterExist.values = [selectedFilter]
      }
    }
    this.locationTable.pagination.curPage = 1;
    this.locationTable.pagination.itemCount = 0;
    this.getLocationList({
      sort: this.locationTable.sort,
      filters: this.locationTable.activeFilters,
      pagination: this.locationTable.pagination
    })
    // console.log(event);
    // if (event === null) {
    //   this.locationData = [];
    //   this.locationData = cloneDeep(this.locationDataRaw);
    // } else if (event === 1) {
    //   let data = this.locationDataRaw.filter(f => !f.InServiceArea)
    //   this.locationData = [...data];
    // } else if (event === 2) {
    //   let data = this.locationDataRaw.filter(f => !f.Distance)
    //   this.locationData = [...data];
    // } else {
    //   let data = this.locationDataRaw.filter(f => f.InServiceArea)
    //   this.locationData = [...data];
    // }
  }

  resetDateFilter(){
  
    this.dateRange=[]
    this.dateRangeCalled=[]
  }
  

  changeDateFilter(selectedFilter) {
    this.dateRangeCalled=selectedFilter
    // Check if filter is same as previous.
    let filterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.DATERANGE);
    if (selectedFilter === null || selectedFilter.length<1) {
      // filter reset or clicked outside without applying.
      if (!filterExist) {
        return;
      }
    } else {
      // filter applied - check if its same as existing.
      if (filterExist && filterExist.values[0]==selectedFilter[0]&&filterExist.values[1]==selectedFilter[1]){
        return;
      }
    }

    if (selectedFilter === null || selectedFilter.length<1) {
      // filter reset
      let dateFilterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.DATERANGE);
      if (dateFilterExist) {
        this.locationTable.activeFilters = this.locationTable.activeFilters.filter(f => f.key !== this.LOCATION_FILTER.DATERANGE);
      }
    } else {
      // filter have some value
      let dateFilterExist = this.locationTable.activeFilters.find(f => f.key === this.LOCATION_FILTER.DATERANGE);
      if (!dateFilterExist) {
        this.locationTable.activeFilters.push({
          key: this.LOCATION_FILTER.DATERANGE,
          values: selectedFilter
        });
      } else {
        dateFilterExist.values = selectedFilter
      }
    }
    this.locationTable.pagination.curPage = 1;
    this.locationTable.pagination.itemCount = 0;
    this.getLocationList({
      sort: this.locationTable.sort,
      filters: this.locationTable.activeFilters,
      pagination: this.locationTable.pagination
    })
    // console.log(event);
    // if (event === null) {
    //   this.locationData = [];
    //   this.locationData = cloneDeep(this.locationDataRaw);
    // } else if (event === 1) {
    //   let data = this.locationDataRaw.filter(f => !f.InServiceArea)
    //   this.locationData = [...data];
    // } else if (event === 2) {
    //   let data = this.locationDataRaw.filter(f => !f.Distance)
    //   this.locationData = [...data];
    // } else {
    //   let data = this.locationDataRaw.filter(f => f.InServiceArea)
    //   this.locationData = [...data];
    // }
  }

}