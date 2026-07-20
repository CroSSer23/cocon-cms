import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { ToastyService } from 'ng2-toasty';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { WebService } from '../shared/services/web.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  themeColors = this.colorConfig.get().colors;
  brandPrimary = this.themeColors.brandPrimary;
  brangLight = this.themeColors.brandLight;
  blue = this.themeColors.blue;
  blueLight = this.themeColors.blueLight;
  cyan = this.themeColors.cyan;
  cyanLight = this.themeColors.cyanLight;
  gold = this.themeColors.gold;
  purple = this.themeColors.purple;
  purpleLight = this.themeColors.purpleLight;
  red = this.themeColors.red;
  bookingAnalyticsMonth: Date;

  // Booking Analytics Chart config
  bookingAnalyticsChartOptions: any = {
    maintainAspectRatio: false,
    responsive: true,
    hover: {
      mode: 'nearest',
      intersect: true
    },
    tooltips: {
      mode: 'index'
    },
    scales: {
      xAxes: [{
        gridLines: [{
          display: false,
        }],
        ticks: {
          display: true,
          fontColor: this.themeColors.grayLight,
          fontSize: 13,
          padding: 10
        }
      }],
      yAxes: [{
        gridLines: {
          drawBorder: false,
          drawTicks: false,
          borderDash: [3, 4],
          zeroLineWidth: 1,
          zeroLineBorderDash: [3, 4]
        },
        ticks: {
          display: true,
          fontColor: this.themeColors.grayLight,
          fontSize: 13,
          padding: 10
        }
      }],
    }
  };
  bookingAnalyticsChartLabels: string[] = [];
  bookingAnalyticsChartType = 'line';
  bookingAnalyticsChartLegend = false;
  bookingAnalyticsChartColors: Array<any> = [
    {
      backgroundColor: this.themeColors.transparent,
      borderColor: this.blue,
      pointBackgroundColor: this.blue,
      pointBorderColor: this.themeColors.white,
      pointHoverBackgroundColor: this.blueLight,
      pointHoverBorderColor: this.blueLight
    }
  ];
  bookingAnalyticsChartData: any[] = [
    {
      data: [],
      label: 'Bookings'
    }
  ];
  bookedToday: number;
  bookingServeToday: any;

  // Sales Analytics Chart config
  salesAnalyticsChartOptions: any = {
    maintainAspectRatio: false,
    responsive: true,
    hover: {
      mode: 'nearest',
      intersect: true
    },
    tooltips: {
      mode: 'index'
    },
    scales: {
      xAxes: [{
        gridLines: [{
          display: false,
        }],
        ticks: {
          display: true,
          fontColor: this.themeColors.grayLight,
          fontSize: 13,
          padding: 10
        }
      }],
      yAxes: [{
        gridLines: {
          drawBorder: false,
          drawTicks: false,
          borderDash: [3, 4],
          zeroLineWidth: 1,
          zeroLineBorderDash: [3, 4]
        },
        ticks: {
          display: true,
          fontColor: this.themeColors.grayLight,
          fontSize: 13,
          padding: 10
        }
      }],
    }
  }
  salesAnalyticsChartLabels: string[] = [];
  salesAnalyticsChartType = 'line';
  salesAnalyticsChartLegend = false;
  salesAnalyticsChartColors: Array<any> = [
    {
      backgroundColor: this.themeColors.transparent,
      borderColor: this.blue,
      pointBackgroundColor: this.blue,
      pointBorderColor: this.themeColors.white,
      pointHoverBackgroundColor: this.blueLight,
      pointHoverBorderColor: this.blueLight
    }
  ];
  salesAnalyticsChartData: any[] = [
    {
      data: [],
      label: 'Sales'
    }
  ];

  // User analytics config
  customersChartLabels: string[] = ['Customers', 'Fresh users'];
  customersChartData: number[] = [];
  customersChartColors: Array<any> = [{
    backgroundColor: [this.cyan, this.purple],
    pointBackgroundColor: [this.cyan, this.purple]
  }];
  customersChartOptions: any = {
    cutoutPercentage: 75,
    maintainAspectRatio: false
  }
  customersChartType = 'doughnut';
  customers: number;
  clientRetentionRate: number;
  signedUpUsers: number;
  productList: any[];
  salesAnalyticsMonth: Date;
  bookingChartFormat: string;
  salesChartFormat: string;
  isBookingSpinning: boolean;
  isSalesSpinning: boolean;
  isUserSpinning: boolean;
  isProductSpinning: boolean;
  salesShow: number;
  bookingsShow: number;
  rawBookingAnalyticsData: any;
  DAY_LABEL_FORMAT = "D";
  WEEK_DAY_FORMAT = "ddd D MMM";
  selectedRetentionMonth: Date;
  retenLoading: boolean;
  globalMonth: Date;
  selectedRange: Date[];

  constructor(
    private colorConfig: ThemeConstantService,
    private webapi: WebService,
    private toast: ToastyService,
    private router: Router
  ) {
    this.bookingAnalyticsMonth = moment().toDate();
    this.salesAnalyticsMonth = moment().toDate();
    this.selectedRange = [
      moment().startOf("month").toDate(),
      moment().endOf("month").toDate()
    ]
    this.selectedRetentionMonth = moment().toDate();
    this.globalMonth = moment().toDate();
    this.bookingChartFormat = "1";
    this.salesChartFormat = "1";
    this.salesShow = 0;
    this.bookingsShow = 0;
  }

  ngOnInit() {
    this.getBookingAnalytics(this.selectedRange[0], this.selectedRange[1], this.salesAnalyticsMonth, true, true);
    this.getUserAnalytics();
    this.getProductAnalytics();
  }

  onRangeChange(event: Date[]) {
    this.getBookingAnalytics(event[0], event[1], this.salesAnalyticsMonth, true, true);
    this.selectedRange = [event[0], event[1]];
    this.getUserAnalytics();
  }

  changeGlobalMonth(date: Date) {
    this.bookingAnalyticsMonth = date;
    this.salesAnalyticsMonth = date;
    this.selectedRetentionMonth = date;
    this.bookingChartFormat = "1";
    this.salesChartFormat = "1";
    // this.getBookingAnalytics(date, date, true, true);
    this.getUserAnalytics(false);
  }

  getBookingAnalytics(bookingStartDate: Date, bookingEndDate: Date, salesMonth: Date, showBookingLoad = true, showSalesLoad = true) {
    if (showBookingLoad) {
      this.isBookingSpinning = true;
    }
    if (showSalesLoad) {
      this.isSalesSpinning = true;
    }
    let obj = {
      BookingStartDate: moment(bookingStartDate).startOf("day").format(),
      BookingEndDate: moment(bookingEndDate).endOf("day").format(),
      SalesMonth: moment(salesMonth).format("MM/YYYY")
    }
    this.webapi.request("getBookingAnalytics", obj)
      .subscribe(
        data => {
          this.rawBookingAnalyticsData = { ...data.body.Data };
          this.setBookingChartData(null);
          if (this.isBookingSpinning) {
            this.isBookingSpinning = false;
          }
          this.setSalesChartData(null);
          if (this.isSalesSpinning) {
            this.isSalesSpinning = false;
          }
        },
        error => {
          console.log(error)
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  changeRetentionMonth(date: Date) {
    this.selectedRetentionMonth = date;
    this.getUserAnalytics(false);
  }

  getUserAnalytics(showLoader = true) {
    let obj = {
      RetentionStart: moment(this.selectedRange[0]),
      RetentionEnd: moment(this.selectedRange[1])
    };
    if (showLoader) {
      this.isUserSpinning = true;
    }
    this.retenLoading = true;
    this.webapi.request("getUserAnalytics", obj)
      .subscribe(
        data => {
          if (this.isUserSpinning) {
            this.isUserSpinning = false;
          }
          this.retenLoading = false;
          let response = { ...data.body.Data };
          this.customers = response.Customers;
          this.signedUpUsers = response.SignedUpUsers;
          this.clientRetentionRate = response.ClientRetentionRate;
          this.customersChartData = [];
          this.customersChartData = [this.customers, this.signedUpUsers];
        },
        error => {
          console.log(error)
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  getProductAnalytics() {
    let obj = null;
    this.isProductSpinning = true;
    this.webapi.request("getProductAnalytics", obj)
      .subscribe(
        data => {
          this.isProductSpinning = false;
          let response = { ...data.body.Data };
          this.productList = response.TopProducts;
        },
        error => {
          console.log(error)
          this.toast.error({
            title: "Error",
            msg: error.headers.get("message"),
            timeout: 3000,
            theme: "bootstrap"
          })
        }
      )
  }

  disableBookingWeek = (date: Date): boolean => {
    let monthStart = moment(this.bookingAnalyticsMonth).startOf("month");
    let monthEnd = moment(this.bookingAnalyticsMonth).endOf("month");
    let selDate = moment(date);
    if (selDate.isBefore(monthStart) || selDate.isAfter(monthEnd)) {
      return true;
    } else {
      return false;
    }
  }

  disableSalesWeek = (date: Date): boolean => {
    let monthStart = moment(this.salesAnalyticsMonth).startOf("month");
    let monthEnd = moment(this.salesAnalyticsMonth).endOf("month");
    let selDate = moment(date);
    if (selDate.isBefore(monthStart) || selDate.isAfter(monthEnd)) {
      return true;
    } else {
      return false;
    }
  }

  setBookingChartData(weekDate: null | Date) {
    this.bookedToday = this.rawBookingAnalyticsData.BookedToday;
    this.bookingServeToday = this.rawBookingAnalyticsData.BookingServeToday;
    if (weekDate === null) {
      this.bookingsShow = 0;
      this.bookingAnalyticsChartData = [];
      this.bookingAnalyticsChartLabels = [];
      this.rawBookingAnalyticsData.MonthlyBookings.forEach(element => {
        this.bookingAnalyticsChartLabels.push(element.DateShow);
        this.bookingAnalyticsChartData.push(element.Count);
        this.bookingsShow += element.Count;
      });
    } else {
      let weekStart = moment(weekDate).startOf("week");
      if (weekStart.month() !== moment(weekDate).month()) {
        weekStart = moment(weekDate).startOf("month");
      }
      this.bookingAnalyticsMonth = weekStart.toDate();
      let weekEnd = moment(weekDate).endOf("week");
      if (weekEnd.month() !== moment(weekDate).month()) {
        weekEnd = moment(weekDate).endOf("month");
      }
      let weekStLabelIndex = this.rawBookingAnalyticsData.MonthlyBookings.findIndex(f => f.DateShow === weekStart.format(this.DAY_LABEL_FORMAT));
      let weekEnLabelIndex = this.rawBookingAnalyticsData.MonthlyBookings.findIndex(f => f.DateShow === weekEnd.format(this.DAY_LABEL_FORMAT));
      this.bookingsShow = 0;
      this.bookingAnalyticsChartData = [];
      this.bookingAnalyticsChartLabels = [];
      for (let dayInc = weekStLabelIndex; dayInc <= weekEnLabelIndex; dayInc++) {
        let element = this.rawBookingAnalyticsData.MonthlyBookings[dayInc];
        this.bookingAnalyticsChartLabels.push(moment(element.Date).format(this.WEEK_DAY_FORMAT));
        this.bookingAnalyticsChartData.push(element.Count);
        this.bookingsShow += element.Count;
      }
    }
  }

  setSalesChartData(weekDate: null | Date) {
    if (weekDate === null) {
      this.salesShow = 0;
      this.salesAnalyticsChartData = [];
      this.salesAnalyticsChartLabels = [];
      this.rawBookingAnalyticsData.MonthlySales.forEach(element => {
        this.salesAnalyticsChartLabels.push(element.DateShow);
        this.salesAnalyticsChartData.push(element.Count);
        this.salesShow += element.Count;
      });
    } else {
      let weekStart = moment(weekDate).startOf("week");
      if (weekStart.month() !== moment(weekDate).month()) {
        weekStart = moment(weekDate).startOf("month");
      }
      this.salesAnalyticsMonth = weekStart.toDate();
      let weekEnd = moment(weekDate).endOf("week");
      if (weekEnd.month() !== moment(weekDate).month()) {
        weekEnd = moment(weekDate).endOf("month");
      }
      let weekStLabelIndex = this.rawBookingAnalyticsData.MonthlySales.findIndex(f => f.DateShow === weekStart.format(this.DAY_LABEL_FORMAT));
      let weekEnLabelIndex = this.rawBookingAnalyticsData.MonthlySales.findIndex(f => f.DateShow === weekEnd.format(this.DAY_LABEL_FORMAT));
      this.salesShow = 0;
      this.salesAnalyticsChartData = [];
      this.salesAnalyticsChartLabels = [];
      for (let dayInc = weekStLabelIndex; dayInc <= weekEnLabelIndex; dayInc++) {
        let element = this.rawBookingAnalyticsData.MonthlySales[dayInc];
        this.salesAnalyticsChartLabels.push(moment(element.Date).format(this.WEEK_DAY_FORMAT));
        this.salesAnalyticsChartData.push(element.Count);
        this.salesShow += element.Count;
      }
    }
  }

  changeBookingMonth(date: Date) {
    // this.getBookingAnalytics(date, this.salesAnalyticsMonth, true, false);
  }

  changeBookingWeek(date: Date) {
    this.setBookingChartData(date)
  }

  changeSalesWeek(date: Date) {
    this.setSalesChartData(date);
  }

  changeSalesMonth(date: Date) {
    // this.getBookingAnalytics(this.bookingAnalyticsMonth, date, false, true);
  }

  changeBookingAnalyticsFormat() {
    if (this.bookingChartFormat === "0") {
      this.changeBookingWeek(moment(this.bookingAnalyticsMonth).startOf("month").toDate());
    } else {
      this.setBookingChartData(null);
    }
  }

  changeSalesAnalyticsFormat() {
    if (this.salesChartFormat === "0") {
      this.changeSalesWeek(moment(this.salesAnalyticsMonth).startOf("month").toDate())
    } else {
      this.setSalesChartData(null);
    }
  }

  seeAllProducts() {
    this.router.navigate(['/product']);
  }

  seeAllUsers() {
    this.router.navigate(['/user']);
  }
}