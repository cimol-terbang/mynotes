<script>
  import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORIES } from '$lib/constants.js';
  export let activeCategory = null;
</script>

<nav class="flex flex-wrap gap-2 mb-8 sm:mb-10" aria-label="Filter by category">
  <a href="/"
    class="inline-flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] sm:min-h-[44px] rounded-full text-xs font-medium tracking-wide uppercase transition-all
      {activeCategory === null
        ? 'bg-ink-900 text-ink-50 shadow-sm dark:bg-violet-glow dark:text-white dark:shadow-[0_0_16px_rgba(139,92,246,0.4)]'
        : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-night-950/60 dark:text-night-400 dark:border dark:border-violet-dark/20 dark:hover:border-violet-DEFAULT/40 dark:hover:text-violet-light'}">
    All
  </a>

  {#each CATEGORIES as cat}
    <a href="/?category={cat}"
      class="inline-flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] sm:min-h-[44px] rounded-full text-xs font-medium tracking-wide uppercase transition-all
        {activeCategory === cat
          ? 'bg-ink-900 text-ink-50 shadow-sm dark:bg-violet-glow dark:text-white dark:shadow-[0_0_16px_rgba(139,92,246,0.4)]'
          : 'bg-ink-100 text-ink-500 hover:bg-ink-200 dark:bg-night-950/60 dark:text-night-400 dark:border dark:border-violet-dark/20 dark:hover:border-violet-DEFAULT/40 dark:hover:text-violet-light'}">
      <span class="text-accent dark:text-violet-DEFAULT text-[10px]" aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
      {CATEGORY_LABELS[cat]}
    </a>
  {/each}
</nav>
