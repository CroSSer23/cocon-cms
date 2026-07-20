import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from "@angular/router";
import { HighlightModule } from 'ngx-highlightjs';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ThemeConstantService } from './services/theme-constant.service';
import { CodeBoxComponent } from './directives/code-box.component'
import { SearchPipe } from './pipes/search.pipe';
import { IconFilterPipe } from './pipes/iconFilter.pipe';

@NgModule({
    exports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        NgZorroAntdModule,
        PerfectScrollbarModule,
        CodeBoxComponent,
        HighlightModule,
        SearchPipe
    ],
    imports: [
        RouterModule,
        CommonModule,
        HighlightModule.forRoot({ theme: 'atom-one-light'}),
        NgZorroAntdModule,
        PerfectScrollbarModule
    ],
    declarations: [
        CodeBoxComponent,
        SearchPipe,
        IconFilterPipe
    ],
    providers: [
        ThemeConstantService
    ]
})

export class SharedModule { }
