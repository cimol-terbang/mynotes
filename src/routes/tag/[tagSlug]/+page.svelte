<script>
  import PostCard from '$lib/components/PostCard.svelte';
  export let data;
</script>

<svelte:head>
  <title>#{data.displayName} — My Notes</title>
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

<header class="mb-8 sm:mb-10">
  <h1 class="font-serif text-2xl sm:text-3xl font-semibold text-ink-900 dark:text-night-50">
    #{data.displayName}
  </h1>
  <p class="text-sm text-ink-400 dark:text-night-500 mt-2">
    {data.posts.length} {data.posts.length === 1 ? 'tulisan' : 'tulisan'} dengan tag ini
  </p>
</header>

{#if data.posts.length === 0}
  <p class="text-ink-400 dark:text-night-500 text-sm">
    Tidak ada postingan ditemukan untuk tag ini.
  </p>
{:else}
  <div class="divide-y divide-ink-100 dark:divide-night-800">
    {#each data.posts as post (post._id)}
      <PostCard {post} />
    {/each}
  </div>
{/if}
