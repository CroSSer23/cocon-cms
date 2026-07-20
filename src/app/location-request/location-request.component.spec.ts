import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationRequestComponent } from './location-request.component';

describe('LocationRequestComponent', () => {
  let component: LocationRequestComponent;
  let fixture: ComponentFixture<LocationRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocationRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
