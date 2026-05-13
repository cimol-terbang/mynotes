<script>
  import CategoryNav from '$lib/components/CategoryNav.svelte';
  import PostCard from '$lib/components/PostCard.svelte';
  export let data;
</script>

<svelte:head>
  <title>My Notes — A Personal Writing Space</title>
</svelte:head>

<!-- Hero -->
{#if !data.activeCategory}
  <div class="mb-8 pb-8 border-b border-ink-200/60 dark:border-violet-dark/20">

    {#if data.quote}
      <div class="flex items-start gap-3 max-w-2xl">
        <span aria-hidden="true"
          class="text-4xl text-accent/20 dark:text-violet-DEFAULT/25 font-serif leading-none select-none shrink-0 mt-1">
          "
        </span>
        <blockquote>
          <p class="font-serif text-base sm:text-lg font-medium leading-relaxed text-ink-700 dark:text-night-200 text-balance mb-2">
            {data.quote.text}
          </p>
          <footer class="flex items-center gap-2 text-xs text-ink-400 dark:text-night-500">
            <span class="text-accent dark:text-violet-DEFAULT" aria-hidden="true">◈</span>
            <cite class="not-italic">— {data.quote.author}</cite>
          </footer>
        </blockquote>
      </div>
    {/if}

    <!-- Decorative bottom ornament -->
    <div aria-hidden="true" class="flex items-center gap-3 mt-6">
      <div class="h-px w-24 bg-gradient-to-r from-ink-200 dark:from-violet-dark/30 to-transparent"></div>
      <span class="text-accent/40 dark:text-violet-DEFAULT/40 text-[10px] tracking-widest">✦ ✦ ✦</span>
    </div>
  </div>
{/if}

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
