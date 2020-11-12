<template>
<div id="browser">
    <Message bindTo="error" />

    <FileBrowser :rootNodes="rootNodes" 
                    @selectionChanged="handleFileSelectionChanged" 
                    @openProperties="handleFileBrowserOpenProperties"
                    @unauthorized="handleUnauthorized" />
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import FileBrowser from 'commonui/components/FileBrowser.vue';
import ddb from 'ddb';

const { Registry } = ddb;
const reg = new Registry(window.location.origin);

export default {
    props: ["org", "ds"],
    components: {
        Message,
        FileBrowser
    },
    data: function () {
        return {
            error: "",
        }
    },
    mounted: function(){
    },
    methods: {
        rootNodes: async function () {
            const dataset = reg.Organization(this.$route.params.org)
                               .Dataset(this.$route.params.ds);

            return [{
                icon: "icon database",
                label: this.$route.params.ds,
                path: dataset.remoteUri(".")
            }];
        },

        handleFileSelectionChanged: function(){
            // TODO
        },

        handleFileBrowserOpenProperties: function(){
            // TODO
        },

        handleUnauthorized: function(){

        }
    }
}
</script>

<style scoped>
#browser {}
</style>
