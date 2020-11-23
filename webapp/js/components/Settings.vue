<template>
<div class="settings">
    <Message bindTo="error" />

<h4 class="ui header">
  <i class="unlock icon"></i>
  <div class="content">
    Visibility:
    <div class="ui inline dropdown" @click.stop="toggleVisibilityMenu">
      <div class="text">public</div>
      <i class="dropdown icon"></i>
      <div class="menu" ref="visibilityMenu">
        <div class="active item">public</div>
        <div class="item">private</div>
      </div>
    </div>
  </div>
</h4>

<!--
<h4 class="ui header">
  <i class="key icon"></i>
  <div class="content">
    Password: not set
  </div>
</h4>-->

<div class="description">
Anybody with the <a :href="currentUrl">link</a> to this page can see and download the data.
</div>

</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import mouse from 'commonui/mouse';

export default {
    props: {
        dataset:{
            required: true,
            type: Object
        }
    },
    components: {
        Message
    },
    data: function () {
        return {
            error: ""
        }
    },
    mounted: function(){
        // TODO: add code to handle dropdowns in commonui
        // duplication here and in Header.vue to handle show
        // click, toggle, etc.
        mouse.on("click", this.hideVisibilityMenu);
    },
    beforeDestroy: function(){
        mouse.off("click", this.hideVisibilityMenu);
    },
    computed: {
        currentUrl: function(){
            return window.location.href;
        }
    },
    methods: {
        toggleVisibilityMenu: function(){
            if (this.$refs.visibilityMenu) this.$refs.visibilityMenu.style.display = this.$refs.visibilityMenu.style.display === 'block' ? 
                                                        'none' : 'block';
        },
        hideVisibilityMenu: function(){
            if (this.$refs.visibilityMenu) this.$refs.visibilityMenu.style.display = 'none';
        }
    }
}
</script>

<style scoped>
.settings{
    padding: 8px;
    margin-top: 12px;
    .visibility{
        font-size: 110%;
    }
    .description{
        font-size: 90%;
        margin-top: 12px;
    }
    a{
        text-decoration: underline;
    }
}
</style>
