<script>
  import { CATEGORY_LABELS, CATEGORY_ICONS } from '$lib/constants.js';
  import { generateTagSlug } from '$lib/tags.js';
  import PostContent from '$lib/components/PostContent.svelte';
  import CommentList from '$lib/components/CommentList.svelte';
  import CommentForm from '$lib/components/CommentForm.svelte';

  export let data;
  export let form;

  let comments = data.comments;

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function handleCommentAdded(newComment) {
    comments = [...comments, newComment];
  }
</script>

<svelte:head>
  <title>{data.post.title} — My Notes</title>
</svelte:head>

<!-- Back link -->
<div class="mb-8 sm:mb-10">
  <a href="/"
    class="inline-flex items-center gap-1.5 text-xs font-medium
      text-ink-400 dark:text-night-500
      hover:text-ink-700 dark:hover:text-violet-light
      transition-colors group">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">
      <path d="M10 4L6 8l4 4"/>
    </svg>
    All writing
  </a>
</div>

<article>
  <header class="mb-8 sm:mb-10">
    <!-- Category badge + date -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <a href="/?category={data.post.category}"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
          bg-ink-100 text-ink-600 border-ink-200
          dark:bg-violet-dark/20 dark:text-violet-light dark:border-violet-dark/30
          hover:opacity-80 transition-opacity">
        <span aria-hidden="true">{CATEGORY_ICONS[data.post.category]}</span>
        {CATEGORY_LABELS[data.post.category]}
      </a>
      <span class="text-ink-200 dark:text-night-700" aria-hidden="true">·</span>
      <time class="text-xs text-ink-400 dark:text-night-500" datetime={data.post.createdAt}>
        {formatDate(data.post.createdAt)}
      </time>
    </div>

    <!-- Title -->
    <h1 class="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight
      text-ink-900 dark:text-night-50 dark:text-glow text-balance mb-6">
      {data.post.title}
    </h1>

    <!-- Decorative divider -->
    <div class="flex items-center gap-3">
      <div class="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 dark:via-violet-dark/30 to-transparent"></div>
      <span class="text-accent dark:text-violet-DEFAULT text-xs tracking-widest" aria-hidden="true">✦</span>
      <div class="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 dark:via-violet-dark/30 to-transparent"></div>
    </div>

    <!-- Tags -->
    {#if data.post.tags && data.post.tags.length > 0}
      <div class="flex flex-wrap gap-2 mt-4">
        {#each data.post.tags as tag}
          <a
            href="/tag/{generateTagSlug(tag)}"
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              bg-ink-100 text-ink-500 border border-ink-200
              dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/30
              hover:opacity-80 transition-opacity"
          >
            #{tag}
          </a>
        {/each}
      </div>
    {/if}
  </header>

  <PostContent content={data.post.content} />

  <!-- End mark -->
  <div class="flex justify-center mt-10 sm:mt-12 mb-4">
    <span class="text-ink-300 dark:text-violet-dark/60 text-sm tracking-[0.4em]" aria-hidden="true">· · ·</span>
  </div>
</article>

<!-- Comments -->
<div class="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-ink-200/60 dark:border-violet-dark/20 space-y-10 sm:space-y-12">
  <CommentList {comments} />
  <CommentForm {form} onCommentAdded={handleCommentAdded} />
</div>
