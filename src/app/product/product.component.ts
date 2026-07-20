import { Component, OnInit } from '@angular/core';
import { WebService } from '../shared/services/web.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastyService } from 'ng2-toasty';
import * as cloneDeep from "lodash/cloneDeep";
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import * as moment from "moment";
import { moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CalendarService } from '../shared/services/calendar.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
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
export class ProductComponent implements OnInit {
  metadata: any[];
  productData: any[];
  productDataRaw: any[];
  loadingFlag: boolean = false;
  formVisible: boolean = false;
  sortName: string;
  sortValue: string;
  productFormVisible: boolean;
  productForm: FormGroup;
  productFormDutch: FormGroup;
  categoryList: any[];
  durationList: any[];
  durationsData: any[];
  valueInput: number;
  durationInput: number;
  durationEditClicked: boolean;
  categoryFilterList: any[];
  updateMode: boolean;
  updateProductId: any;
  filterListPresent: boolean;
  selectedCategory: any;
  productDescDutch: any;
  productNameDutch: any;
  dutchEnabled: boolean = false;
  nameSubs: any;
  descSubs: any;
  openedOnce: boolean;
  languageList: any[];
  selectedLang: any;
  isSpinning: boolean;
  rawUpdateData: any;
  newDuration: any;
  descCharsEng: number;
  descCharsDut: number;
  desCharCounterDut: any;
  desCharCounterEng: any;
  newDurValid: boolean;
  preparationTime: number;
  durationListRaw: any;
  checkedData: any[];
  anyChecked: any;
  allChecked: any;
  updateDurationTempId: any;
  extrasForm: FormGroup;
  extraVisible: boolean;
  currentPage: any=1;
  orgFilterList: any[];
  selectedOrganisation: any;
  selectedOrganisationFilter: any=null;

  constructor(
    private webapi: WebService,
    private spinner: NgxSpinnerService,
    private toast: ToastyService,
    private fb: FormBuilder,
    private calendarService: CalendarService,
  ) {
    this.productForm = this.fb.group({
      Name: [null, [Validators.required]],
      Description: [null],
    })
    this.productFormDutch = this.fb.group({
      Name: [null, [Validators.required]],
      Description: [null],
    })
    this.extrasForm = this.fb.group({
      Title: [null],
      MultiSelect: [false],
      ProductExtraMaxSelect: [null],
      Values: this.fb.array([])
    });
    this.getMetadata();
    this.extraVisible = false;
    this.durationList = [
      { Duration: 10, Disabled: false, },
      { Duration: 15, Disabled: false, },
      { Duration: 20, Disabled: false, },
      { Duration: 30, Disabled: false, },
      { Duration: 60, Disabled: false, },
      { Duration: 90, Disabled: false, }
    ];
    this.durationListRaw = cloneDeep(this.durationList);
  }

  ngOnInit() {
    this.getOrganisationList()
  }

  getMetadata() {
    this.webapi.requestAnonymous('metadata', {
      Metadata: ['Category', 'Language']
    }).subscribe(
      data => {
        this.metadata = { ...data.body.Data };
        this.categoryList = [...this.metadata['Category']];
        this.languageList = [...this.metadata['Language']];
        this.categoryFilterList = [];
        this.categoryList.forEach(element => {
          this.categoryFilterList.push({
            text: element.Name,
            value: element.CategoryId,
            byDefault: false
          })
        });
        this.filterListPresent = true;
        this.productData = [];
        this.loadingFlag = true;
        this.getProductList();
      },
      error => {
        var msg = error.headers.get('message');
        this.toast.error({
          title: "Error",
          msg: "Couldn't load data, Please try again by reloading!",
          theme: 'bootstrap',
          timeout: 3000
        })
      }
    )
  }

