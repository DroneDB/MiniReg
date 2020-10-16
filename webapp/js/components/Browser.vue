<template>
<div id="browser">
    TODO: list datasets if no :ds <br/>
    TODO: show dataset if :ds <br/>
    {{ org }}  - {{ ds }}
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import { getAuthToken } from '../auth';

export default {
  props: ["org", "ds"],
  components: {
      Message
  },
  data: function(){
      return {
          error: "",
      }
  },
  methods: {
      
  }
}
</script>

<style scoped>
#browser{

}
</style>