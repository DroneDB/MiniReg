<template>
<div id="login">
    <div class="ui grid stackable">
        <div class="five wide column"></div>
        <div class="six wide column">
            <h2>Welcome Back</h2>
            <p>Sign in with your credentials</p>
            <form class="ui large form">
                <div class="ui segment">
                    <div class="field">
                        <div class="ui left icon input">
                            <i class="user icon"></i>
                            <input v-on:keyup.enter="login" v-model="username" autocomplete="off" type="text" name="username" placeholder="Username">
                        </div>
                    </div>
                    <div class="field">
                        <div class="ui left icon input">
                            <i class="key icon"></i>
                            <input v-on:keyup.enter="login" v-model="password" type="password" name="password" placeholder="Password">
                        </div>
                    </div>
                    <div @click="login" :class="{loading: loggingIn}" class="ui fluid large primary submit button">Login</div>
                </div>
            </form>
            <Message bindTo="error" />
        </div>
        <div class="five wide column"></div>
    </div>
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import { Registry } from 'ddb';

const reg = new Registry(window.location.origin);

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
  beforeMount: function(){
      if (reg.isLoggedIn()){
          location.href = `/r/${reg.getUsername()}`;
      }
  },
  methods: {
      login: async function(e){
        e.preventDefault();
        this.loggingIn = true;
        this.error = "";
        
        const formData = new FormData();
        formData.append("username", this.username);
        formData.append("password", this.password);

        try{
            const res = await fetch("/users/authenticate", {
                method: 'POST',
                body: formData
            }).then(r => r.json());
            if (res.token){
                reg.setCredentials(this.username, res.token, res.expires);

                // TODO: previous URL redirect to
                window.location.href = `/r/${this.username}`;
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