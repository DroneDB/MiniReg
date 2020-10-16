import Browser from './components/Browser.vue';

window._getRoutes = function(params){
    return [
        { path: '/', component: Browser, meta: { title: "Browser"}, props: params},
    ]

}