<script setup lang="ts">
import { storeToRefs } from 'pinia'
import useAppStore from '@/stores/modules/app'
import useRouteCache from '@/stores/modules/routeCache'
import useAutoThemeSwitcher from '@/hooks/useAutoThemeSwitcher'

useHead({
  title: '德邦私募大赛',
  meta: [
    {
      name: 'description',
      content: '私募大赛',
    },
    {
      name: 'theme-color',
      content: () => isDark.value ? '#00aba9' : '#ffffff',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: () => '/favicon.ico',
    },
  ],
})

const appStore = useAppStore()
const { mode } = storeToRefs(appStore)

const { initializeThemeSwitcher } = useAutoThemeSwitcher(appStore)

const keepAliveRouteNames = computed(() => {
  return useRouteCache().routeCaches as string[]
})

onMounted(() => {
  initializeThemeSwitcher()
})
</script>

<template>
  <VanConfigProvider :theme="mode">
    <!-- <NavBar /> -->
    <router-view v-slot="{ Component, route }">
      <section class="app-wrapper">
        <keep-alive :include="keepAliveRouteNames">
          <component :is="Component" :key="route.name" />
        </keep-alive>
      </section>
    </router-view>
    <!-- <TabBar /> -->
  </VanConfigProvider>
</template>

<style scoped>
.app-wrapper {
  width: 100%;
  position: relative;
  /* padding: 10px; */
}
</style>
