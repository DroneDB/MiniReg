<template>
<div id="header">
    <a :href="homeUrl" class="logo"><img style="width: 140px;" src="/images/banner.svg" alt="DroneDB"></a>
    <div class="right">
        <button v-if="showDownload" class="ui button primary" @click="downloadDataset"><i class="icon download"></i> Download</button>
        <button v-if="!loggedIn" class="ui button primary" @click="login"><i class="icon lock"></i> Sign In</button>
        <div v-else class="circular ui icon top right pointing dropdown button user-menu" 
            @click.stop="toggleMenu"
            :title="username">
            <i class="icon user"></i>
            <div class="menu" ref="menu">
                <div class="header">{{ username }} </div>
                <div class="item" @click="logout" >Logout</div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import reg from '../libs/sharedRegistry';

export default {
  components: {
  },
  data: function(){
      return {
          username: reg.getUsername(),
          loggedIn: reg.isLoggedIn(),
          params: this.$route.params,
          showDownload: !!this.$route.params.ds && reg.isLoggedIn()
      }
  },
  computed: {
      homeUrl: function(){
          if (this.loggedIn){
              return `/r/${this.username}`;
          }else return "/";
      }
  },
  mounted: function(){
      document.addEventListener('click', this.hideMenu);

      reg.addEventListener('login', this.onRegLogin);
      reg.addEventListener('logout', this.onRegLogout);
  },
  watch: {
      $route: function(to, from){
          const { params } = to;
          
          // TODO: we might need have more complex 
          // logic in the future to see who has access
          // to download files?
          this.showDownload = !!params.ds && reg.isLoggedIn(); 
          this.params = params;
      }
  },
  unmounted: function(){
      reg.removeEventListener('login', this.onRegLogin);
      reg.removeEventListener('logout', this.onRegLogout);

      document.removeEventListener('click', this.hideMenu);
  },
  methods: {
      onRegLogin: function(username){
          this.username = username;
          this.loggedIn = true;
      },
      
      onRegLogout: function(){
          this.username = "";
          this.loggedIn = false;
      },

      logout: function(){
          reg.logout();
          this.login();
      },

      login: function(){
          this.$router.push({name: "Login"}).catch(()=>{});
      },

      toggleMenu: function(){
          if (this.$refs.menu) this.$refs.menu.style.display = this.$refs.menu.style.display === 'block' ? 
                                          'none' : 
                                          'block';
      },

      hideMenu: function(){
          if (this.$refs.menu) this.$refs.menu.style.display = 'none';
      },

      downloadDataset: function(){
          const { org, ds } = this.params;

          location.href = reg.Organization(org).Dataset(ds).downloadUrl();
      }
  }
}
</script>

<style scoped>
#header{
    margin: 0;
    padding: 8px;
    padding-top: 12px;
    width: 100%;
    box-shadow: 0px 2px 4px -2px #000000;
    display: flex;
    .logo{
        margin-top: 4px;
    }
    .right{
        margin-left: auto;
    }
    .user-menu{
        margin-left: 8px;
    }
}
</style>