import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import * as cloneDeep from "lodash/cloneDeep";
import { trigger, state, style, transition, animate } from '@angular/animations';
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-add-on',
  templateUrl: './add-on.component.html',
  styleUrls: ['./add-on.component.css'],
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
export class AddOnComponent implements OnInit {
  addOnForm: FormGroup;
  metadata: any;
  addOnData: any[];
  addOnDataRaw: any[];
  durationList: any[];
  durationListRaw: any[];
  loadingFlag: boolean;
  sortName: string;
  sortValue: string;
  categoryList: any[];
  addOnFormVisible: boolean;
  categoryFilterList: any[];
  selectedCategories: any[];
  loadComplete: boolean = false;
  updateMode: boolean;
  updateAddOnId: any;
  rawUpdateData: any;
  newDurValid: boolean;
  newDuration: any;
  durationSubs: any;
  checkedData: any[];
  isIndeterminate: boolean;
  allChecked: boolean;
  anyChecked: boolean;
  valueInput: any;
  valueSubs: any;

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private fb: FormBuilder
  ) {
    this.addOnForm = this.fb.group({
      Name: [null, [Validators.required]],
      Duration: [null, [Validators.required]],
      Amount: [null, [Validators.required]],
    })
    this.addOnData = [];
    this.getMetadata();
    this.durationList = [
      { Duration: 10, Disabled: false, },
      { Duration: 15, Disabled: false, },
      { Duration: 20, Disabled: false, },
      { Duration: 30, Disabled: false, },
      { Duration: 60, Disabled: false, },
      { Duration: 90, Disabled: false, }
    ];
    this.durationListRaw = cloneDeep(this.durationList);
    this.categoryFilterList = [];
  }

  ngOnInit() {
  }

  getMetadata(showLoad = true): void {
    // this.spinner.show();
    if (showLoad) {
      this.loadingFlag = true;
    }
    this.webapi.requestAnonymous('metadata', {
      Metadata: ['AddOn', 'Category']
    })
      .subscribe(
        data => {
          this.metadata = { ...data.body.Data };
          this.addOnData = [...this.metadata['AddOn']];
          this.categoryList = [...this.metadata['Category']];
          this.categoryFilterList = [];
          this.categoryList.forEach(element => {
            this.categoryFilterList.push({
              text: element.Name,
              value: element.CategoryId,
              byDefault: false
            })
          });
          this.addOnData.forEach(addOn => {
            addOn.checked = false;
            addOn.CategoryNames = "";
            addOn.Categories.forEach((addCat, index) => {
              if (index === (addOn.Categories.length - 1)) {
                addOn.CategoryNames += addCat.CategoryName
              } else {
                addOn.CategoryNames += addCat.CategoryName + ", "
              }
            });
          });
          this.addOnDataRaw = cloneDeep(this.addOnData);
          this.loadComplete = true;
          if (this.loadingFlag) {
            this.loadingFlag = false;
          }
          // this.spinner.hide();
        },
        error => {
          var msg = error.headers.get('message');
          this.toast.error({
            title: "Error",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          // this.spinner.hide();
        }
      )
  }


  refreshList() {
    this.getMetadata();
  }

  reorder(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.addOnData, event.previousIndex, event.currentIndex);
    let obj = {
      Type: "AddOn",
      Order: []
    }
    this.addOnData.forEach(element => {
      obj.Order.push(element.AddOnId);
    });
    this.webapi.request("reorderCatalog", obj)
      .subscribe(
        data => {
          this.getMetadata(true);
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

  checkAll(value: boolean): void {
    this.addOnData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.addOnData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.AddOnId);
      }
    });
    this.anyChecked = this.addOnData.some(e => e.checked);
    this.allChecked = this.addOnData.every(e => e.checked);
  }

  // Used to search for input value
  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.addOnDataRaw.filter((d) => {
        var found = false;
        d.Categories.forEach(category => {
          if (category.CategoryName.toLowerCase().indexOf(val) !== -1) {
            found = true;
          }
        });
        if (
          (d.Name && d.Name.toLowerCase().indexOf(val) !== -1) ||
          (d.Category && d.Category.toLowerCase().indexOf(val) !== -1) ||
          (d.Duration && d.Duration.toString().toLowerCase().indexOf(val) !== -1) ||
          (d.Amount && d.Amount.toString().toLowerCase().indexOf(val) !== -1) ||
          (found)
        ) {
          return d;
        }
      });
      this.addOnData = temp;
      this.addOnData = [...this.addOnData];
      this.loadingFlag = false;
    }
    else {
      this.addOnData = [...this.addOnDataRaw];
    }
  }

  // Sort the table according to given key.
  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    if (this.sortName) {
      const data = this.addOnData.sort((a, b) =>
        this.sortValue === "ascend"
          ? a[this.sortName] > b[this.sortName]
            ? 1
            : -1
          : b[this.sortName] > a[this.sortName]
            ? 1
            : -1
      );
      this.addOnData = [...data];
    }
  }

  changeFilter(selectedFilters: any[]): void {
    if (selectedFilters.length <= 0) {
      this.addOnData = cloneDeep(this.addOnDataRaw);
    } else {
      let data = this.addOnDataRaw.filter(f => {
        let cats = [];
        f.Categories.forEach(element => {
          cats.push(element.CategoryId);
        });
        var found = false;
        for (let i = 0; i < selectedFilters.length; i++) {
          var filter = selectedFilters[i];
          cats.forEach(cat => {
            if (cat === filter) {
              found = true;
            }
          });
        }
        return found;
      })
      this.addOnData = [...data];
    }
  }

  openAddOnForm(): void {
    this.resetAddOnForm();
    this.addOnFormVisible = true;
    this.valueSubs = this.addOnForm.get("Amount").valueChanges.subscribe(val => {
      if (val === 0) {
        this.addOnForm.controls.Amount.reset();
      }
    });
  }

  closeAddOnForm(): void {
    this.resetAddOnForm();
    this.addOnData = cloneDeep(this.addOnDataRaw);
    this.addOnFormVisible = false;
  }

  checkNewDuration(event: number): void {
    var found = this.durationList.find(f => f.Duration === event);
    if (event && !found) {
      this.newDurValid = true;
    } else {
      this.newDurValid = false;
    }
  }

  addNewDuration(): void {
    this.durationList.push({
      Duration: this.newDuration,
      Disabled: false
    });
    this.durationList = [...this.durationList];
    this.newDuration = null;
    this.newDurValid = false;
  }

  resetAddOnForm(): void {
    this.addOnForm.reset();
    this.selectedCategories = [];
    this.updateMode = false;
    this.updateAddOnId = undefined;
    this.updateMode = false;
    this.updateAddOnId = undefined;
    this.rawUpdateData = {};
    this.durationList = [];
    this.durationList = cloneDeep(this.durationListRaw);
  }

  resetUpdateForm(): void {
    this.addOnForm.patchValue(this.rawUpdateData);
    this.selectedCategories = [];
    this.rawUpdateData.Categories.forEach(element => {
      this.selectedCategories.push(element.CategoryId);
      var found = this.categoryList.find(f => f.CategoryId === element.CategoryId);
      found.UpdateDisabled = true;
    });
  }


  submitAddOn(): void {
    let obj = {
      ...this.addOnForm.value,
      Categories: [...this.selectedCategories]
    }
    this.spinner.show();
    this.webapi.request('newAddOn', obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.addOnData = [...data.body.Data];
          this.addOnData.forEach(addOn => {
            addOn.CategoryNames = "";
            addOn.Categories.forEach((addCat, index) => {
              if (index === (addOn.Categories.length - 1)) {
                addOn.CategoryNames += addCat.CategoryName
              } else {
                addOn.CategoryNames += addCat.CategoryName + ", "
              }
            });
          });
          this.addOnDataRaw = cloneDeep(this.addOnData);
          this.toast.success({
            title: "Success",
            msg,
            timeout: 3000,
            theme: 'bootstrap'
          })
          this.closeAddOnForm();
          this.spinner.hide();
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

  fillAddOnForm(data: any): void {
    this.openAddOnForm();
    var found = this.durationList.find(f => f.Duration === data.Duration);
    if (found) {
      found.Disabled = true;
    } else {
      this.durationList.push({
        Duration: data.Duration,
        Disabled: true,
      })
    }
    this.addOnForm.patchValue(data);
    this.selectedCategories = [];
    data.Categories.forEach(element => {
      this.selectedCategories.push(element.CategoryId);
      var found = this.categoryList.find(f => f.CategoryId === element.CategoryId);
      found.UpdateDisabled = true;
    });
    this.updateMode = true;
    this.updateAddOnId = data.AddOnId;
    this.rawUpdateData = { ...data };
  }

  updateAddOn(): void {
    let updateObj = {
      AddOnId: this.updateAddOnId,
      ...this.addOnForm.value,
      Categories: this.selectedCategories
    }
    this.spinner.show();
    this.webapi.request("updateAddOn", updateObj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.addOnData = [...data.body.Data];
          this.addOnData.forEach(addOn => {
            addOn.CategoryNames = "";
            addOn.Categories.forEach((addCat, index) => {
              if (index === (addOn.Categories.length - 1)) {
                addOn.CategoryNames += addCat.CategoryName
              } else {
                addOn.CategoryNames += addCat.CategoryName + ", "
              }
            });
          });
          this.addOnDataRaw = cloneDeep(this.addOnData);
          this.toast.success({
            title: "Success",
            msg,
            timeout: 3000,
            theme: 'bootstrap'
          })
          this.closeAddOnForm();
          this.spinner.hide();
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

  deleteAddOn(addOnId: number = null, multi = false): void {
    let obj = {
      DeleteAddOn: [addOnId]
    }
    if (multi) {
      obj.DeleteAddOn = [];
      obj.DeleteAddOn = this.checkedData;
    }
    this.loadingFlag = true;
    this.webapi.request('deleteAddOn', obj)
      .subscribe(
        data => {
          var msg = data.headers.get('message');
          this.addOnData = [...data.body.Data];
          this.addOnData.forEach(addOn => {
            addOn.CategoryNames = "";
            addOn.Categories.forEach((addCat, index) => {
              if (index === (addOn.Categories.length - 1)) {
                addOn.CategoryNames += addCat.CategoryName
              } else {
                addOn.CategoryNames += addCat.CategoryName + ", "
              }
            });
          });
          this.addOnDataRaw = cloneDeep(this.addOnData);
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
}