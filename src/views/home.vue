<template>
  <div class=''>
     <a-button @click="handleClick">加入</a-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

function handleClick() {
    window.location.href = 'http://localhost:8080'
}
</script>

<style lang='scss' scoped>

</style>
