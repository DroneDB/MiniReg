<template>
<div id="header">
    <a href="/" class="logo"><img style="width: 140px;" src="/images/banner.svg" alt="DroneDB"></a>
    <div class="right">
        <button v-if="!loggedIn" class="ui button primary" @click="signIn"><i class="icon lock"></i> Sign In</button>
        <div v-else class="circular ui icon top right pointing dropdown button" 
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
import { Registry } from 'ddb';
const reg = new Registry(window.location.origin);

export default {
  components: {
  },
  data: function(){
      return {
          loggedIn: reg.isLoggedIn(),
          username: reg.getUsername()
      }
  },
  mounted: function(){
      document.addEventListener('click', this.hideMenu);
  },
  destroyed: function(){
      document.removeEventListener('click', this.hideMenu);
  },
  methods: {
      signIn: function(){
          location.href = '/login';
      },

      toggleMenu: function(){
          this.$refs.menu.style.display = this.$refs.menu.style.display === 'block' ? 
                                          'none' : 
                                          'block';
      },

      hideMenu: function(){
          if (this.$refs.menu) this.$refs.menu.style.display = 'none';
      },

      logout: function(){
          reg.logout();
          location.href = '/login';
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
}
#header .logo{
    margin-top: 4px;
}
#header .right{
    margin-left: auto;
}
</style>