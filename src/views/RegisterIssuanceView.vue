<template>
  <div class="register-issuance-container">
    <Header @toggleLeftSidebar="toggleLeftSidebar" />
    <LeftSidebar :isHidden="isLeftSidebarHidden" />

    <div class="main-content" :class="{ 'sidebar-hidden': isLeftSidebarHidden }">
      <h1>등기&대장 발급하기</h1>
      <p>이 페이지는 준비 중입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from '../components/BaseHeader.vue'
import LeftSidebar from '../components/LeftSidebar.vue'

const isLeftSidebarHidden = ref(false)
const toggleLeftSidebar = () => {
  isLeftSidebarHidden.value = !isLeftSidebarHidden.value
}
</script>

<style scoped>
.register-issuance-container {
  display: flex;
  min-height: 100vh;
  background-color: #fafafa;
}
</style>
