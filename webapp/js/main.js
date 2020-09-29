import 'commonui/main';
import 'regenerator-runtime';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from './routes/Home.vue';
import Login from './routes/Login.vue';
import Browser from './routes/Browser.vue';

const APP_NAME = "DroneDB";

window.addEventListener('DOMContentLoaded', function(){
    Vue.use(VueRouter);
    
    let routes = [
        { path: '/', component: Home, meta: { title: "Home" } },
        { path: '/login', component: Login, meta: { title: "Login" } },
        { path: '/r/:org/:ds?', component: Browser, meta: { title: "Browser" }},
    ]
    const router = new VueRouter({ routes });

    // Set titles
    router.beforeEach((to, _, next) => {
        document.title = to.meta.title + ` - ${APP_NAME}`;
        next()
    });

    new Vue({
        router
    }).$mount("#app");

    // Live reload
    if (window.location.href.indexOf("localhost") !== -1 ||
        window.location.href.indexOf("192.168.") !== -1 ||
        window.location.href.indexOf("127.0.0.1") !== -1){
        const livereload = document.createElement("script");
        livereload.src = `${window.location.protocol}//${window.location.hostname}:35729/livereload.js`;
        document.body.appendChild(livereload);
    }
});
