<template>
<div id="browser">
    {{ org }} - {{ ds }}

    <FileBrowser :loadRootNodes="loadRootNodes" @selectionChanged="handleFileSelectionChanged" @openProperties="handleFileBrowserOpenProperties" />
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import FileBrowser from 'commonui/components/FileBrowser.vue';
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
        loadRootNodes: async function () {
            return [{
                icon: "icon database",
                label: "test",
                path: "test"
            }];
        }
    }
}
</script>

<style scoped>
#browser {}
</style>