  getProductList(langId = null, showLoad = false): void {
    // this.spinner.show();
    console.log(this.selectedOrganisationFilter)
    var obj = {
      LanguageId: langId,
      OrganisationLocationId:this.selectedOrganisationFilter
    }
    if (showLoad) {
      this.loadingFlag = true;
    }
    this.webapi.request("getProduct", obj)
      .subscribe(
        data => {
          this.productData = [...data.body.Data];
          console.log(this.productData)
          this.productData.forEach(element => {
            element.expand = false;
            var langData = element.Translations.find(f => {
              var eng = this.metadata['Language'].find(fi => fi.Name === "English");
              if (f.LanguageId === eng.LanguageId) {
                return true;
              }
            })
            element.nameShow = langData.Name;
            element.descShow = langData.Description;
          });
          this.productDataRaw = cloneDeep(this.productData);
          this.selectedLang = this.languageList.find(f => f.Name === "English").LanguageId;
          if (this.loadingFlag) {
            this.loadingFlag = false;
          }
        },
        error => {
          this.loadingFlag = false;
          // this.spinner.hide();
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
  onPageChange(event){
    this.currentPage=event
  }


  refreshList() {
    this.getProductList();
  }

  reorder(event: CdkDragDrop<string[]>) {
    console.log(event.previousIndex, event.currentIndex)
    if(this.currentPage==1){
      moveItemInArray(this.productData, event.previousIndex, event.currentIndex);
    }else{
      let previousIndex=(10*(this.currentPage-1))+event.previousIndex
      let currentIndex=(10*(this.currentPage-1))+event.currentIndex
      console.log(previousIndex, currentIndex)
      moveItemInArray(this.productData, previousIndex, currentIndex);
    }
    
    
    let obj = {
      Type: "Product",
      Order: []
    }
    this.productData.forEach(element => {
      obj.Order.push(element.ProductId);
    });
    this.webapi.request("reorderCatalog", obj)
      .subscribe(
        data => {
          this.getProductList(null, true);
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


  changeLanguage(event: boolean) {
    this.loadingFlag = true;
    this.productData.forEach(product => {
      if (event) {
        let lang = this.metadata['Language'].find(f => f.Name === "Dutch");
        let langData = product.Translations.find(f => f.LanguageId === lang.LanguageId);
        product.nameShow = langData.Name;
        product.descShow = langData.Description;
      } else {
        let lang = this.metadata['Language'].find(f => f.Name === "English");
        let langData = product.Translations.find(f => f.LanguageId === lang.LanguageId);
        product.nameShow = langData.Name;
        product.descShow = langData.Description;
      }
    });
    this.loadingFlag = false;
  }

  chooseLanguage(event) {
    this.loadingFlag = true;
    this.productData.forEach(product => {
      let langData = product.Translations.find(f => f.LanguageId === event);
      product.nameShow = langData.Name;
      product.descShow = langData.Description;
    });
    this.loadingFlag = false;
  }

  onKeyUp(value: string): void {
    if (value) {
      let val: string;
      val = value.toLowerCase();
      this.loadingFlag = true;
      const temp = this.productDataRaw.filter((d) => {
        if (
          (d.nameShow && d.nameShow.toLowerCase().indexOf(val) !== -1) ||
          (d.descShow && d.descShow.toLowerCase().indexOf(val) !== -1) ||
          (d.Category && d.Category.toLowerCase().indexOf(val) !== -1) ||
          (d.PreparationTime && d.PreparationTime.toString().toLowerCase().indexOf(val) !== -1)
        ) {
          return d;
        }
      });
      this.productData = temp;
      this.productData = [...this.productData];
      this.loadingFlag = false;
    }
    else {
      this.productData = [...this.productDataRaw];
    }
  }

  sort(sort: { key: string; value: string }): void {
    this.sortName = sort.key;
    this.sortValue = sort.value;
    if (this.sortName) {
      const data = this.productData.sort((a, b) =>
        this.sortValue === "ascend"
          ? a[this.sortName] > b[this.sortName]
            ? 1
            : -1
          : b[this.sortName] > a[this.sortName]
            ? 1
            : -1
      );
      this.productData = [...data];
    }
  }

  expandChange(event, productId) {
    if (!event) {
      this.productData.forEach(element => element.expand = false);
    } else {
      this.productData.forEach(element => {
        if (productId !== element.ProductId) {
          element.expand = false;
        } else {
          element.expand = true;
        }
      });
    }
  }

  checkAll(value: boolean): void {
    this.productData.forEach(data => {
      data.checked = value;
    });
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.checkedData = [];
    this.productData.forEach(element => {
      if (element.checked) {
        this.checkedData.push(element.ProductId);
      }
    });
    this.anyChecked = this.productData.some(e => e.checked);
    this.allChecked = this.productData.every(e => e.checked);
  }

  openProductForm(fromUpdate = false): void {
    this.resetProductForm();
    if (fromUpdate) {
      this.updateMode = true;
    } else {
      this.detectFormChanges();
    }
    this.productFormVisible = true;
    this.descCharsEng = 0;
    this.descCharsDut = 0;
    this.desCharCounterEng = this.productForm.get("Description").valueChanges.subscribe(val => {
      if (val) {
        // this.descCharsEng = 150 - val.length
        this.descCharsEng = val.length
      }
    });
    this.desCharCounterDut = this.productFormDutch.get("Description").valueChanges.subscribe(val => {
      if (val) {
        // this.descCharsDut = 150 - val.length
        this.descCharsDut =  val.length
      }
    });
    let extValArr = this.extrasForm.get("Values") as FormArray;
    while (extValArr.length !== 0) {
      extValArr.removeAt(0);
    }
  }

  toggleExtras() {
    this.extraVisible = !this.extraVisible;
  }

  addValueControl() {
    let valArray = this.extrasForm.get('Values') as FormArray;
    valArray.push(this.pushValueControls());
    window.scroll({
      top: 10000,
      behavior: "smooth"
    })
  }

  pushValueControls(obj = null) {
    if (!obj) {
      return this.fb.group({
        Value: [null, [Validators.required]]
      })
    } else {
      return this.fb.group({
        Value: [obj, [Validators.required]]
      })
    }
  }

  deleteExtValueControl(index: number): void {
    const val = this.extrasForm.get('Values') as FormArray;
    val.removeAt(index);
  }

  detectFormChanges(): void {
    this.nameSubs = this.productForm.get("Name").valueChanges.subscribe(val => {
      var element = this.productFormDutch.get('Name');
      if (!element.touched) {
        element.setValue(val);
      }
    });
    this.descSubs = this.productForm.get('Description').valueChanges.subscribe(val => {
      var element = this.productFormDutch.get('Description');
      if (!element.touched) {
        element.setValue(val);
      }
    })
  }

  unsubFormChanges() {
    this.nameSubs.unsubscribe();
    this.descSubs.unsubscribe();
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

  fillProductForm(data: any): void {
    this.openProductForm(true);
    var eng = this.metadata['Language'].find(f => f.Name === "English");
    var du = this.metadata['Language'].find(f => f.Name === "Dutch");
    if (this.nameSubs) {
      this.unsubFormChanges();
    }
    this.updateProductId = data.ProductId;
    var engData = data.Translations.find(f => f.LanguageId === eng.LanguageId);
    var duData = data.Translations.find(f => f.LanguageId === du.LanguageId);
    this.productForm.patchValue(engData);
    this.productFormDutch.patchValue(duData);
    this.selectedCategory = data.CategoryId;
    this.selectedOrganisation= data.OrganisationLocationId;
    this.preparationTime = data.PreparationTime;
    data.Durations.forEach(dur => {
      let found = this.durationList.find(f => f.Duration === dur.Duration);
      if (!found) {
        this.durationList.push({
          Duration: dur.Duration,
          Disabled: true
        })
      } else {
        found.Disabled = true;
      }
    });
    this.durationsData = [...data.Durations];
    this.durationsData.forEach(duration => duration.TempId = moment().toDate().getTime() + "" + Math.random());
    if (data.Extras.length > 0) {
      let extrasObj = {
        Title: data.Extras[0].ExtraTitle,
        ProductExtraMaxSelect: data.ProductExtraMaxSelect,
        MultiSelect: data.ProductExtraMaxSelect > 1 ? true : false,
        Values: []
      }
      this.extrasForm.patchValue(extrasObj);
      let valueArr = this.extrasForm.get("Values") as FormArray;
      while (valueArr.length > 0) {
        valueArr.removeAt(0);
      }
      data.Extras.forEach(element => {
        valueArr.push(this.pushValueControls(element.ExtraValue));
      });
    }
    this.rawUpdateData = cloneDeep(data);
  }

  closeProductForm(): void {
    this.resetProductForm();
    this.unsubFormChanges();
    this.desCharCounterEng.unsubscribe();
    this.desCharCounterDut.unsubscribe();
    this.productFormVisible = false;
    this.loadingFlag = true;
    this.productData = cloneDeep(this.productDataRaw);
    this.chooseLanguage(this.selectedLang);
    this.loadingFlag = false;
  }

  resetProductForm(): void {
    this.durationsData = [];
    this.durationInput = null;
    this.durationList = [];
    this.durationList = cloneDeep(this.durationListRaw);
    this.valueInput = null;
    this.productForm.reset();
    this.productFormDutch.reset();
    this.selectedCategory = undefined;
    this.selectedOrganisation = undefined;
    this.preparationTime = undefined;
    this.updateProductId = undefined;
    this.durationEditClicked = false;
    if (this.updateMode) {
      this.detectFormChanges();
    }
    this.updateMode = false;
    this.rawUpdateData = {};
    this.descCharsEng = 0;
    this.descCharsDut = 0;
    this.extrasForm.reset();
    let valArr = this.extrasForm.get("Values") as FormArray;
    while (valArr.length > 0) {
      valArr.removeAt(0);
    }
  }

  resetUpdateForm(): void {
    let engLang = this.languageList.find(f => f.Name === "English");
    let dutLang = this.languageList.find(f => f.Name === "Dutch");
    let engTranslation = this.rawUpdateData.Translations.find(f => f.LanguageId === engLang.LanguageId);
    this.productForm.patchValue(engTranslation);
    let dutTranslation = this.rawUpdateData.Translations.find(f => f.LanguageId === dutLang.LanguageId);
    this.productFormDutch.patchValue(dutTranslation);
    this.selectedCategory = this.rawUpdateData.CategoryId;
    this.selectedOrganisation = this.rawUpdateData.OrganisationLocationId;
    this.preparationTime = this.rawUpdateData.PreparationTime;
    this.durationList.forEach(dur => dur.Disabled = false)
    this.rawUpdateData.Durations.forEach(dur => {
      let found = this.durationList.find(f => f.Duration === dur.Duration);
      found.Disabled = true;
    });
    this.durationsData = [];
    this.durationsData = cloneDeep(this.rawUpdateData.Durations);
    this.extrasForm.reset();
    let valueArr = this.extrasForm.get("Values") as FormArray;
    while (valueArr.length > 0) {
      valueArr.removeAt(0);
    }
    if (this.rawUpdateData.Extras.length > 0) {
      let extrasObj = {
        Title: this.rawUpdateData.Extras[0].ExtraTitle,
        ProductExtraMaxSelect: this.rawUpdateData.ProductExtraMaxSelect,
        MultiSelect: this.rawUpdateData.ProductExtraMaxSelect > 1 ? true : false,
        Values: []
      }
      this.extrasForm.patchValue(extrasObj);
      this.rawUpdateData.Extras.forEach(element => {
        valueArr.push(this.pushValueControls(element.ExtraValue));
      });
    }
  }

  addDurationData(): void {
    var duration = this.durationList.find(f => f.Duration === this.durationInput);
    var found = this.durationsData.find(f => f.Duration === this.durationInput);
    if (found) {
      found.Amount = this.valueInput;
    } else {
      this.durationsData.push({
        TempId: moment().toDate().getTime() + "" + Math.random(),
        Duration: duration.Duration,
        Amount: this.valueInput
      });
    }
    this.durationsData = cloneDeep(this.durationsData)
    duration.Disabled = true;
    this.durationInput = null;
    this.valueInput = null;
    this.durationEditClicked = false;
  }

  updateDurationData(): void {
    var duration = this.durationList.find(f => f.Duration === this.durationInput);
    var found = this.durationsData.find(f => f.TempId === this.updateDurationTempId.TempId);
    if (found.Duration !== this.durationInput) {
      const previousDuration = this.durationList.find(f => f.Duration === found.Duration);
      previousDuration.Disabled = false;
    }
    found.Duration = this.durationInput;
    found.Amount = this.valueInput;
    duration.Disabled = true;
    const temp = cloneDeep(this.durationsData)
    this.durationsData = [];
    this.durationsData = cloneDeep(temp)
    duration.Disabled = true;
    this.durationInput = null;
    this.valueInput = null;
    this.durationEditClicked = false;
    this.updateDurationTempId = null;
  }

  editDurationData(tempId): void {
    let data = this.durationsData.find(f => f.TempId === tempId);
    this.updateDurationTempId = { ...data };
    this.durationInput = data.Duration;
    this.valueInput = data.Amount;
    this.durationEditClicked = true;
  }

  deleteDurationData(tempId): void {
    const duration = this.durationsData.find(f => f.TempId === tempId);
    let temp = this.durationsData.filter(dur => dur.TempId !== tempId);
    this.durationsData = [...temp];
    var dur = this.durationList.find(f => f.Duration === duration.Duration);
    dur.Disabled = false;
  }

  submitProduct(): void {
    let finalData = {
      Translations: [
        {
          LanguageId: this.metadata['Language'].find(f => f.Name === "English").LanguageId,
          Name: this.productForm.controls.Name.value,
          Description: this.productForm.controls.Description.value,
        },
        {
          LanguageId: this.metadata['Language'].find(f => f.Name === "Dutch").LanguageId,
          Name: this.productFormDutch.controls.Name.value,
          Description: this.productFormDutch.controls.Description.value,
        }
      ],
      CategoryId: this.selectedCategory,
      OrganisationLocationId: this.selectedOrganisation,
      Durations: cloneDeep(this.durationsData),
      PreparationTime: this.preparationTime,
      Extras: [],
      ProductExtraMaxSelect: 1
    }
    finalData.Durations.forEach(element => {
      delete element.Disabled;
      delete element.TempId;
    });
    let extrasVal = this.extrasForm.value;
    if (extrasVal.MultiSelect) {
      if (extrasVal.ProductExtraMaxSelect === null) {
        finalData.ProductExtraMaxSelect = extrasVal.Values.length;
      } else if (extrasVal.ProductExtraMaxSelect > 1) {
        finalData.ProductExtraMaxSelect = extrasVal.ProductExtraMaxSelect;
      }
    }
    if (extrasVal.Title && extrasVal.Title.trim !== "") {
      extrasVal.Values.forEach(element => {
        if (element.Value && element.Value.trim !== "") {
          finalData.Extras.push({
            ExtraTitle: extrasVal.Title,
            ExtraValue: element.Value
          })
        }
      });
    }
    this.spinner.show();
    this.webapi.request('newProduct', finalData)
      .subscribe(
        data => {
          this.loadingFlag = true;
          this.productData = [...data.body.Data];
          this.productData.forEach(element => {
            element.expand = false;
            var langData = element.Translations.find(f => {
              var eng = this.metadata['Language'].find(fi => fi.Name === "English");
              if (f.LanguageId === eng.LanguageId) {
                return true;
              }
            })
            element.nameShow = langData.Name;
            element.descShow = langData.Description;
          });
          this.productDataRaw = cloneDeep(this.productData);
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closeProductForm();
          this.spinner.hide();
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

  changeFilter(selectedFilters: any[]): void {
    if (selectedFilters.length <= 0) {
      this.productData = [...this.productDataRaw];
    } else {
      let data = this.productDataRaw.filter(f => {
        var found = selectedFilters.find(fi => f.CategoryId === fi);
        if (found) {
          return true;
        } else {
          return false;
        }
      })
      this.productData = [...data];
    }
  }

  updateProduct(): void {
    var eng = this.metadata['Language'].find(f => f.Name === "English");
    var du = this.metadata['Language'].find(f => f.Name === "Dutch");
    let updateObj = {
      ProductId: this.updateProductId,
      Translations: [
        {
          LanguageId: eng.LanguageId,
          Name: this.productForm.controls.Name.value,
          Description: this.productForm.controls.Description.value
        },
        {
          LanguageId: du.LanguageId,
          Name: this.productFormDutch.controls.Name.value,
          Description: this.productFormDutch.controls.Description.value
        }
      ],
      CategoryId: this.selectedCategory,
      OrganisationLocationId: this.selectedOrganisation,
      PreparationTime: this.preparationTime,
      Durations: [...this.durationsData],
      Extras: [],
      ProductExtraMaxSelect: 1
    }
    updateObj.Durations.forEach(dur => delete dur.TempId);
    let extrasVal = this.extrasForm.value;
    if (extrasVal.MultiSelect) {
      if (extrasVal.ProductExtraMaxSelect === null) {
        updateObj.ProductExtraMaxSelect = extrasVal.Values.length;
      } else if (extrasVal.ProductExtraMaxSelect > 1) {
        updateObj.ProductExtraMaxSelect = extrasVal.ProductExtraMaxSelect;
      }
    }
    if (extrasVal.Title && extrasVal.Title.trim !== "") {
      extrasVal.Values.forEach(element => {
        if (element.Value && element.Value.trim !== "") {
          updateObj.Extras.push({
            ExtraTitle: extrasVal.Title,
            ExtraValue: element.Value
          })
        }
      });
    }
    this.spinner.show();
    this.webapi.request("updateProduct", updateObj)
      .subscribe(
        data => {
          this.loadingFlag = true;
          this.productData = [...data.body.Data];
          this.productData.forEach(element => {
            element.expand = false;
            var langData = element.Translations.find(f => {
              var eng = this.metadata['Language'].find(fi => fi.Name === "English");
              if (f.LanguageId === eng.LanguageId) {
                return true;
              }
            })
            element.nameShow = langData.Name;
            element.descShow = langData.Description;
          });
          this.productDataRaw = cloneDeep(this.productData);
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.closeProductForm();
          this.spinner.hide();
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

  deleteProduct(productId: number = null, multi = false): void {
    this.loadingFlag = true;
    let obj = {
      "DeleteProduct": [productId]
    }
    if (multi) {
      obj.DeleteProduct = [];
      obj.DeleteProduct = this.checkedData;
    }
    this.webapi.request("deleteProduct", obj)
      .subscribe(
        data => {
          this.productData = [...data.body.Data];
          this.productData.forEach(element => {
            element.expand = false;
            var langData = element.Translations.find(f => {
              var eng = this.metadata['Language'].find(fi => fi.Name === "English");
              if (f.LanguageId === eng.LanguageId) {
                return true;
              }
            })
            element.nameShow = langData.Name;
            element.descShow = langData.Description;
          });
          this.productDataRaw = cloneDeep(this.productData);
          var msg = data.headers.get('message');
          this.toast.success({
            title: "Success",
            msg,
            theme: 'bootstrap',
            timeout: 3000
          })
          this.checkAll(false)
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

  cancelArchive(): void {
    console.log('cancel');
  }

  printDuration() {
    console.log(this.durationList)
    console.log(this.durationsData)
  }

  amountChange(event) {
    if (event === 0) {
      this.valueInput = null;
    }
  }
  disableAdd() {
    if (!this.durationInput || !this.valueInput) {
      return true;
    }
    if (this.valueInput) {
      let value = parseFloat(this.valueInput.toFixed(2));
      if (value !== this.valueInput) {
        return true;
      }
    }
    return false;
  }
  setValEng(obj = null) {
    let val=this.productForm.controls.Description.value
    this.descCharsEng=val.length
  }
  setValDut(obj = null) {
    let val=this.productFormDutch.controls.Description.value
    this.descCharsDut=val.length
  }
  getOrganisationList(){
    this.calendarService.getOrganisationList(false).then(results => {
  
      let organisationList = this.calendarService.organisationList
      this.orgFilterList=[...organisationList]
      
      this.sortOrganisationList()
      console.log(this.orgFilterList)
    });
  }
  sortOrganisationList(): void {
 
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
  clearSelectedOrg(){
    this.selectedOrganisation=null
  }
  clearSelectedOrgFilter(){
    this.selectedOrganisationFilter=null
    this.getProductList(null,true)
  }
  changeOrganisation(selectedOrg) {
   
    this.selectedOrganisationFilter=selectedOrg
    this.getProductList(null,true)
    
  }
}