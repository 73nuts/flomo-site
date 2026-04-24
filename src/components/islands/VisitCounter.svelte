<script lang="ts">
  import { onMount } from 'svelte';

  let n = $state(1);
  let isMidnight = $state(false);

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
    isMidnight = new Date().getHours() < 5;
  });
</script>

<div class="counter">
  <span>今 天 第</span>
  <span class="n">{n}</span>
  <span>次 来 看 阿 鸭</span>
  {#if n >= 10}
    <span class="whisper">
      <svg class="whisper-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.5-9-9.5C1.5 7 5 4 8 4c1.8 0 3.2.8 4 2 .8-1.2 2.2-2 4-2 3 0 6.5 3 5 7.5-2 5-9 9.5-9 9.5z" fill="currentColor"/>
      </svg>
      <span>既 然 这 么 想 我，不 如 给 我 发 消 息 吧</span>
      <svg class="whisper-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.5-9-9.5C1.5 7 5 4 8 4c1.8 0 3.2.8 4 2 .8-1.2 2.2-2 4-2 3 0 6.5 3 5 7.5-2 5-9 9.5-9 9.5z" fill="currentColor"/>
      </svg>
    </span>
  {/if}
  {#if isMidnight}
    <span class="late-night">
      <span class="moon" aria-hidden="true">🌙</span>
      <span>这 么 晚 还 想 我，快 去 睡 吧</span>
    </span>
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
    margin-top: 14px;
    font-family: var(--brush);
    font-size: 12.5px;
    color: var(--accent, var(--muted));
    letter-spacing: 0.22em;
    opacity: 0.92;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    animation: whisperIn 0.9s 0.15s ease both;
  }
  .whisper-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    opacity: 0.85;
    display: inline-block;
    vertical-align: -2px;
  }
  @keyframes whisperIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 0.92; transform: translateY(0); }
  }
  .late-night {
    margin-top: 10px;
    font-family: var(--brush);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.22em;
    opacity: 0.78;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    animation: whisperIn 1s 0.3s ease both;
  }
  .moon {
    font-size: 13px;
    display: inline-block;
    animation: moonSway 3.2s ease-in-out infinite;
  }
  @keyframes moonSway {
    0%, 100% { transform: rotate(-6deg); }
    50%      { transform: rotate(6deg); }
  }
</style>
