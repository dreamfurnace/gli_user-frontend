<template>
	<img
		:src="phantomIconImg"
		:alt="alt"
		:class="className"
		class="phantom-icon"
	/>
</template>

<script setup lang="ts">
import phantomIconImg from "/img/Phantom-Icon_Circle_60x60.png";

interface Props {
	className?: string;
	alt?: string;
}

withDefaults(defineProps<Props>(), {
	className: "w-6 h-6",
	alt: "Phantom Wallet",
});
</script>

<style scoped>
.phantom-icon {
	width: 100%;
	height: 100%;
	object-fit: contain;
}
</style>
