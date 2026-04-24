<script lang="ts">
  import { onMount } from 'svelte';

  let n = $state(1);

  onMount(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem('ayd:visits');
      const counted = sessionStorage.getItem('ayd:counted');
      let state = raw ? JSON.parse(raw) : { date: today, n: 0 };
      if (state.date !== today) state = { date: today, n: 0 };
      if (!counted) {
        state.n += 1;
        sessionStorage.setItem('ayd:counted', '1');
      }
      localStorage.setItem('ayd:visits', JSON.stringify(state));
      n = state.n;
    } catch {
      /* localStorage 不可用（隐身模式）时静默降级 */
    }
  });
</script>

<div class="counter">
  <span>今 天 第</span>
  <span class="n">{n}</span>
  <span>次 来 看 阿 鸭</span>
  {#if n >= 10}
    <span class="whisper">既 然 这 么 想 我，不 如 给 我 发 消 息 吧</span>
  {/if}
</div>

<style>
  .counter {
    margin-top: 28px;
    padding: 20px 8px 10px;
    text-align: center;
    font-family: var(--brush);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.2em;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .n {
    font-family: var(--hand);
    font-size: 26px;
    color: var(--accent, var(--muted));
    line-height: 1;
    transform: rotate(-4deg);
    margin: 2px 0;
  }
  .whisper {
    margin-top: 10px;
    font-family: var(--hand);
    font-size: 13px;
    color: var(--accent, var(--muted));
    letter-spacing: 0.18em;
    opacity: 0.85;
    transform: rotate(-1.5deg);
    animation: whisperIn 0.9s 0.2s ease both;
  }
  @keyframes whisperIn {
    from { opacity: 0; transform: rotate(-1.5deg) translateY(6px); }
    to   { opacity: 0.85; transform: rotate(-1.5deg) translateY(0); }
  }
</style>
