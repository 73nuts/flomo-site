<script lang="ts">
  import { onMount } from 'svelte';

  type Mood = 'morning' | 'afternoon' | 'dusk' | 'night';

  function skyFromHour(h: number): Mood {
    if (h < 6) return 'night';
    if (h < 11) return 'morning';
    if (h < 16) return 'afternoon';
    if (h < 20) return 'dusk';
    return 'night';
  }

  let mood = $state<Mood>('afternoon');

  onMount(() => {
    const update = () => (mood = skyFromHour(new Date().getHours()));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  });
</script>

<div class="sky {mood}"></div>

<style>
  .sky {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    pointer-events: none;
    transition: background 0.8s ease;
    z-index: 0;
  }
  .morning {
    background: linear-gradient(180deg, #fcd9b8 0%, #f8d1a8 22%, #f4e2cc 48%, #f5f1e9 78%);
  }
  .afternoon {
    background: linear-gradient(180deg, #f6e8c7 0%, #f3e2bc 25%, #f5ecd6 55%, #f5f1e9 85%);
  }
  .dusk {
    background: linear-gradient(180deg, #e9b48c 0%, #e8a78a 20%, #d89a9a 40%, #c79aaa 62%, #a898b5 80%, #f5f1e9 100%);
  }
  .night {
    background: linear-gradient(180deg, #242a3d 0%, #34374c 25%, #5a5266 50%, #9a8884 72%, #d4c5b8 88%, #f5f1e9 100%);
  }
</style>
