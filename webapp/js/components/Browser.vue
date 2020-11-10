<template>
<div id="browser">
    {{ org }} - {{ ds }}

    <FileBrowser :rootNodes="rootNodes" @selectionChanged="handleFileSelectionChanged" @openProperties="handleFileBrowserOpenProperties" />
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import FileBrowser from 'commonui/components/FileBrowser.vue';
import ddb from 'ddb';

import {
    getAuthToken
} from '../auth';

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
    methods: {
        rootNodes: async function () {
            const dataset = new ddb.Dataset(`${this.org}/${this.ds}`);

            return [{
                icon: "icon database",
                label: this.ds,
                path: dataset.remotePath(".")
            }];
        },

        handleFileSelectionChanged: function(){
            // TODO
        },

        handleFileBrowserOpenProperties: function(){
            // TODO
        }
    }
}
</script>

<style scoped>
#browser {}
</style>
