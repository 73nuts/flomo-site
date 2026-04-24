<script lang="ts">
  let popped = $state(false);
  let hearts = $state<Array<{ id: number; dx: number; rot: number; delay: number }>>([]);
  let nextId = 0;

  function onClick() {
    popped = true;
    const batch = Array.from({ length: 5 }, () => ({
      id: nextId++,
      dx: (Math.random() - 0.5) * 140,
      rot: (Math.random() - 0.5) * 90,
      delay: Math.random() * 0.25,
    }));
    hearts = [...hearts, ...batch];
    setTimeout(() => {
      hearts = hearts.filter((h) => !batch.some((b) => b.id === h.id));
    }, 1800);
    setTimeout(() => (popped = false), 2400);
  }
</script>

<button class="end-mark" type="button" onclick={onClick} aria-label="点击终字">
  <span class="glyph" class:popped>终</span>
  {#if popped}
    <span class="done">你 看 完 啦 ~</span>
  {/if}
  {#each hearts as h (h.id)}
    <span
      class="heart"
      style="--dx: {h.dx}px; --rot: {h.rot}deg; animation-delay: {h.delay}s"
      aria-hidden="true">♥</span>
  {/each}
</button>

<style>
  .end-mark {
    position: relative;
    display: block;
    width: 100%;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: center;
    margin-top: 36px;
    padding: 4px 0;
    font-family: var(--brush);
    font-size: 13px;
    color: var(--accent);
    letter-spacing: 0.4em;
    -webkit-tap-highlight-color: transparent;
  }
  .end-mark::before,
  .end-mark::after {
    content: '';
    display: inline-block;
    width: 14px;
    height: 1px;
    background: rgba(var(--accent-rgb), 0.35);
    vertical-align: middle;
    margin: 0 10px;
  }
  .glyph {
    display: inline-block;
    opacity: 0.55;
    transition: opacity 0.2s ease;
  }
  .glyph.popped {
    animation: endBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 1;
  }
  @keyframes endBounce {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.45) rotate(-6deg); }
    60%  { transform: scale(0.92) rotate(3deg); }
    100% { transform: scale(1) rotate(0); }
  }
  .done {
    position: absolute;
    left: 50%;
    top: -14px;
    transform: translateX(-50%);
    font-family: var(--brush);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.22em;
    opacity: 0.85;
    white-space: nowrap;
    animation: doneFloat 1.8s ease-out forwards;
    pointer-events: none;
  }
  @keyframes doneFloat {
    0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
    20%  { opacity: 0.9; transform: translateX(-50%) translateY(-10px); }
    80%  { opacity: 0.9; transform: translateX(-50%) translateY(-18px); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-28px); }
  }
  .heart {
    position: absolute;
    left: 50%;
    top: 50%;
    color: var(--accent);
    font-size: 16px;
    pointer-events: none;
    opacity: 0;
    animation: heartFly 1.5s ease-out forwards;
  }
  @keyframes heartFly {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6) rotate(0); }
    20%  { opacity: 1; transform: translate(calc(-50% + var(--dx) * 0.3), -80%) scale(1) rotate(calc(var(--rot) * 0.3)); }
    100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), -220%) scale(0.7) rotate(var(--rot)); }
  }
</style>
