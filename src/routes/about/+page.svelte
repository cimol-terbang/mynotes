<svelte:head>
  <title>About — My Notes</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-ink-200/60 dark:border-violet-dark/20">
    <p class="text-xs font-medium tracking-[0.2em] uppercase text-accent dark:text-violet-DEFAULT mb-3">About</p>
    <h1 class="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold
      text-ink-900 dark:text-night-50 dark:text-glow leading-tight mb-4">
      A place to think out loud.
    </h1>
    <p class="text-ink-500 dark:text-night-400 text-base leading-relaxed max-w-lg">
      My Notes is a personal writing space — somewhere to put thoughts that are too long for a tweet
      and too unfinished for anywhere else.
    </p>
  </div>

  <!-- Content -->
  <div class="space-y-5 text-ink-700 dark:text-night-300 leading-relaxed text-sm sm:text-base">
    <p>
      This site is written and maintained by <strong class="text-ink-900 dark:text-night-100 font-semibold">Haotian</strong>.
      The writing here spans three loose categories: essays on things I'm thinking about,
      poetry for things I'm feeling, and short fiction for things I'm imagining.
    </p>
    <p>
      I believe writing is one of the few ways to actually understand what you think.
      Most thoughts dissolve before they're examined. Writing forces them to hold still long enough to be looked at.
    </p>
    <p>
      If something here resonates, leave a comment. If something here is wrong, leave a comment.
      Either way, I'd like to know.
    </p>
  </div>

  <!-- Divider -->
  <div class="flex items-center gap-3 my-10 sm:my-12">
    <div class="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 dark:via-violet-dark/30 to-transparent"></div>
    <span class="text-accent/50 dark:text-violet-DEFAULT/50 text-xs tracking-widest" aria-hidden="true">✦</span>
    <div class="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200 dark:via-violet-dark/30 to-transparent"></div>
  </div>

  <!-- Links -->
  <div>
    <p class="text-xs font-medium tracking-[0.2em] uppercase text-ink-400 dark:text-night-600 mb-4 sm:mb-5">
      Find me elsewhere
    </p>
    <div class="flex flex-col gap-3 sm:gap-4">
      <a href="https://haotian.my.id" target="_blank" rel="noopener noreferrer"
        class="group flex items-center gap-3 p-3 sm:p-4 rounded-xl border
          border-ink-100 dark:border-violet-dark/20
          hover:border-ink-300 dark:hover:border-violet-DEFAULT/40
          hover:bg-ink-50 dark:hover:bg-violet-dark/10
          transition-all">
        <span class="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 dark:bg-violet-dark/30 flex items-center justify-center text-accent dark:text-violet-light text-sm" aria-hidden="true">
          🌐
        </span>
        <div>
          <p class="text-sm font-medium text-ink-800 dark:text-night-200 group-hover:text-accent dark:group-hover:text-violet-light transition-colors">
            haotian.my.id
          </p>
          <p class="text-xs text-ink-400 dark:text-night-600">Personal website</p>
        </div>
        <svg class="ml-auto w-4 h-4 text-ink-300 dark:text-night-700 group-hover:text-accent dark:group-hover:text-violet-DEFAULT transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>

      <a href="https://note.haotian.my.id" target="_blank" rel="noopener noreferrer"
        class="group flex items-center gap-3 p-3 sm:p-4 rounded-xl border
          border-ink-100 dark:border-violet-dark/20
          hover:border-ink-300 dark:hover:border-violet-DEFAULT/40
          hover:bg-ink-50 dark:hover:bg-violet-dark/10
          transition-all">
        <span class="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 dark:bg-violet-dark/30 flex items-center justify-center text-accent dark:text-violet-light text-sm" aria-hidden="true">
          📝
        </span>
        <div>
          <p class="text-sm font-medium text-ink-800 dark:text-night-200 group-hover:text-accent dark:group-hover:text-violet-light transition-colors">
            note.haotian.my.id
          </p>
          <p class="text-xs text-ink-400 dark:text-night-600">You are here</p>
        </div>
        <svg class="ml-auto w-4 h-4 text-ink-300 dark:text-night-700 group-hover:text-accent dark:group-hover:text-violet-DEFAULT transition-colors" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </div>
</div>
