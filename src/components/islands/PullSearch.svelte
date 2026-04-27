<script lang="ts">
  /**
   * Pull-to-search 岛屿。在 tab 列表页顶部下拉揭出搜索栏。
   *
   * 触发条件（任一）：
   *   - 移动端：scrollY = 0 时下拉超过 50px → 揭出
   *   - 桌面端：按 "/" 键（焦点不在 input 时） → 揭出
   *
   * 关闭：ESC / 点击外部 / 提交 → 关闭
   * 提交：跳转 /find?q=<input>，由 /find 页负责实际搜索
   *
   * 不做实时搜索 —— v1 只做"门" + 跳转，/find 才是搜索本体。
   */
  import { onMount, tick } from 'svelte';

  let pullPx = 0;
  let touching = false;
  let opened = false;
  let touchStartY = 0;
  let inputEl: HTMLInputElement;
  let q = '';

  const THRESHOLD = 50;
  const MAX_PULL = 90;
  const BAR_HEIGHT = 60;

  $: barTransform = touching
    ? `translateY(${Math.min(0, -BAR_HEIGHT + pullPx)}px)`
    : opened
      ? 'translateY(0)'
      : `translateY(-${BAR_HEIGHT + 4}px)`;

  $: scrimVisible = opened || pullPx > 10;

  async function open() {
    opened = true;
    pullPx = 0;
    await tick();
    setTimeout(() => inputEl?.focus(), 320);
  }
  function close() {
    opened = false;
    pullPx = 0;
    inputEl?.blur();
  }
  function submit(e: Event) {
    e.preventDefault();
    const text = (q || '').trim();
    const target = text ? `/find?q=${encodeURIComponent(text)}` : '/find';
    window.location.href = target;
  }

  onMount(() => {
    function onTouchStart(e: TouchEvent) {
      if (opened) return;
      if (window.scrollY > 0) return;
      touchStartY = e.touches[0].clientY;
      touching = true;
    }
    function onTouchMove(e: TouchEvent) {
      if (!touching) return;
      const delta = e.touches[0].clientY - touchStartY;
      if (delta > 0) {
        pullPx = Math.min(delta * 0.55, MAX_PULL);
      } else {
        pullPx = 0;
      }
    }
    function onTouchEnd() {
      if (!touching) return;
      touching = false;
      if (pullPx > THRESHOLD) {
        open();
      } else {
        pullPx = 0;
      }
    }
    function onKey(e: KeyboardEvent) {
      const ae = document.activeElement;
      const tag = ae?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA';
      if (!opened && !inField && e.key === '/') {
        e.preventDefault();
        open();
      } else if (opened && e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    function onClickOutside(e: MouseEvent) {
      if (!opened) return;
      const t = e.target as Node;
      if (inputEl && !inputEl.contains(t) && !(t as HTMLElement).closest?.('.pull-search')) {
        close();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClickOutside);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
    };
  });
</script>

<!-- 半透明遮罩，搜索栏打开时盖住下方页面 -->
{#if scrimVisible}
  <div
    class="pull-scrim"
    class:on={opened}
    on:click={close}
    role="button"
    tabindex="-1"
  ></div>
{/if}

<div
  class="pull-search"
  class:transitioning={!touching}
  class:opened
  style="transform: {barTransform};"
>
  <form on:submit={submit}>
    <input
      bind:this={inputEl}
      bind:value={q}
      type="search"
      placeholder="记得是什么？"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="search"
      aria-label="找一句"
    />
  </form>
</div>

<style>
  .pull-search {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(250, 246, 238, 0.96);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(31, 29, 26, 0.12);
    z-index: 200;
    will-change: transform;
    transform: translateY(-64px);
  }
  .pull-search.transitioning {
    transition: transform 0.42s cubic-bezier(.25, .85, .2, 1);
  }
  .pull-search form {
    height: 100%;
    padding: 0 24px;
    display: flex;
    align-items: center;
  }
  .pull-search input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: 0;
    border-bottom: 1px solid var(--ink, #1f1d1a);
    padding: 6px 0 8px;
    font-family: 'Noto Serif SC', serif;
    font-weight: 400;
    font-size: 17px;
    color: var(--ink, #1f1d1a);
    letter-spacing: 0.02em;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 0;
  }
  .pull-search input::placeholder {
    font-family: 'Ma Shan Zheng', cursive;
    font-weight: 400;
    color: rgba(31, 29, 26, 0.32);
    font-size: 16px;
    letter-spacing: 0.06em;
  }
  /* 隐藏原生 search input 的 X 按钮，与设计语言不符 */
  .pull-search input::-webkit-search-cancel-button { display: none; }

  .pull-scrim {
    position: fixed;
    inset: 0;
    background: rgba(20, 18, 14, 0);
    z-index: 199;
    pointer-events: none;
    transition: background 0.42s ease;
  }
  .pull-scrim.on {
    background: rgba(20, 18, 14, 0.18);
    pointer-events: auto;
  }
</style>
