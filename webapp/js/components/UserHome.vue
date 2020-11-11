<template>
<div id="userhome">
    Hi!
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import ddb from 'ddb';

const { Registry } = ddb;
const reg = new Registry(window.location.origin);

export default {
    props: ["org"],
    components: {
        Message
    },
    data: function () {
        return {
            error: "",
        }
    },
    mounted: function(){

    },
    methods: {
        
    }
}
</script>

<style scoped>
#userhome {}
</style>
