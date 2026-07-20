import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastyService } from 'ng2-toasty';
import { WebService } from '../shared/services/web.service';
import * as clonedeep from "lodash/cloneDeep";
import * as moment from "moment";

@Component({
  selector: 'app-tip',
  templateUrl: './tip.component.html',
  styleUrls: ['./tip.component.css'],
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
export class TipComponent implements OnInit {
  loadingFlag: boolean;
  tipData: any[];
  tipDataRaw: any[];
  selectedMonth: Date;
  totalAmount: number;
  selectedView: number;
  viewList: { type: number; name: string; }[];
  tipDataTherapist: any[];

  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private router: Router
  ) {
    this.selectedMonth = moment().toDate();
    this.totalAmount = 0;
    this.getTip();
    this.selectedView = 0;
    this.viewList = [
      {
        type: 0,
        name: "By Booking"
      },
      {
        type: 1,
        name: "By Therapist"
      }
    ]
  }

  ngOnInit() {
  }

  onKeyUp(value: string): void {
    if (this.selectedView === 0) {
      if (value) {
        let val: string;
        val = value.toLowerCase();
        this.loadingFlag = true;
        this.tipData = this.tipDataRaw.filter((d) => {
          if (
            (d.User.Name && d.User.Name.toLowerCase().indexOf(val) !== -1) ||
            (d.BookingId && d.BookingId.toString().toLowerCase().indexOf(val) !== -1) ||
            (d.TipAmount && d.TipAmount.toString().toLowerCase().indexOf(val) !== -1) ||
            (d.StaffNames && d.StaffNames.toLowerCase().indexOf(val) !== -1)
          ) {
            return d;
          }
        });
        this.loadingFlag = false;
      }
      else {
        this.tipData = [...this.tipDataRaw];
      }
    } else {
      if (value) {
        let val: string;
        val = value.toLowerCase();
        this.loadingFlag = true;
        this.tipData = this.tipDataTherapist.filter((d) => {
          if (
            (d.Name && d.Name.toLowerCase().indexOf(val) !== -1) ||
            (d.TotalTip && d.TotalTip.toString().toLowerCase().indexOf(val) !== -1)
          ) {
            return d;
          }
        });
        this.loadingFlag = false;
      } else {
        this.tipData = clonedeep(this.tipDataTherapist);
      }
    }
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    if (sort.key) {
      let key = sort.key;
      const data  = this.tipData.sort((a, b) =>
        sort.value === "ascend"
          ? a[key] > b[key]
            ? 1
            : -1
          : b[key] > a[key]
            ? 1
            : -1
      );
      this.tipData = [...data];
    }
  }

  changeView(view) {
    this.selectedView = view;
    if (this.selectedView === 0) {
      this.tipData = clonedeep(this.tipDataRaw);
    } else {
      this.tipDataTherapist = [];
      this.tipDataRaw.forEach(tip => {
        tip.Staff.forEach(staff => {
          const staffFound = this.tipDataTherapist.find(st => st.StaffId === staff.StaffId);
          if (!staffFound) {
            this.tipDataTherapist.push({
              StaffId: staff.StaffId,
              Name: staff.Name,
              TotalTip: tip.TipAmount / tip.Staff.length
            })
          } else {
            staffFound.TotalTip += tip.TipAmount / tip.Staff.length
          }
        });
      })
      this.tipData = clonedeep(this.tipDataTherapist);
    }
  }

  changeMonth(date: Date) {
    this.selectedMonth = date;
    this.getTip();
  }

  getTip() {
    this.loadingFlag = true;
    let obj = {
      Month: moment(this.selectedMonth).format("MM/YYYY")
    }
    this.webapi.request("getTip", obj)
      .subscribe(
        data => {
          this.tipData = [...data.body.Data];
          this.setConstraints();
          this.tipDataRaw = clonedeep(this.tipData);
          this.changeView(this.selectedView);
          this.loadingFlag = false;
        },
        error => {
          this.loadingFlag = false;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }

  setConstraints() {
    this.totalAmount = 0;
    this.tipData.forEach(tip => {
      tip.StaffNames = tip.Staff[0].Name;
      this.totalAmount += tip.TipAmount;
      tip.Staff.forEach((staff, index) => {
        if (index > 0) {
          tip.StaffNames += ", " + staff.Name;
        }
      });
    })
  }

  viewBooking(bookingId) {
    this.router.navigate(['/booking/'], {
      state: {
        bookingId
      }
    })
  }
}