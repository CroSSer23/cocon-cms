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
        // Firebase (chat) is optional in this deploy. With a dummy/invalid key the SDK can
        // reject the promise OR throw synchronously — either way we must still resolve so
        // the CMS login/navigation flow is never blocked.
        return new Promise((resolve, reject) => {
            const done = (v?) => { window.localStorage.setItem("FRBCL", password); resolve(v); };
            try {
                if (app && app.name) {
                    app.auth()
                        .signInWithEmailAndPassword(email, password)
                        .then((value) => done(value))
                        .catch((err) => {
                            console.warn("Firebase sign-in skipped:", err && err.message);
                            done("firebase auth skipped");
                        });
                } else {
                    done("app not exist");
                }
            } catch (err) {
                console.warn("Firebase sign-in threw, skipped:", err && err.message);
                done("firebase auth threw");
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