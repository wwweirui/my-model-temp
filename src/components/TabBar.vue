<script setup lang="ts">
const { t } = useI18n()
const active = ref(0)
const route = useRoute()

const routeWhiteList = ['home', 'profile', 'private']

const show = computed(() => routeWhiteList.includes(route.name))
</script>

<template>
  <van-tabbar v-if="show" v-model="active" placeholder route>
    <van-tabbar-item replace to="/">
      {{ '我要报名' }}
      <template #icon>
        <div class="i-carbon:home" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/profile">
      {{ t('layouts.profile') }}
      <template #icon>
        <div class="i-carbon:user" />
      </template>
    </van-tabbar-item>
    <van-tabbar-item replace to="/private">
      {{ t('layouts.home') }}
      <template #icon>
        <div class="i-carbon:3d-mpr-toggle" />
      </template>
    </van-tabbar-item>
  </van-tabbar>
</template>
