<script>
  import CategoryNav from '$lib/components/CategoryNav.svelte';
  import PostCard from '$lib/components/PostCard.svelte';
  export let data;
</script>

<svelte:head>
  <title>My Notes — A Personal Writing Space</title>
</svelte:head>


<CategoryNav activeCategory={data.activeCategory} />

{#if data.error}
  <div class="py-12 sm:py-16 text-center">
    <div class="inline-flex flex-col items-center gap-3">
      <span class="text-3xl" aria-hidden="true">🌙</span>
      <p class="text-ink-400 dark:text-night-500 text-sm">{data.error}</p>
    </div>
  </div>
{:else if data.posts.length === 0}
  <div class="py-12 sm:py-16 text-center">
    <div class="inline-flex flex-col items-center gap-3">
      <span class="text-3xl" aria-hidden="true">✍️</span>
      <p class="text-ink-400 dark:text-night-500 text-sm italic">Nothing here yet.</p>
    </div>
  </div>
{:else}
  <div class="divide-y divide-ink-100 dark:divide-violet-dark/15">
    {#each data.posts as post (post._id)}
      <PostCard {post} />
    {/each}
  </div>
{/if}
