import { SideNavInterface } from '../../interfaces/side-nav.type';

export const ROUTES: SideNavInterface[] = [
    {
        path: '/dashboard',
        title: 'Dashboard',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'dashboard',
        type: '0',
        submenu: []
    },
    {
        path: '/calendar',
        title: 'Calendar',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'calendar',
        type: '0',
        submenu: []
    },
    {
        path: '/booking',
        title: 'Booking',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'booking',
        type: '0',
        submenu: [
            {
                path: '/booking',
                title: 'Booking list',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'booking',
                type: '0',
                submenu: []
            },
            {
                path: '/promoCode',
                title: 'Promo-code',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'promo-code',
                type: '0',
                submenu: []
            },
            {
                path: '/rating',
                title: 'Rating',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'star',
                type: '0',
                submenu: []
            },
            {
                path: '/tip',
                title: 'Tip',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'category',
                type: '0',
                submenu: []
            },
        ]
    },
    {
        path: '/support',
        title: 'Customer Chat',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'chat',
        type: '0',
        submenu: []
    },
    
    
    {
        path: '/schedule',
        title: 'Therapists',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'staff',
        type: '0',
        submenu: [
            {
                path: '/schedule',
                title: 'Schedule',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'calendar',
                type: '0',
                submenu: []
            },
            {
                path: '/staff',
                title: 'Therapist list',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'staff',
                type: '0',
                submenu: []
            },
            {
                path: '/vacation',
                title: 'Vacation',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'category',
                type: '0',
                submenu: []
            }
        ]
    },
    {
        path: '/user',
        title: 'User',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'profile',
        type: '0',
        submenu: []
    },
    {
        path: '/product',
        title: 'Services',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'category',
        type: '0',
        submenu: [
            {
                path: '/product',
                title: 'Product',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'spa',
                type: '0',
                submenu: []
            },
            {
                path: '/category',
                title: 'Category',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'category',
                type: '0',
                submenu: []
            },
            {
                path: '/addOn',
                title: 'Add-on',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'add_on',
                type: '0',
                submenu: []
            }
        ]
    },
    {
        path: '/support',
        title: 'Support',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'how_it_works',
        type: '1',
        submenu: [
            // {
            //     path: '/support',
            //     title: 'Customer Chat',
            //     iconType: 'image',
            //     iconTheme: 'outline',
            //     icon: 'chat',
            //     type: '1',
            //     submenu: []
            // },
            {
                path: '/faq',
                title: 'FAQ',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'how_it_works',
                type: '0',
                submenu: []
            },
            {
                path: '/message',
                title: 'Message',
                iconType: 'image',
                iconTheme: 'outline',
                icon: 'messages',
                type: '0',
                submenu: []
            }
        ]
    },
    {
        path: '/locationRequest',
        title: 'Location Request',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'location',
        type: '0',
        submenu: []
    },
   
    {
        path: '/checkavailability',
        title: 'Check Availability',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'check-circle',
        type: '2',
        submenu: []
    },
    {
        path: '/organisation',
        title: 'Organisations',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'bank',
        type: '0',
        submenu: [{
            path: '/organisation',
            title: 'Organisations',
            iconType: 'nzIcon',
            iconTheme: 'outline',
            icon: 'bank',
            type: '0',
            submenu: []
        }, {
            path: '/orgadmin',
            title: 'Organisation Admin',
            iconType: 'nzIcon',
            iconTheme: 'outline',
            icon: 'user',
            type: '0',
            submenu: []
        } ]
    },
    {
        path: '/orgbooking',
        title: 'Booking',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'booking',
        type: '2',
        submenu: []
    },
    {
        path: '/faq',
        title: 'FAQ',
        iconType: 'image',
        iconTheme: 'outline',
        icon: 'how_it_works',
        type: '2',
        submenu: []
    },
    // {
    //     path: '/check-availability',
    //     title: 'Check Availability',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'dashboard',
    //     type: '2',
    //     submenu: []
    // },

    // {
    //     path: '',
    //     title: 'Dashboard',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'dashboard',
    //     submenu: [
    //         {
    //             path: '/dashboard/default',
    //             title: 'Default',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/dashboard/crm',
    //             title: 'CRM',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/dashboard/e-commerce',
    //             title: 'E-commerce',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/dashboard/projects',
    //             title: 'Projects',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //     ]
    // },
    // {
    //     path: '',
    //     title: 'Apps',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'appstore',
    //     submenu: [
    //         {
    //             path: '/apps/chat',
    //             title: 'Chat',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/apps/file-manager',
    //             title: 'File Manager',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/apps/mail',
    //             title: 'Mail',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '',
    //             title: 'Projects',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/apps/projects/project-list',
    //                     title: 'Project List',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/apps/projects/project-details',
    //                     title: 'Project Details',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'E-commerce',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/apps/e-commerce/orders-list',
    //                     title: 'Orders List',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/apps/e-commerce/product',
    //                     title: 'Products',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/apps/e-commerce/products-list',
    //                     title: 'Products List',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     path: '',
    //     title: 'Components',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'layout',
    //     submenu: [
    //         {
    //             path: '',
    //             title: 'General',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/general/ant-grid',
    //                     title: 'Ant Grid',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/general/buttons',
    //                     title: 'Buttons',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/general/icons',
    //                     title: 'Icons',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/general/typography',
    //                     title: 'Typography',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 }
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'Navigation',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/navigation/affix',
    //                     title: 'Affix',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/breadcrumb',
    //                     title: 'Breadcrumb',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/dropdown',
    //                     title: 'Dropdown',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/menu',
    //                     title: 'Menu',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/page-header',
    //                     title: 'Page Header',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/pagination',
    //                     title: 'Pagination',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/navigation/steps',
    //                     title: 'Steps',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 }
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'Data Entry',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/data-entry/autocomplete',
    //                     title: 'Autocomplete',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/cascader',
    //                     title: 'Cascader',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/checkbox',
    //                     title: 'Checkbox',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/date-picker',
    //                     title: 'Date Picker',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/form',
    //                     title: 'Form',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/input',
    //                     title: 'Input',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/input-number',
    //                     title: 'Input Number',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/mention',
    //                     title: 'Mention',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/radio',
    //                     title: 'Radio',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/rate',
    //                     title: 'Rate',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/select',
    //                     title: 'Select',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/slider',
    //                     title: 'Slider',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/switch',
    //                     title: 'Switch',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/time-picker',
    //                     title: 'Time Picker',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/transfer',
    //                     title: 'Transfer',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/tree-select',
    //                     title: 'Tree Select',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-entry/upload',
    //                     title: 'Upload',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'Data Display',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/data-display/avatar',
    //                     title: 'Avatar',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/badge',
    //                     title: 'Badge',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/calendar',
    //                     title: 'Calendar',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/card',
    //                     title: 'Card',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/carousel',
    //                     title: 'Carousel',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/collapse',
    //                     title: 'Collapse',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/comment',
    //                     title: 'Comment',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/descriptions',
    //                     title: 'Descriptions',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/empty',
    //                     title: 'Empty',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/list',
    //                     title: 'List',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/popover',
    //                     title: 'Popover',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/statistic',
    //                     title: 'Statistic',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/table',
    //                     title: 'Table',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/tabs',
    //                     title: 'Tabs',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/tag',
    //                     title: 'Tag',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/timeline',
    //                     title: 'Timeline',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/tooltip',
    //                     title: 'Tooltip',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/data-display/tree',
    //                     title: 'Tree',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'Feedback',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/feedback/alert',
    //                     title: 'Alert',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/drawer',
    //                     title: 'Drawer',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/message',
    //                     title: 'Message',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/modal',
    //                     title: 'Modal',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/notification',
    //                     title: 'Notification',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/popconfirm',
    //                     title: 'Popconfirm',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/progress',
    //                     title: 'Progress',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/skeleton',
    //                     title: 'Skeleton',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/feedback/spin',
    //                     title: 'Spin',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //             ]
    //         },
    //         {
    //             path: '',
    //             title: 'Others',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/components/others/anchor',
    //                     title: 'Anchor',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/others/back-to-top',
    //                     title: 'BackTop',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/components/others/divider',
    //                     title: 'Divider',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 }
    //             ]
    //         },
    //     ]
    // },
    // {
    //     path: '',
    //     title: 'Charts',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'pie-chart',
    //     submenu: [
    //         {
    //             path: '/charts/chartjs',
    //             title: 'ChartJS',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/charts/chartist',
    //             title: 'Chartist',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         }
    //     ]
    // },
    // {
    //     path: '',
    //     title: 'Pages',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'file',
    //     submenu: [
    //         {
    //             path: '/pages/profile',
    //             title: 'Profile',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/pages/invoice',
    //             title: 'Invoice',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/pages/members',
    //             title: 'Members',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/pages/pricing',
    //             title: 'Pricing',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/pages/setting',
    //             title: 'Setting',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '',
    //             title: 'Blog',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: [
    //                 {
    //                     path: '/pages/blog/blog-grid',
    //                     title: 'Blog Grid',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/pages/blog/blog-list',
    //                     title: 'Blog List',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 },
    //                 {
    //                     path: '/pages/blog/blog-post',
    //                     title: 'Blog Post',
    //                     iconType: '',
    //                     icon: '',
    //                     iconTheme: '',
    //                     submenu: []
    //                 }
    //             ]
    //         }
    //     ]
    // },
    // {
    //     path: '',
    //     title: 'Authentication',
    //     iconType: 'nzIcon',
    //     iconTheme: 'outline',
    //     icon: 'lock',
    //     submenu: [
    //         {
    //             path: '/authentication/login-1',
    //             title: 'Login 1',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/login-2',
    //             title: 'Login 2',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/login-3',
    //             title: 'Login 3',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/sign-up-1',
    //             title: 'Sign Up 1',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/sign-up-2',
    //             title: 'Sign Up 2',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/sign-up-3',
    //             title: 'Sign Up 3',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/error-1',
    //             title: 'Error 1',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         },
    //         {
    //             path: '/authentication/error-2',
    //             title: 'Error 2',
    //             iconType: '',
    //             icon: '',
    //             iconTheme: '',
    //             submenu: []
    //         }
    //     ]
    // }
]    