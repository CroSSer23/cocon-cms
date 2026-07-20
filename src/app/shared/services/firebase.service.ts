import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
const config = {
    apiKey: environment.GOOGLE_PLACE_KEY,
    databaseURL: environment.FIREBASE_DB_URL,
};
let app: firebase.app.App = null;

@Injectable()
export class FirebaseService {
    constructor() { }

    initializeApp() {
        app = firebase.initializeApp(config);
    }

    getApp() {
        return app;
    }

    signInWithEmailAndPassword(email: string, password: string) {
        return new Promise((resolve, reject) => {
            if (app.name) {
                app.auth()
                    .signInWithEmailAndPassword(email, password)
                    .then((value) => {
                        window.localStorage.setItem("FRBCL", password);
                        resolve(value);
                    })
                    .catch((err) => {
                        // Firebase (chat) is optional in this deploy — don't let an auth
                        // failure block the CMS login/navigation flow.
                        console.warn("Firebase sign-in skipped:", err && err.message);
                        window.localStorage.setItem("FRBCL", password);
                        resolve("firebase auth skipped");
                    })
            } else {
                window.localStorage.setItem("FRBCL", password);
                resolve("app not exist");
            }
        })
    }

    singOutEmailAndPassword() {
        if (app) {
            app.auth()
                .signOut()
                .then((value) => {
                    window.localStorage.removeItem("FRBCL");
                    true;
                })
        }
    }

}