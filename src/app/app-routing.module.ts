import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { FullLayoutComponent } from "./layouts/full-layout/full-layout.component";
import { CommonLayoutComponent } from "./layouts/common-layout/common-layout.component";

import { FullLayout_ROUTES } from "./shared/routes/full-layout.routes";
import { CommonLayout_ROUTES } from "./shared/routes/common-layout.routes";
import { LoginComponent } from './login/login.component';
import { AuthService } from './shared/services/auth.service';
import { LoginService } from './shared/services/login.service';

const appRoutes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full',
        // canActivate: [LoginService]

    },
    {
        path: '',
        component: CommonLayoutComponent,
        children: CommonLayout_ROUTES,
        canActivate: [AuthService]
    },
    {
        path: '',
        component: FullLayoutComponent,
        children: FullLayout_ROUTES,
        canActivate: [AuthService]
    },
    {
        path: 'login',
        component: LoginComponent,
        loadChildren: () => import('./login/login.module').then(m => m.LoginModule),
        canActivate: [LoginService]
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            preloadingStrategy: PreloadAllModules,
            useHash: true,
            scrollPositionRestoration: 'enabled'
        })
    ],
    exports: [
        RouterModule
    ]
})

export class AppRoutingModule {
}