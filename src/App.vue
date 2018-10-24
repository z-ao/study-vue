<template>
  <div id="app">
    <span v-if="!count">{{ count }}</span>
    <div v-else>ha</div>
    <span @click="count++">add</span>
  </div>
</template>

<script>
    export default {
        name: 'app',
        data() {
            return{
                count: 0
            }
        },
        created() {
            console.log('hah')
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
