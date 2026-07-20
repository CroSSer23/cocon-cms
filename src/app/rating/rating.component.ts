import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { ToastyService } from 'ng2-toasty';
import * as clonedeep from "lodash/cloneDeep";
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
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
export class RatingComponent implements OnInit {
  loadingFlag: boolean;
  ratingData: any[];
  ratingDataRaw: any[];
  sortName: string;
  sortValue: string;

  constructor(
    private webapi: WebService,
    private toast: ToastyService,
    private router: Router
  ) {
    this.getRatingList();
  }

  ngOnInit() {
  }
  getRatingList(): void {
    this.loadingFlag = true;
    this.webapi.request("getRating", null)
      .subscribe(
        data => {
          this.ratingData = [...data.body.Data];
          this.ratingData.forEach(element => {
            if (element.Feedback && element.Feedback.length > 15) {
              element.FeedbackShow = element.Feedback.substr(0, 15) + "...";
              element.FeedbackExtra = true;
            } else {
              element.FeedbackShow = element.Feedback;
              element.FeedbackExtra = false;
            }
          });
          this.ratingDataRaw = clonedeep(this.ratingData);
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


  // Used to search for input value
  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.ratingDataRaw.filter((d) => {
        if (
          (d.Name && d.Name.toLowerCase().indexOf(val) !== -1) ||
          (d.BookingId && d.BookingId.toString().toLowerCase().indexOf(val) !== -1) ||
          (d.Feedback && d.Feedback.toLowerCase().indexOf(val) !== -1)
        ) {
          return d;
        }
      });
      this.ratingData = temp;
      this.ratingData = [...this.ratingData];
      this.loadingFlag = false;
    }
    else {
      this.ratingData = [...this.ratingDataRaw];
    }
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    if (this.sortName) {
      const data = this.ratingData.sort((a, b) =>
        this.sortValue === "ascend"
          ? a[this.sortName] > b[this.sortName]
            ? 1
            : -1
          : b[this.sortName] > a[this.sortName]
            ? 1
            : -1
      );
      this.ratingData = [...data];
    }
  }

  counter(i: number) {
    return new Array(i);
  }

  viewBooking(bookingId) {
    this.router.navigate(['/booking/'], {
      state: {
        bookingId
      }
    })
  }
}
