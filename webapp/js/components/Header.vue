<template>
<div id="header">
    <a href="/" class="logo"><img style="width: 140px;" src="/images/banner.svg" alt="DroneDB"></a>
    <div class="right">
        <button v-if="!loggedIn" class="ui button primary" @click="login"><i class="icon lock"></i> Sign In</button>
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
import reg from '../libs/sharedRegistry';

export default {
  components: {
  },
  data: function(){
      return {
          username: reg.getUsername(),
          loggedIn: reg.isLoggedIn()
      }
  },
  mounted: function(){
      document.addEventListener('click', this.hideMenu);

      reg.addEventListener('login', this.onRegLogin);
      reg.addEventListener('logout', this.onRegLogout);
      
  },
  destroyed: function(){
      reg.removeEventListener('login', this.onRegLogin);
      reg.removeEventListener('logout', this.onRegLogout);

      document.removeEventListener('click', this.hideMenu);
  },
  methods: {
      onRegLogin: function(username){
          console.log(username);
          this.username = username;
          this.loggedIn = true;
      },
      
      onRegLogout: function(){
          this.username = "";
          this.loggedIn = false;
      },

      login: function(){
          this.$emit("login");
      },

      toggleMenu: function(){
          if (this.$refs.menu) this.$refs.menu.style.display = this.$refs.menu.style.display === 'block' ? 
                                          'none' : 
                                          'block';
      },

      hideMenu: function(){
          if (this.$refs.menu) this.$refs.menu.style.display = 'none';
      },

      logout: function(){
          this.$emit("logout");
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