<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    prevHref: string | null;
    nextHref: string | null;
    closeHref: string;
  }

  let { prevHref, nextHref, closeHref }: Props = $props();

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevHref) window.location.href = prevHref;
      else if (e.key === 'ArrowRight' && nextHref) window.location.href = nextHref;
      else if (e.key === 'Escape') window.location.href = closeHref;
    };

    let startX: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (startX == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0 && nextHref) window.location.href = nextHref;
        else if (dx > 0 && prevHref) window.location.href = prevHref;
      }
      startX = null;
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  });
</script>

<nav class="read-nav" aria-label="翻页">
  {#if prevHref}
    <a class="arr" href={prevHref} aria-label="上一则">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  {:else}
    <span class="arr disabled" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  {/if}
  <span class="dot" aria-hidden="true"></span>
  {#if nextHref}
    <a class="arr" href={nextHref} aria-label="下一则">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  {:else}
    <span class="arr disabled" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  {/if}
</nav>

<style>
  .read-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    color: var(--muted);
    margin-top: 40px;
    padding-bottom: 40px;
  }
  .arr {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transition: color 0.2s ease, background 0.2s ease;
    color: inherit;
  }
  .arr:hover {
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.08);
  }
  .arr.disabled {
    opacity: 0.25;
    pointer-events: none;
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.35;
  }
</style>
