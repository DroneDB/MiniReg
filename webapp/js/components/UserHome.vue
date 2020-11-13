<template>
<div id="userhome">
    <Message bindTo="error" />

    <h3>{{ $route.params.org }}</h3>

    <div v-if="loading" class="loading">
        <i class="icon circle notch spin" />
    </div>
    <div v-else v-for="ds in datasets" class="ui segments datasets">
        <div class="ui segment">
            <div class="ui middle aligned divided list">
                <div class="item">
                    <div class="right floated">
                        <button @click.stop="handleDelete(ds)" class="ui button icon small negative" 
                            :class="{loading: ds.deleting}"
                            :disabled="ds.deleting"><i class="ui icon trash"></i></button>
                    </div>
                    
                    <a :href="$route.params.org + '/' + ds.slug"><i class="large database icon"></i> {{ds.slug}}</a>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import Message from 'commonui/components/Message.vue';
import ddb from 'ddb';

const { Registry } = ddb;
const reg = new Registry(window.location.origin);

export default {
    components: {
        Message
    },
    data: function () {
        return {
            error: "",
            datasets: [],
            loading: true
        }
    },
    mounted: async function(){
        try{
            this.org = reg.Organization(this.$route.params.org)
            this.datasets = await this.org.datasets();
        }catch(e){
            this.error = e.message;
        }
        this.loading = false;
    },
    methods: {
        async handleDelete(ds){
            if (window.confirm(`Are you sure you want to delete ${ds.slug}?`)){
                this.$set(ds, 'deleting', true);
                try{
                    if (await this.org.Dataset(ds.slug).delete()){
                        this.datasets = this.datasets.filter(d => d !== ds);
                    }
                }catch(e){
                    console.log(e.message);
                    this.error = e.message;
                }
                this.$set(ds, 'deleting', false);
            }
        }
    }
}
</script>

<style scoped>
#userhome {
    margin: 12px;
    margin-top: 16px;
    .datasets{
        a{
            font-size: 120%;
            position: relative;
            top: 2px;
        }
        i.database{
            color: #030A03;
        }
    }
}
</style>
