import 'commonui/main';
import 'regenerator-runtime';
import Vue from 'vue';
import VueRouter from 'vue-router';

import Menu from './components/Menu';
import Login from './components/Login.vue';
import UserHome from './components/UserHome.vue';
import Browser from './components/Browser.vue';
import { Registry } from 'ddb';

const APP_NAME = "DroneDB";

window.addEventListener('load', function(){
    Vue.use(VueRouter);
    new Vue(Menu).$mount("#header");
    
    const routes = [
        { path: '/r/:org/:ds', component: Browser, meta: { title: "Browser"}},
        { path: '/login', component: Login, meta: { title: "Login" } },
        { path: '/r/:org', component: UserHome, meta: { title: "Home"}}
    ];
    const router = new VueRouter({ mode: "history", routes });

    // Set titles
    router.beforeEach((to, _, next) => {
        document.title = to.meta.title + ` - ${APP_NAME}`;
        next();
    });

    new Vue({
        router
    }).$mount("#app");

    // Refresh auth tokens
    const reg = new Registry(window.location.origin);
    if (reg.isLoggedIn()){
        reg.refreshToken();
        reg.setAutoRefreshToken();
    }

    // Live reload
    if (window.location.href.indexOf("localhost") !== -1 ||
        window.location.href.indexOf("192.168.") !== -1 ||
        window.location.href.indexOf("127.0.0.1") !== -1){
        const livereload = document.createElement("script");
        livereload.src = `${window.location.protocol}//${window.location.hostname}:35729/livereload.js`;
        document.body.appendChild(livereload);
    }
});
