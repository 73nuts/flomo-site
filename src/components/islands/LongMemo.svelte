<script lang="ts">
  /**
   * 长 memo 折叠岛。
   * 初始渲染时 server 把内容塞进 <slot />，
   * 客户端 hydrate 后根据 expanded 状态切换遮罩。
   */
  let expanded = $state(false);
</script>

<div class="long-memo" class:expanded>
  <div class="body-wrap">
    <slot />
  </div>
  <button
    class="expand"
    type="button"
    onclick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      expanded = !expanded;
    }}
  >
    {expanded ? '收 起' : '展 开 全 文'}
  </button>
</div>

<style>
  .long-memo {
    position: relative;
  }
  .body-wrap {
    position: relative;
    max-height: 220px;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, #000 0, #000 72%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 72%, transparent 100%);
    transition: max-height 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .expanded .body-wrap {
    max-height: 4000px;
    mask-image: none;
    -webkit-mask-image: none;
    transition: max-height 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .expand {
    display: block;
    width: 100%;
    margin: 12px 0 -6px;
    padding: 10px 8px 2px;
    text-align: center;
    font-family: var(--sans);
    font-size: 10.5px;
    color: var(--accent);
    letter-spacing: 0.28em;
    position: relative;
    z-index: 2;
    transition: opacity 0.2s ease;
  }
  .expand:hover {
    opacity: 0.75;
  }
  .expand::before,
  .expand::after {
    content: '';
    display: inline-block;
    width: 18px;
    height: 1px;
    background: rgba(var(--accent-rgb), 0.3);
    vertical-align: middle;
    margin: 0 7px;
  }
</style>
