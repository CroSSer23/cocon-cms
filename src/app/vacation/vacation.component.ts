import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastyService } from 'ng2-toasty';
import { NgxSpinnerService } from 'ngx-spinner';
import { WebService } from '../shared/services/web.service';
import * as cloneDeep from "lodash/cloneDeep";
import * as moment from 'moment';

@Component({
  selector: 'app-vacation',
  templateUrl: './vacation.component.html',
  styleUrls: ['./vacation.component.css'],
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
export class VacationComponent implements OnInit {
  loadingFlag: boolean;
  metadata: any;
  staffList: any;
  vacationData: any[];
  vacationDataRaw: any;
  vacationFormVisible: boolean;
  vacationForm: FormGroup;
  templateList: any;
  templateChange: any;
  startChange: any;
  forceVacModalVisible: boolean;
  forceVacConfirmText: any;
  DEFAULT_PAGE_SIZE = 10;
  pageSizeOptions: number[];
  pageSize: number;
  pageIndex: number;

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private fb: FormBuilder
  ) {
    this.pageSize = this.DEFAULT_PAGE_SIZE;
    this.pageIndex = 1;
    this.pageSizeOptions = [10, 20, 50, 100];
    this.getMetadata();
  }

  ngOnInit() {
    this.vacationForm = this.fb.group({
      StaffId: [null, [Validators.required]],
      Template: [null, [Validators.required]],
      StartDate: [null, [Validators.required]],
      EndDate: [null, [Validators.required]],
      StartTime: [null],
      EndTime: [null],
      Notes: [null]
    })
  }

  getMetadata() {
    this.loadingFlag = true;
    this.webapi.request("metadata", {
      Metadata: ["Staff", "VacationTemplate", "PageSizeOptions"]
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          this.staffList = this.metadata['Staff'];
          this.pageSizeOptions = this.metadata['PageSizeOptions'];
          this.templateList = this.metadata['VacationTemplate'];
          this.getVacationList();
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

  getVacationList() {
    this.loadingFlag = true;
    this.webapi.request("getVacation", null)
      .subscribe(
        data => {
          this.vacationData = [...data.body.Data];
          this.setConstraints();
          this.loadingFlag = false;
          this.vacationDataRaw = cloneDeep(this.vacationData);
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
    this.vacationData.forEach(vac => {
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
      if (vac.Notes && vac.Notes.length > 35) {
        vac.NotesShow = vac.Notes.substr(0, 35) + "...";
        vac.NotesExtra = true;
      } else {
        vac.NotesShow = vac.Notes;
        vac.NotesExtra = false;
      }
    })
  }

  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.vacationDataRaw.filter((d) => {
        if (
          (d.StaffName && d.StaffName.toLowerCase().indexOf(val) !== -1) ||
          (d.TimingString && d.TimingString.toLowerCase().indexOf(val) !== -1) ||
          (d.DateString && d.DateString.toLowerCase().indexOf(val) !== -1) ||
          (d.Notes && d.Notes.toString().toLowerCase().indexOf(val) !== -1) ||
          (d.RetreatString && d.RetreatString.toLowerCase().indexOf(val) !== -1)
        ) {
          return d;
        }
      });
      this.vacationData = temp;
      this.vacationData = [...this.vacationData];
      this.loadingFlag = false;
    }
    else {
      this.vacationData = [...this.vacationDataRaw];
    }
  }

  sort(event) {
    if (event.key === "Date") {
      if (event.value === "ascend") {
        this.vacationData.sort((a, b) => {
          let bStart = moment(b.StartDate);
          let aStart = moment(a.StartDate);
          if (bStart.isAfter(aStart)) {
            return -1;
          } else if (bStart.isBefore(aStart)) {
            return 1;
          } else {
            return 0;
          }
        })
      } else {
        this.vacationData.sort((a, b) => {
          let bStart = moment(b.StartDate);
          let aStart = moment(a.StartDate);
          if (bStart.isAfter(aStart)) {
            return 1;
          } else if (bStart.isBefore(aStart)) {
            return -1;
          } else {
            return 0;
          }
        })

      }
    }
  }


  retreatVacation(staffId: number, requestId: string) {
    let obj = {
      StaffId: staffId,
      RequestId: requestId
    }
    this.loadingFlag = true;
    this.webapi.request("retreatVacation", obj)
      .subscribe(
        data => {
          this.vacationData = [...data.body.Data];
          this.setConstraints();
          this.loadingFlag = false;
          this.vacationDataRaw = cloneDeep(this.vacationData);
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

  openVacationForm() {
    this.resetVacationForm();
    this.vacationFormVisible = true;
    // this.templateChange = this.vacationForm.get("Template").valueChanges.subscribe(val => {
    //   if (val === 1) {
    //     this.vacationForm.controls.StartTime.setValidators(Validators.required);
    //     this.vacationForm.controls.EndTime.setValidators(Validators.required);
    //   } else {
    //     this.vacationForm.controls.StartTime.setValidators(null);
    //     this.vacationForm.controls.EndTime.setValidators(null);
    //   }
    // });
    this.startChange = this.vacationForm.get("StartDate").valueChanges.subscribe(val => {
      if (this.vacationForm.controls.EndDate.value) {
        let start = moment(val).startOf("day");
        let end = moment(this.vacationForm.controls.EndDate.value).startOf("day");
        if (start.isAfter(end)) {
          this.vacationForm.controls.EndDate.reset();
        }
      }
    })
  }

  closeVacationForm() {
    this.vacationFormVisible = false;
    // this.templateChange.unsubscribe();
    this.startChange.unsubscribe();
    this.resetVacationForm();
    this.forceVacModalVisible = false;
  }

  disableSubmit(): boolean {
    if (!this.vacationForm.valid) {
      return true;
    }
    if (this.vacationForm.controls.Template.value === 1) {
      if (
        !this.vacationForm.controls.StartTime.value ||
        !this.vacationForm.controls.EndTime.value
      ) {
        return true;
      }
    }
    return false;
  }

  resetVacationForm() {
    this.vacationForm.reset();
  }

  disableStartDate = (selectedDate: Date): boolean => {
    let today = moment().startOf("day");
    let selectedStart = moment(selectedDate);
    if (today.isBefore(selectedStart) || today.isSame(selectedStart)) {
      return false;
    }
    return true;
  }

  disableEndDate = (selectedDate: Date): boolean => {
    let startDate = moment(this.vacationForm.controls.StartDate.value).startOf("day");
    let selectedEnd = moment(selectedDate);
    if (startDate.isSame(selectedEnd) || startDate.isBefore(selectedEnd)) {
      return false;
    }
    return true;
  }

  submitVacation(forceCreate = false) {
    let vacationFormValue = this.vacationForm.value;
    let startTime = null;
    let endTime = null;
    if (vacationFormValue.Template === 1) {
      let tempStartTime = moment(vacationFormValue.StartTime).format("HH:mm");
      let tempEndTime = moment(vacationFormValue.EndTime).format("HH:mm");
      startTime = moment(tempStartTime, "HH:mm");
      endTime = moment(tempEndTime, "HH:mm");
      if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
        this.toast.error({
          title: "Please enter valid Start & End time.",
          msg: "",
          timeout: 3000,
          theme: "bootstrap"
        })
        return;
      }
    }
    let obj = {
      StaffId: vacationFormValue.StaffId,
      Vacation: {
        Template: vacationFormValue.Template,
        StartDate: moment(vacationFormValue.StartDate).format("MM/DD/YYYY"),
        EndDate: moment(vacationFormValue.EndDate).format("MM/DD/YYYY"),
        StartTime: startTime ? startTime.format("HH:mm") : null,
        EndTime: endTime ? endTime.format("HH:mm") : null,
        Notes: vacationFormValue.Notes
      },
      ForceCreate: false
    }
    if (forceCreate) {
      obj.ForceCreate = forceCreate
    }
    this.spinner.show();
    this.webapi.request('requestVacation', obj)
      .subscribe(
        data => {
          this.spinner.hide();
          this.closeVacationForm();
          this.loadingFlag = true;
          this.vacationData = [...data.body.Data];
          this.setConstraints();
          this.loadingFlag = false;
          this.vacationDataRaw = cloneDeep(this.vacationData);
        },
        error => {
          this.spinner.hide();
          if (error.status === 416) {
            this.forceVacModalVisible = true;
            this.forceVacConfirmText = error.headers.get('message');
          } else {
            this.toast.error({
              title: "Error",
              msg: error.headers.get('message'),
              theme: 'bootstrap',
              timeout: 3000
            })
          }
        }
      )
  }

  closeForceVacModal() {
    this.forceVacModalVisible = false;
  }

}