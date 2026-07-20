import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddOnsComponent } from './add-on.component';

describe('AddOnsComponent', () => {
  let component: AddOnsComponent;
  let fixture: ComponentFixture<AddOnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddOnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
