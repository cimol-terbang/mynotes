<script>
  import { enhance } from '$app/forms';
  export let form;
  export let onCommentAdded = () => {};

  let submitting = false;
  let contentValue = '';
  let nameValue = '';

  function handleEnhance() {
    submitting = true;
    return async ({ result, update }) => {
      submitting = false;
      if (result.type === 'success' && result.data?.comment) {
        onCommentAdded(result.data.comment);
        contentValue = '';
        nameValue = '';
      }
      await update({ reset: false });
    };
  }
</script>

<section aria-label="Leave a comment">
  <h3 class="font-serif text-base sm:text-lg font-semibold text-ink-900 dark:text-night-100 mb-4 sm:mb-5 flex items-center gap-2">
    <span class="text-accent dark:text-violet-DEFAULT text-sm" aria-hidden="true">✦</span>
    Leave a Comment
  </h3>

  {#if form?.error}
    <div class="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
      <p class="text-sm text-red-600 dark:text-red-400" role="alert">{form.error}</p>
    </div>
  {/if}

  <form method="POST" action="?/comment" use:enhance={handleEnhance} class="space-y-4">
    <div>
      <label for="authorName" class="block text-xs font-medium uppercase tracking-wide mb-1.5
        text-ink-500 dark:text-night-400">
        Name <span class="normal-case font-normal text-ink-400 dark:text-night-600">(optional)</span>
      </label>
      <input
        id="authorName"
        name="authorName"
        type="text"
        bind:value={nameValue}
        placeholder="Anonymous"
        class="w-full px-4 py-2.5 rounded-xl text-sm
          border border-ink-200 dark:border-violet-dark/30
          bg-white dark:bg-night-950/60
          text-ink-900 dark:text-night-100
          placeholder:text-ink-300 dark:placeholder:text-night-600
          focus:outline-none focus:ring-2 focus:ring-accent/30 dark:focus:ring-violet-DEFAULT/30
          focus:border-accent dark:focus:border-violet-DEFAULT/60
          transition-all"
      />
    </div>

    <div>
      <label for="content" class="block text-xs font-medium uppercase tracking-wide mb-1.5
        text-ink-500 dark:text-night-400">
        Comment <span class="text-accent dark:text-violet-DEFAULT">*</span>
      </label>
      <textarea
        id="content"
        name="content"
        bind:value={contentValue}
        required
        rows="4"
        placeholder="Share your thoughts..."
        class="w-full px-4 py-2.5 rounded-xl text-sm
          border border-ink-200 dark:border-violet-dark/30
          bg-white dark:bg-night-950/60
          text-ink-900 dark:text-night-100
          placeholder:text-ink-300 dark:placeholder:text-night-600
          focus:outline-none focus:ring-2 focus:ring-accent/30 dark:focus:ring-violet-DEFAULT/30
          focus:border-accent dark:focus:border-violet-DEFAULT/60
          transition-all resize-y"
      ></textarea>
    </div>

    <button
      type="submit"
      disabled={submitting}
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
        bg-ink-900 text-ink-50 hover:bg-ink-700
        dark:bg-violet-glow dark:text-white dark:hover:bg-violet-dark
        dark:shadow-[0_0_20px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_0_28px_rgba(139,92,246,0.45)]
        transition-all disabled:opacity-50">
      {#if submitting}
        <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Sending...
      {:else}
        Post Comment
      {/if}
    </button>
  </form>
</section>
