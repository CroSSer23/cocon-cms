import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { WebService } from '../shared/services/web.service';
import { ToastyService } from 'ng2-toasty';
import { LoginService } from '../shared/services/login.service';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import * as cloneDeep from "lodash/cloneDeep";
import { trigger, state, style, transition, animate } from '@angular/animations';
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
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
export class FaqComponent implements OnInit {
  faqForm: FormGroup;
  faqData: any[];
  faqDataRaw: any[];
  loadingFlag: boolean;
  faqFormVisible: boolean;
  metadata: any;
  sectionList: any[];
  sectionFilterList: any[];
  rawUpdateData: any;
  updateMode: boolean;
  checkedData: any[];
  anyChecked: boolean;
  allChecked: boolean;
  sortValue: string;
  sortName: string;
  searchBoxValue: string;
  faqTypeList: { type: number; name: string; }[];
  typeSectionList: any[];
  typeSubscribed: any;
  typeSectionFilterList: any[];
  selectedType: number;
  isOrgLogin: boolean;

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private LoginService: LoginService,
  ) {
    this.faqForm = this.fb.group({
      Type: [null, [Validators.required]],
      Sections: [null, [Validators.required]],
      Question: [null, [Validators.required]],
      Answer: [null, [Validators.required]]
    })
  }

  ngOnInit() {
    this.faqData = [];
    this.faqDataRaw = [];
    this.sectionFilterList = [];
    this.typeSectionFilterList = [];
    this.loadingFlag = true;
    this.faqTypeList = [
      {
        type: 0,
        name: "User"
      },
      {
        type: 1,
        name: "Staff"
      },
      {
        type: 2,
        name: "Organisation"
      }
    ]
    this.sectionFilterList = [
      {
        text: "General",
        value: 1,
        byDefault: false,
        type: 0
      },
      {
        text: "Select Treatment",
        value: 2,
        byDefault: false,
        type: 0
      },
      {
        text: "My Bookings",
        value: 3,
        byDefault: false,
        type: 0
      },
      {
        text: "General",
        value: 4,
        byDefault: false,
        type: 1
      }
    ];
    this.selectedType = 0;
    this.webapi.request("metadata", {
      Metadata: ["Section"]
    }).subscribe(
      data => {
        this.metadata = { ...data.body.Data };
        this.sectionList = this.metadata['Section'];
        console.log(this.sectionList)
        this.typeSectionFilterList = this.sectionList.filter(f => f.Type === 0);
        this.typeSectionFilterList.forEach(f => {
          f.text = f.Name;
          f.value = f.SectionId;
          f.byDefault = false;
        })
        this.getFaqList();
      }
    )
    let userType = this.LoginService.getCookie("type");
    this.isOrgLogin=(parseInt(userType)==2)?true:false
    if(this.isOrgLogin){
      this.faqTypeList = [
        {
          type: 2,
          name: "Organisation"
        }
      ]
      this.selectedType = 2;
    }
  }

  getFaqList(showLoader = true, selectedType = null) {
    if (showLoader) {
      this.loadingFlag = true;
    }
    let obj=null
    if(this.isOrgLogin){
      obj={isOrgLogin:true}
    }
    console.log(obj)
    this.webapi.request("getFAQ", obj)
      .subscribe(
        data => {
          this.faqData = [...data.body.Data];
          console.log(this.faqData)
          this.faqDataRaw = cloneDeep(this.faqData);
          if (typeof selectedType === "number") {
            this.changeView(selectedType);
          } else {
            this.setFaqListFilter();
          }
          this.loadingFlag ? this.loadingFlag = false : true;
        },
        error => {
          this.loadingFlag ? this.loadingFlag = false : true;
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }

  setFaqListFilter() {
    this.selectedType = 0;
    if(this.isOrgLogin){
      this.selectedType = 2;
    }
    this.faqData = this.faqDataRaw.filter(f => f.Type === this.selectedType);
  }

  checkAll(value: boolean): void {
    this.faqData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.faqData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.FaqId);
      }
    });
    this.anyChecked = this.faqData.some(e => e.checked);
    this.allChecked = this.faqData.every(e => e.checked);
  }

  // Used to search for input value
  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.faqDataRaw.filter((d) => {
        var found = false;
        d.Sections.forEach(section => {
          if (section.toLowerCase().indexOf(val) !== -1) {
            found = true;
          }
        });
        if (
          (d.Question && d.Question.toLowerCase().indexOf(val) !== -1) ||
          (d.Answer && d.Answer.toLowerCase().indexOf(val) !== -1) ||
          (found)
        ) {
          return d;
        }
      });
      this.faqData = temp;
      this.faqData = [...this.faqData];
      this.loadingFlag = false;
    }
    else {
      this.faqData = [...this.faqDataRaw];
    }
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    if (this.sortName) {
      const data = this.faqData.sort((a, b) =>
        this.sortValue === "ascend"
          ? a[this.sortName] > b[this.sortName]
            ? 1
            : -1
          : b[this.sortName] > a[this.sortName]
            ? 1
            : -1
      );
      this.faqData = [...data];
    }
  }

  changeView(event) {
    this.faqData = this.faqDataRaw.filter(f => f.Type === event);
    this.typeSectionFilterList = this.sectionList.filter(f => f.Type === event);
    this.typeSectionFilterList.forEach(f => {
      f.text = f.Name;
      f.value = f.SectionId;
      f.byDefault = false;
    })
  }

  changeFilter(selectedFilters: any[]): void {
    if (selectedFilters.length <= 0) {
      this.faqData = this.faqDataRaw.filter(f => f.Type === this.selectedType);
    } else {
      let data = this.faqDataRaw.filter(f => {
        let sec = [];
        f.SectionData.forEach(element => {
          sec.push(element.SectionId);
        });
        let found = false;
        for (let i = 0; i < selectedFilters.length; i++) {
          let filter = selectedFilters[i];
          sec.forEach(cat => {
            if (cat === filter) {
              found = true;
            }
          });
        }
        return found;
      })
      this.faqData = [...data];
    }
  }

  openFaqForm() {
    this.resetFaqForm();
    this.faqFormVisible = true;
    if(this.isOrgLogin){
      this.faqForm.controls.Type.setValue(2)
      this.faqForm.controls.Sections.reset();
      this.typeSectionList = this.sectionList.filter(f => f.Type === 2);
    }else{
      this.typeSubscribed = this.faqForm.controls.Type.valueChanges.subscribe(val => {
        this.faqForm.controls.Sections.reset();
        this.typeSectionList = this.sectionList.filter(f => f.Type === val);
      });

    }
    
  }

  fillFaqForm(data) {
    this.openFaqForm();
    this.updateMode = true;
    data.Sections = [];
    data.SectionData.forEach(element => {
      data.Sections.push(element.SectionId)
    });
    this.faqForm.patchValue(data);
    this.rawUpdateData = data;
  }

  resetFaqForm() {
    this.faqForm.reset();
    this.checkAll(false);
    this.updateMode = false;
  }

  resetUpdateForm() {
    this.faqForm.patchValue(this.rawUpdateData);
  }

  closeFaqForm() {
    this.faqFormVisible = false;
    this.faqData = cloneDeep(this.faqDataRaw);
    this.searchBoxValue = "";
    this.typeSubscribed.unsubscribe();
    this.changeView(this.selectedType);
  }

  submitFaq() {
    this.spinner.show();
    let obj={...this.faqForm.value}
    if(this.isOrgLogin){
      obj.isOrgLogin=1;
    }
    console.log(obj)
    this.webapi.request("newFAQ", obj)
      .subscribe(
        data => {
          this.spinner.hide();
          this.faqData = [...data.body.Data];
          this.faqDataRaw = cloneDeep(this.faqData);
          this.toast.success({
            title: "Success",
            msg: data.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closeFaqForm();
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }

  updateFAQ() {
    this.spinner.show();
    let updateObj = {
      FaqId: this.rawUpdateData.FaqId,
      ...this.faqForm.value
    }
    if(this.isOrgLogin){
      updateObj.isOrgLogin=1;
    }
    this.webapi.request("updateFAQ", updateObj)
      .subscribe(
        data => {
          this.spinner.hide();
          this.faqData = [...data.body.Data];
          this.faqDataRaw = cloneDeep(this.faqData);
          this.toast.success({
            title: "Success",
            msg: data.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closeFaqForm();
        },
        error => {
          this.spinner.hide();
          this.toast.error({
            title: "Error",
            msg: error.headers.get('message'),
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }


  deleteFaq(faqId: number = null, multi = false): void {
    let obj = {
      DeleteFaq: [faqId],
      isOrgLogin:null
    }
    if (multi) {
      obj.DeleteFaq = [];
      obj.DeleteFaq = this.checkedData;
    }
    if(this.isOrgLogin){
      obj.isOrgLogin=1;
    }
    this.loadingFlag = true;
    this.webapi.request('deleteFAQ', obj)
      .subscribe(
        data => {
          this.faqData = [...data.body.Data];
          this.faqDataRaw = cloneDeep(this.faqData);
          this.toast.success({
            title: "Success",
            msg: data.headers.get('message'),
            timeout: 3000,
            theme: 'bootstrap'
          })
          this.checkAll(false);
          this.loadingFlag = false;
          this.changeView(this.selectedType);
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

  reorder(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.faqData, event.previousIndex, event.currentIndex);
    let obj = {
      Type: "Faq",
      Order: []
    }
    this.faqData.forEach(element => {
      obj.Order.push(element.FaqId);
    });
    this.webapi.request("reorderCatalog", obj)
      .subscribe(
        data => {
          this.getFaqList(true, this.selectedType);
        },
        error => {
          this.toast.error({
            title: error.headers.get('message'),
            msg: "",
            theme: 'bootstrap',
            timeout: 3000
          })
        }
      )
  }
}