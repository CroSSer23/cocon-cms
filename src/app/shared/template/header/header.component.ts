import { Component } from '@angular/core';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { CookieService } from 'ngx-cookie-service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { LoginService } from '../../services/login.service';
import { UserService } from '../../services/user.service';
import { FirebaseService } from '../../services/firebase.service';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { IBreadcrumb } from '../../interfaces/breadcrumb.type';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html'
})

export class HeaderComponent {

    searchVisible: boolean = false;
    quickViewVisible: boolean = false;
    isFolded: boolean;
    isExpand: boolean;
    adminName: string;
    breadcrumbs$: any;
    isOrgLogin:boolean=false
    ImageUrl: string;
    ImagePath: string;
    adminNameText: string;
    profileImagePath: string=null;
    profiletext: string;

    constructor(
        private themeService: ThemeConstantService,
        private cookieservice: CookieService,
        private router: Router,
        private spinner: NgxSpinnerService,
        private LoginService: LoginService,
        private UserService: UserService,
        private firebaseService: FirebaseService,
        private activatedRoute : ActivatedRoute
    ) { 
        this.breadcrumbs$ = this.router.events.pipe(
            startWith(new NavigationEnd(0, '/', '/')),
            filter(event => event instanceof NavigationEnd), distinctUntilChanged(),
            map(data => this.buildBreadCrumb(this.activatedRoute.root))
        );
    }

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.adminName = this.LoginService.getCookie("adminName");
        let userType = this.LoginService.getCookie("type");
        this.isOrgLogin=(parseInt(userType)==2)?true:false
        let profileImage=this.LoginService.getCookie("profileurl");
        this.profiletext=this.adminName.charAt(0).toUpperCase();
        if(profileImage!='null'){
            this.profileImagePath=profileImage
        }
        if(this.isOrgLogin){
            this.ImageUrl=this.LoginService.getCookie("imageurl");
            if(this.LoginService.getCookie("imagepath")=='null'){
                this.ImagePath=null;
            }else{
                this.ImagePath=this.LoginService.getCookie("imagepath");
            }
            
            this.adminNameText=this.adminName.charAt(0).toUpperCase()
        }
    }

    private buildBreadCrumb(route: ActivatedRoute, url: string = '', breadcrumbs: IBreadcrumb[] = []): IBreadcrumb[] {
        let label = '', path = '/', display = null;

        if (route.routeConfig) {
            if (route.routeConfig.data) {
                label = route.routeConfig.data['title'];
                path += route.routeConfig.path;
            }
        } else {
            label = 'Dashboard';
            path += 'dashboard';
        }

        const nextUrl = path && path !== '/dashboard' ? `${url}${path}` : url;
        const breadcrumb = <IBreadcrumb>{
            label: label, url: nextUrl
        };

        const newBreadcrumbs = label ? [...breadcrumbs, breadcrumb] : [...breadcrumbs];
        if (route.firstChild) {
            return this.buildBreadCrumb(route.firstChild, nextUrl, newBreadcrumbs);
        }
        return newBreadcrumbs;
    }

    toggleFold() {
        this.isFolded = !this.isFolded;
        this.themeService.toggleFold(this.isFolded);
    }

    toggleExpand() {
        this.isFolded = false;
        this.isExpand = !this.isExpand;
        this.themeService.toggleExpand(this.isExpand);
        this.themeService.toggleFold(this.isFolded);
    }

    searchToggle(): void {
        this.searchVisible = !this.searchVisible;
    }

    quickViewToggle(): void {
        this.quickViewVisible = !this.quickViewVisible;
    }

    logout(): void {
        this.UserService.adminLogout();
        this.cookieservice.deleteAll('/');
        this.router.navigate(['login']);
        this.firebaseService.singOutEmailAndPassword();
       
        // this.spinner.show();
        // setTimeout(() => {
        //     this.spinner.hide();
        //     this.router.navigate(['login']);
        // }, 500);
    }
}