<template>
<div id="login">
    <div class="ui grid stackable">
        <div class="six wide column"></div>
        <div class="four wide column">
            <img src="/images/logo.png" alt="Logo" class="logo" />
            <h2>Welcome Back</h2>
            <p>Sign in with your credentials</p>
            <Message bindTo="error" />
            <form class="ui form">
                <div class="field">
                    <label>Username</label>
                    <input v-model="username" type="text" name="username" placeholder="">
                </div>
                <div class="field">
                    <label>Password</label>
                    <input v-model="password" type="password" name="password" placeholder="">
                </div>
                <button :class="{loading: loggingIn}" class="ui button primary" type="submit" @click="login">Login</button>
            </form>
        </div>
        <div class="six wide column"></div>
    </div>
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import { setAuthToken } from '../auth';

export default {
  components: {
      Message
  },
  data: function(){
      return {
          error: "",

          loggingIn: false,
          username: "",
          password: ""
      }
  },
  methods: {
      login: async function(e){
        e.preventDefault();
        this.loggingIn = true;
        
        const formData = new FormData();
        formData.append("username", this.username);
        formData.append("password", this.password);

        try{
            const res = await fetch("/users/authenticate", {
                method: 'POST',
                body: formData
            }).then(r => r.json());
            if (res.token){
                setAuthToken(res.token);
                this.$router.push({ path: '/r', param: { org: this.username } });
            }else{
                this.error = res.error || `Cannot login: ${JSON.stringify(res)}`;
            }
        }catch(e){
            this.error = `Cannot login: ${e.message}`;
        }

        this.loggingIn = false;
      }
  }
}
</script>

<style scoped>
#login{
    margin-top: 32px;
    text-align: center;
    .logo{
        width: 64px;
        height: 64px;
    }
}
</style>