import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgZorroAntdModule, NZ_I18N, en_US } from 'ng-zorro-antd';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';

import { AppRoutingModule } from './app-routing.module';
import { TemplateModule } from './shared/template/template.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { CommonLayoutComponent } from './layouts/common-layout/common-layout.component';
import { FullLayoutComponent } from './layouts/full-layout/full-layout.component';

import { NgChartjsModule } from 'ng-chartjs';
import { ThemeConstantService } from './shared/services/theme-constant.service';
import { ReactiveFormsModule } from '@angular/forms';
import { WebService } from './shared/services/web.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastyModule } from 'ng2-toasty';
import { ImageService } from './shared/services/image.service';
import { CategoryComponent } from './category/category.component';
import { ProductComponent } from './product/product.component';
import { AddOnComponent } from './add-on/add-on.component';
import { LoginComponent } from './login/login.component';
import { AuthService } from './shared/services/auth.service';
import { LoginService } from './shared/services/login.service';
import { BookingComponent } from './booking/booking.component';
import { StaffComponent } from './staff/staff.component';
import { CalendarComponent } from './calendar/calendar.component';
import { UserComponent } from './user/user.component';
import { PromoCodeComponent } from './promo-code/promo-code.component';
import { RatingComponent } from './rating/rating.component';
import { MessageComponent } from './message/message.component';
import { SupportComponent } from './support/support.component';
import { AgentService } from './shared/services/agent.service';
import { FaqComponent } from './faq/faq.component';
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { CookieService } from "ngx-cookie-service";
import { VacationComponent } from './vacation/vacation.component';
import { LocationRequestComponent } from './location-request/location-request.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgxImageCompressService } from 'ngx-image-compress';
import { TipComponent } from './tip/tip.component';
import { FirebaseService } from './shared/services/firebase.service';
import { RequestInterceptorService } from './shared/services/requestInterceptor.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ZoneService } from './shared/services/zone.service';
import { TableService } from './shared/services/table.service';
import { ChatService } from './shared/services/chat.service';
import { BookingService } from './shared/services/booking.service';
import { PromoService } from './shared/services/promo.service';
import { StaffService } from './shared/services/staff.service';
import { UserService } from './shared/services/user.service';
import { MessageService } from './shared/services/message.service';
import { LocationRequestService } from './shared/services/location-request.service';
import { ScheduleService } from './shared/services/schedule.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NewBookingComponent } from './new-booking/new-booking.component';
import { CalendarService } from './shared/services/calendar.service';
import { OrganisationsComponent } from './organisations/organisations.component';
import { AvailabilityComponent } from './availability/availability.component';
import { CheckAvailabilityComponent } from './check-availability/check-availability.component';
import { OrgBookingComponent } from './org-booking/org-booking.component';
import { OrgAdminComponent } from './org-admin/org-admin.component';
// import { FullCalendarModule } from '@fullcalendar/angular';

// import dayGridPlugin from '@fullcalendar/daygrid';
// import timegridPlugin from '@fullcalendar/timegrid';

registerLocaleData(en);
// FullCalendarModule.registerPlugins([
//     dayGridPlugin,
//     timegridPlugin
// ]);

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        CommonLayoutComponent,
        FullLayoutComponent,
        CategoryComponent,
        ProductComponent,
        AddOnComponent,
        BookingComponent,
        StaffComponent,
        CalendarComponent,
        UserComponent,
        PromoCodeComponent,
        RatingComponent,
        MessageComponent,
        SupportComponent,
        FaqComponent,
        VacationComponent,
        LocationRequestComponent,
        ScheduleComponent,
        DashboardComponent,
        TipComponent,
        NewBookingComponent,
        OrganisationsComponent,
        AvailabilityComponent,
        CheckAvailabilityComponent,
        OrgBookingComponent,
        OrgAdminComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        NgZorroAntdModule,
        AppRoutingModule,
        TemplateModule,
        SharedModule,
        NgChartjsModule,
        ReactiveFormsModule,
        NgxSpinnerModule,
        ToastyModule.forRoot(),
        GooglePlaceModule,
        DragDropModule,
        FontAwesomeModule
        // FullCalendarModule
    ],
    providers: [
        {
            provide: NZ_I18N,
            useValue: en_US,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: RequestInterceptorService,
            multi: true
        },
        ThemeConstantService,
        AuthService,
        LoginService,
        WebService,
        ImageService,
        AgentService,
        NgxSpinnerService,
        CookieService,
        NgxImageCompressService,
        FirebaseService,
        ZoneService,
        ChatService,
        TableService,
        BookingService,
        PromoService,
        StaffService,
        UserService,
        MessageService,
        LocationRequestService,
        ScheduleService,
        CalendarService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }