<script>
  export let comments = [];

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<section aria-label="Comments">
  <h2 class="font-serif text-base sm:text-lg font-semibold text-ink-900 dark:text-night-100 mb-5 sm:mb-6 flex items-center gap-2">
    <span class="text-accent dark:text-violet-DEFAULT text-sm" aria-hidden="true">◈</span>
    {comments.length === 0 ? 'No comments yet' : `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
  </h2>

  {#if comments.length === 0}
    <p class="text-ink-400 dark:text-night-500 text-sm italic pl-5">Be the first to leave a thought.</p>
  {:else}
    <ul class="space-y-5 sm:space-y-6">
      {#each comments as comment (comment._id)}
        <li class="relative pl-4 border-l-2 border-ink-100 dark:border-violet-dark/30
          hover:border-accent dark:hover:border-violet-DEFAULT/50 transition-colors">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="text-sm font-medium text-ink-800 dark:text-night-200">{comment.authorName}</span>
            <span class="text-ink-200 dark:text-night-700" aria-hidden="true">·</span>
            <time class="text-xs text-ink-400 dark:text-night-500" datetime={comment.createdAt}>
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p class="text-ink-600 dark:text-night-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        </li>
      {/each}
    </ul>
  {/if}
</section>
