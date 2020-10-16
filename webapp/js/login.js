import Login from './components/Login.vue';

window._getRoutes = function(){
    return [
        { path: '/', component: Login, meta: { title: "Login" } }
    ]
}