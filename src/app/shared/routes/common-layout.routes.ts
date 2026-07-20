import { Routes } from '@angular/router';
import { CategoryComponent } from 'src/app/category/category.component';
import { ProductComponent } from 'src/app/product/product.component';
import { AddOnComponent } from 'src/app/add-on/add-on.component';
import { BookingComponent } from 'src/app/booking/booking.component';
import { StaffComponent } from 'src/app/staff/staff.component';
import { CalendarComponent } from 'src/app/calendar/calendar.component';
import { UserComponent } from 'src/app/user/user.component';
import { PromoCodeComponent } from 'src/app/promo-code/promo-code.component';
import { RatingComponent } from 'src/app/rating/rating.component';
import { MessageComponent } from 'src/app/message/message.component';
import { SupportComponent } from 'src/app/support/support.component';
import { AgentService } from '../services/agent.service';
import { FaqComponent } from 'src/app/faq/faq.component';
import { VacationComponent } from 'src/app/vacation/vacation.component';
import { LocationRequestComponent } from 'src/app/location-request/location-request.component';
import { ScheduleComponent } from 'src/app/schedule/schedule.component';
import { DashboardComponent } from 'src/app/dashboard/dashboard.component';
import { TipComponent } from 'src/app/tip/tip.component';
import {NewBookingComponent} from 'src/app/new-booking/new-booking.component'
import { OrganisationsComponent } from 'src/app/organisations/organisations.component';
import { AvailabilityComponent } from 'src/app/availability/availability.component';
import { CheckAvailabilityComponent } from 'src/app/check-availability/check-availability.component';
import { OrgBookingComponent } from 'src/app/org-booking/org-booking.component';
import { OrgAdminComponent } from 'src/app/org-admin/org-admin.component';

export const CommonLayout_ROUTES: Routes = [

    //Dashboard
    {
        path: 'dashboard',
        data: {
            title: 'Dashboard'
        },
        component: DashboardComponent,
        canActivate: [AgentService]
    },

    // Booking
    {
        path: 'booking',
        data: {
            title: 'Booking'
        },
        component: BookingComponent,
        canActivate: [AgentService]
    },
    {
        path: 'booking/:bookingId',
        data: {
            title: 'Booking'
        },
        component: BookingComponent,
        canActivate: [AgentService]
    },

    // Category
    {
        path: 'category',
        data: {
            title: 'Category'
        },
        component: CategoryComponent,
        canActivate: [AgentService]
    },

    // Product
    {
        path: 'product',
        data: {
            title: 'Product'
        },
        component: ProductComponent,
        canActivate: [AgentService]
    },

    // Add-on
    {
        path: 'addOn',
        data: {
            title: 'Add-on'
        },
        component: AddOnComponent,
        canActivate: [AgentService]
    },

    // Staff
    {
        path: 'staff',
        data: {
            title: 'Staff'
        },
        component: StaffComponent,
        canActivate: [AgentService]
    },

    // Schedule
    {
        path: 'schedule',
        data: {
            title: 'Schedule'
        },
        component: ScheduleComponent,
        canActivate: [AgentService]
    },

    // Vacation
    {
        path: 'vacation',
        data: {
            title: 'Vacation'
        },
        component: VacationComponent,
        canActivate: [AgentService]
    },

    // User
    {
        path: 'user',
        data: {
            title: 'User'
        },
        component: UserComponent,
        canActivate: [AgentService]
    },

    // Promo-code
    {
        path: 'promoCode',
        data: {
            title: 'Promo-code'
        },
        component: PromoCodeComponent,
        canActivate: [AgentService]
    },

    // Rating
    {
        path: 'rating',
        data: {
            title: 'Rating'
        },
        component: RatingComponent,
        canActivate: [AgentService]
    },

    // Message
    {
        path: 'message',
        data: {
            title: 'Message'
        },
        component: MessageComponent,
        canActivate: [AgentService]
    },

    // Support
    {
        path: 'support',
        data: {
            title: 'Support'
        },
        component: SupportComponent
    },

    // Calendar
    {
        path: 'calendar',
        data: {
            title: 'Calendar'
        },
        component: CalendarComponent,
        canActivate: [AgentService]
    },

    // Faq
    {
        path: 'faq',
        data: {
            title: 'FAQ'
        },
        component: FaqComponent,
        canActivate: [AgentService]
    },

    // Location request
    {
        path: 'locationRequest',
        data: {
            title: 'Location Request'
        },
        component: LocationRequestComponent,
        canActivate: [AgentService]
    },

    // Tip
    {
        path: 'tip',
        data: {
            title: 'Tip'
        },
        component: TipComponent,
        canActivate: [AgentService]
    },

    //New-Booking
    {
        path: 'newbooking',
        data: {
            title: 'Booking- New Appointment'
        },
        component: NewBookingComponent,
        canActivate: [AgentService]
    },
    //Organisations
    {
        path: 'organisation',
        data: {
            title: 'Organisations'
        },
        component: OrganisationsComponent,
        canActivate: [AgentService]
    },

    //Availability(old design to be kept for future use in case client asks for this version)
    {
        path: 'availability',
        data: {
            title: 'Booking-Availability'
        },
        component: AvailabilityComponent,
        canActivate: [AgentService]
    },
    //Check Availability
    {
        path: 'checkavailability',
        data: {
            title: 'Booking- Check Availability'
        },
        component: CheckAvailabilityComponent,
        canActivate: [AgentService]
    },
    //Booking list panel for organisations
    {
        path: 'orgbooking',
        data: {
            title: 'Booking'
        },
        component: OrgBookingComponent,
        canActivate: [AgentService]
    },//Admin list for Organisation
    {
        path: 'orgadmin',
        data: {
            title: 'Admin'
        },
        component: OrgAdminComponent,
        canActivate: [AgentService]
    },

];