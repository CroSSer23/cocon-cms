import { Directive, AfterViewChecked, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

declare var $: any; // JQuery

@Directive({
    selector: '[sideNav]'
})
export class SideNavDirective implements AfterViewInit {

    constructor(
        private router: Router
    ) { }

    ngAfterViewInit(): void {
        let exisThis = this.router;
        $('.side-nav .side-nav-menu:not(.ant-menu-inline-collapsed) li a').click(function (event) {
            if ($(this).parent().hasClass("ant-menu-submenu-open")) {
                $(this).parent().children('.dropdown-menu').slideUp(100, function () {
                    $(this).parent().removeClass("ant-menu-submenu-open");
                });
            } else {
                $(this).parent().parent().children('li.ant-menu-submenu-open').children('.dropdown-menu').slideUp(50);
                $(this).parent().parent().children('li.ant-menu-submenu-open').children('a').removeClass('ant-menu-submenu-open');
                $(this).parent().parent().children('li.ant-menu-submenu-open').removeClass("ant-menu-submenu-open");

                $(this).parent().children('.dropdown-menu').slideDown(50, function () {
                    $(this).parent().addClass("ant-menu-submenu-open");
                    // let ele = $(this)[0];
                    // let par = $($(this)[0]).parent();
                    let path = $($($(this)[0]).parent()[0]).data().path;
                    if (exisThis.url !== path) {
                        exisThis.navigate([path]);
                    }
                });
            }
        });

    }
}