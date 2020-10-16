import 'commonui/main';
import 'regenerator-runtime';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Menu from './components/Menu';

const APP_NAME = "DroneDB";

window.addEventListener('load', function(){
    Vue.use(VueRouter);
    new Vue(Menu).$mount("#header");
    
    const routes = window._getRoutes(window._params);
    const router = new VueRouter({ routes });

    // Set titles
    router.beforeEach((to, _, next) => {
        document.title = to.meta.title + ` - ${APP_NAME}`;
        next();
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
