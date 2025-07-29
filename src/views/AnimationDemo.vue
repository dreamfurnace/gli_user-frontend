<template>
  <div class="animation-demo">
    <header class="demo-header">
      <h1>애니메이션/트랜지션 데모</h1>
      <p>Fade, Slide, Scale 트랜지션과 Spinner 컴포넌트의 동작을 확인할 수 있습니다.</p>
    </header>

    <main class="demo-content">
      <section class="demo-section">
        <h2>Fade 트랜지션</h2>
        <button @click="showFade = !showFade">Fade 토글</button>
        <FadeTransition>
          <div v-if="showFade" class="demo-box fade">Fade In/Out</div>
        </FadeTransition>
      </section>

      <section class="demo-section">
        <h2>Slide 트랜지션</h2>
        <button @click="showSlide = !showSlide">Slide 토글</button>
        <SlideTransition>
          <div v-if="showSlide" class="demo-box slide">Slide In/Out</div>
        </SlideTransition>
      </section>

      <section class="demo-section">
        <h2>Scale 트랜지션</h2>
        <button @click="showScale = !showScale">Scale 토글</button>
        <ScaleTransition>
          <div v-if="showScale" class="demo-box scale">Scale In/Out</div>
        </ScaleTransition>
      </section>

      <section class="demo-section">
        <h2>Spinner (로딩)</h2>
        <Spinner aria-label="로딩 중" />
      </section>

      <section class="demo-section">
        <h2>Button 그룹 트랜지션</h2>
        <button @click="showButtonGroup = !showButtonGroup">버튼 그룹 토글</button>
        <FadeTransition>
          <div v-if="showButtonGroup" class="button-group-demo">
            <button class="demo-btn">버튼1</button>
            <button class="demo-btn">버튼2</button>
            <button class="demo-btn">버튼3</button>
          </div>
        </FadeTransition>
      </section>

      <section class="demo-section">
        <h2>Input 필드 트랜지션</h2>
        <button @click="showInput = !showInput">Input 토글</button>
        <SlideTransition>
          <input v-if="showInput" class="demo-input" placeholder="트랜지션 Input" />
        </SlideTransition>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FadeTransition from '@/components/animations/FadeTransition.vue'
import SlideTransition from '@/components/animations/SlideTransition.vue'
import ScaleTransition from '@/components/animations/ScaleTransition.vue'
import Spinner from '@/components/loading/Spinner.vue'

const showFade = ref(true)
const showSlide = ref(true)
const showScale = ref(true)
const showButtonGroup = ref(true)
const showInput = ref(true)
</script>

<style scoped>
.animation-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.demo-header {
  text-align: center;
  margin-bottom: 32px;
}
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
.demo-section {
  background: #fafbfc;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}
.demo-section h2 {
  margin-bottom: 12px;
}
.demo-box {
  margin-top: 16px;
  width: 200px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}
.fade {
  background: #2684ff;
}
.slide {
  background: #4caf50;
}
.scale {
  background: #ff9800;
}
button {
  margin-top: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #222;
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: background 0.2s;
}
button:hover {
  background: #444;
}
.button-group-demo {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}
.demo-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #2684ff;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.demo-btn:hover {
  background: #185bb5;
}
.demo-input {
  margin-top: 16px;
  padding: 10px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
  width: 220px;
}
</style>
