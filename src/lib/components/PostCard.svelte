<script>
  import { CATEGORY_LABELS, CATEGORY_ICONS } from '$lib/constants.js';
  import { generateTagSlug } from '$lib/tags.js';
  export let post;

  const categoryColors = {
    essay:   'dark:text-violet-light dark:bg-violet-dark/20 dark:border-violet-dark/30',
    poetry:  'dark:text-pink-300 dark:bg-pink-900/20 dark:border-pink-800/30',
    story:   'dark:text-sky-300 dark:bg-sky-900/20 dark:border-sky-800/30',
  };

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
</script>

<article class="group py-6 sm:py-8">
  <a href="/{post.slug}" class="block rounded-xl p-4 sm:p-5 -mx-4 sm:-mx-5
    hover:bg-ink-100/60 dark:hover:bg-violet-dark/10
    dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]
    transition-all duration-300">

    <!-- Category + date row -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border
        bg-ink-100 text-ink-500 border-ink-200
        {categoryColors[post.category]}">
        <span aria-hidden="true">{CATEGORY_ICONS[post.category]}</span>
        {CATEGORY_LABELS[post.category]}
      </span>
      <span class="text-ink-200 dark:text-night-700" aria-hidden="true">·</span>
      <time class="text-xs text-ink-400 dark:text-night-500" datetime={post.createdAt}>
        {formatDate(post.createdAt)}
      </time>
    </div>

    <!-- Title -->
    <h2 class="font-serif text-lg sm:text-xl font-semibold text-ink-900 dark:text-night-100 mb-2 leading-snug
      group-hover:text-accent dark:group-hover:text-violet-light transition-colors text-balance">
      {post.title}
    </h2>

    <!-- Excerpt -->
    <p class="text-ink-500 dark:text-night-400 text-sm leading-relaxed line-clamp-2 mb-3">
      {post.excerpt}
    </p>

    <!-- Tags -->
    {#if post.tags && post.tags.length > 0}
      <div class="flex flex-wrap gap-1.5 mt-2 mb-2">
        {#each post.tags as tag}
          <a
            href="/tag/{generateTagSlug(tag)}"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
              bg-ink-100 text-ink-500 border border-ink-200
              dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/30
              hover:dark:bg-violet-900/40 transition-colors"
            on:click|stopPropagation
          >
            #{tag}
          </a>
        {/each}
      </div>
    {/if}

    <!-- Read more -->
    <span class="inline-flex items-center gap-1.5 text-xs font-medium
      text-accent dark:text-violet-DEFAULT
      opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1
      transition-all duration-200">
      Read more
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </span>
  </a>
</article>
