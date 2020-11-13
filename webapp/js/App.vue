<template>
<div id="app">
    <Header @login="handleLogin" @logout="handleLogout" />
    <div ref="views">
    </div>
</div>
</template>

<script>
import Vue from 'vue';
import VueRouter from 'vue-router';

import Header from './components/Header.vue';
import Login from './components/Login.vue';
import UserHome from './components/UserHome.vue';
import ViewDataset from './components/ViewDataset.vue';
import reg from './libs/sharedRegistry';

const APP_NAME = "DroneDB";

export default {
  components: {
      Header
  },
  mounted: function(){
        Vue.use(VueRouter);
        
        const routes = [
            { path: '/r/:org/:ds', name: "ViewDataset", component: ViewDataset, meta: { title: "Browser"}},
            { path: '/login', name: "Login", component: Login, meta: { title: "Login" } },
            { path: '/r/:org', name: "UserHome", component: UserHome, meta: { title: "Home"}}
        ];
        const router = new VueRouter({ mode: "history", routes });

        // Set titles
        router.beforeEach((to, _, next) => {
            document.title = to.meta.title + ` - ${APP_NAME}`;
            next();
        });

        this.$refs.views.appendChild(document.createElement("router-view"));

        new Vue({
            router
        }).$mount(this.$refs.views);

        // Make accessible
        this.router = router;

        // Refresh auth tokens
        if (reg.isLoggedIn()){
            reg.refreshToken();
            reg.setAutoRefreshToken();
        }

        document.getElementById("main-loading").style.display = 'none';
  },
  destroyed: function(){
  },
  methods: {
      handleLogout: function(){
          reg.logout();
          this.handleLogin();
      },

      handleLogin: function(){
          this.router.push({name: "Login"}).catch(()=>{});
      }
  }
}
</script>

<style scoped>
</style>