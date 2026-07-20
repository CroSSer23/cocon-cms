import { Component } from '@angular/core';
import { FirebaseService } from './shared/services/firebase.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {
    constructor(
        private firebaseService: FirebaseService
    ) {
        if (!firebaseService.getApp()) {
            this.firebaseService.initializeApp();
        }
    }
}