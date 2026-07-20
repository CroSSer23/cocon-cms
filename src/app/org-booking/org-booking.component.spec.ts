import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgBookingComponent } from './org-booking.component';

describe('OrgBookingComponent', () => {
  let component: OrgBookingComponent;
  let fixture: ComponentFixture<OrgBookingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrgBookingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrgBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
