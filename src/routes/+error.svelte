<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} — My Notes</title>
</svelte:head>

<div class="text-center py-20">
  <p class="font-serif text-7xl font-semibold text-ink-200 dark:text-ink-800 mb-4">{$page.status}</p>
  <h1 class="font-serif text-2xl font-semibold mb-2 text-ink-900 dark:text-ink-100">
    {#if $page.status === 404}
      Page not found.
    {:else}
      Something went wrong.
    {/if}
  </h1>
  <p class="text-ink-400 dark:text-ink-600 text-sm mb-8">{$page.error?.message ?? ''}</p>
  <a href="/" class="text-accent hover:underline text-sm">← Back to home</a>
</div>
