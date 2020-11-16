<template>
<div id="browser" class="cui app">
    <Message bindTo="error" />

    <div class="container main">
        <div class="sidebar">
            <div class="tabs">
                <div class="tab">
                        <FileBrowser :rootNodes="rootNodes" 
                            @selectionChanged="handleFileSelectionChanged" 
                            @openProperties="handleFileBrowserOpenProperties"
                            @unauthorized="handleUnauthorized" />
                </div>
            </div>
        </div>
        <div class="container vertical">
            <Explorer :files="fileBrowserFiles" @folderOpened="handleFileSelectionChanged" @openProperties="handleExplorerOpenProperties" />
            <Map :files="fileBrowserFiles" />
        </div>
        <Properties v-if="showProperties" :files="selectedFiles" @onClose="handleCloseProperties" />
    </div>
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import FileBrowser from 'commonui/components/FileBrowser.vue';
import Map from 'commonui/components/Map.vue';
import Explorer from 'commonui/components/Explorer.vue';
import Properties from 'commonui/components/Properties.vue';
import pathutils from 'commonui/classes/pathutils';
import icons from 'commonui/classes/icons';

import ddb from 'ddb';

const { Registry } = ddb;
const reg = new Registry(window.location.origin);

export default {
    props: ["org", "ds"],
    components: {
        Message,
        FileBrowser,
        Map,
        Explorer,
        Properties
    },
    data: function () {
        return {
            error: "",
            fileBrowserFiles: [],
            showProperties: false,
            selectedUsingFileBrowserList: false,
        }
    },
    mounted: function(){
        document.getElementById("app").classList.add("fullpage");
    },
    destroyed: function(){
        document.getElementById("app").classList.remove("fullpage");
    },
    computed: {
        selectedFiles: function () {
            if (this.selectedUsingFileBrowserList) {
                return this.fileBrowserFiles;
            } else {
                return this.fileBrowserFiles.filter(f => f.selected);
            }
        }
    },
    methods: {
        rootNodes: async function () {
            const dataset = reg.Organization(this.$route.params.org)
                               .Dataset(this.$route.params.ds);
            const entries = await dataset.info();

            return entries.map(e => { return {
                    icon: icons.getForType(e.type),
                    label: pathutils.basename(e.path),
                    path: e.path,
                    entry: e
                };
            });
        },

        handleFileSelectionChanged: function (fileBrowserFiles) {
            this.fileBrowserFiles.forEach(f => f.selected = false);
            this.fileBrowserFiles = fileBrowserFiles;
        },
        handleExplorerOpenProperties: function () {
            this.showProperties = true;
            this.selectedUsingFileBrowserList = false;
        },
        handleFileBrowserOpenProperties: function () {
            this.showProperties = true;
            this.selectedUsingFileBrowserList = true;
        },
        handleCloseProperties: function () {
            this.showProperties = false;
        },

        handleUnauthorized: function(){

        }
    }
}
</script>

<style scoped>
</style>
