import 'commonui/main';
import Vue from 'vue';
import App from './App.vue';

window.onload = function(){
    new Vue({
        el: '#app',
        render: h => h(App)
    });
};
