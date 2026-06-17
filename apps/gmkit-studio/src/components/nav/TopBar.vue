<template>
  <header class="topbar">
    <button class="nav-toggle" type="button" aria-label="打开导航" @click="$emit('toggleNav')">
      <span />
      <span />
      <span />
    </button>

    <RouterLink class="brand" to="/">
      <span class="brand-mark">GM</span>
      <span>
        <strong>GMKit Studio</strong>
        <small>Open Crypto Tool Platform</small>
      </span>
    </RouterLink>

    <label class="global-search">
      <span>搜索</span>
      <input type="search" placeholder="搜索算法、工具、接口模板..." />
      <kbd>Ctrl K</kbd>
    </label>

    <nav class="topnav" aria-label="顶部导航">
      <RouterLink to="/">工具</RouterLink>
      <a href="https://github.com/gmkits/gmkit" target="_blank" rel="noreferrer">GitHub</a>
      <RouterLink to="/about">关于</RouterLink>
    </nav>

    <div class="topbar-actions">
      <button class="icon-button" type="button" aria-label="切换主题">☼</button>
      <a class="primary-link" href="https://github.com/gmkits/gmkit" target="_blank" rel="noreferrer">
        查看仓库
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  toggleNav: [];
}>();
</script>
