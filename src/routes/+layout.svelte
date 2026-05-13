<script>
  import '../app.css';
  import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  export let data;
</script>

<div class="grain relative min-h-screen bg-ink-50 dark:dark-bg text-ink-900 dark:text-night-100 overflow-x-hidden">

  <!-- Purple ambient orbs (dark mode only) -->
  <div aria-hidden="true" class="pointer-events-none fixed inset-0 overflow-hidden z-0">
    <div class="orb w-[500px] h-[500px] bg-violet-dark top-[-100px] left-[-100px] dark:opacity-[0.12] opacity-0"></div>
    <div class="orb w-[400px] h-[400px] bg-violet-glow bottom-[-80px] right-[-80px] dark:opacity-[0.10] opacity-0"></div>
    <div class="orb w-[300px] h-[300px] bg-night-700 top-[40%] left-[60%] dark:opacity-[0.08] opacity-0"></div>
  </div>

  <!-- Header -->
  <header class="relative z-40 border-b border-ink-200/60 dark:border-violet-dark/20 bg-ink-50/80 dark:bg-night-950/70 backdrop-blur-md sticky top-0">
    <div class="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-3 sm:py-4 flex items-center justify-between gap-4">

      <!-- Logo -->
      <a href="/" class="group flex items-center gap-2 shrink-0">
        <!-- Crescent moon icon -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-accent dark:text-violet-DEFAULT" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" opacity="0.9"/>
        </svg>
        <span class="text-accent dark:text-violet-light font-serif text-lg sm:text-xl font-semibold tracking-tight group-hover:opacity-80 transition-opacity">
          My Notes
        </span>
      </a>

      <!-- Nav -->
      <nav class="flex items-center gap-2 sm:gap-3">
        <a href="/about"
          class="text-xs font-medium text-ink-500 dark:text-night-300 hover:text-ink-900 dark:hover:text-violet-light px-2 sm:px-3 py-1.5 rounded-full hover:bg-ink-100 dark:hover:bg-violet-dark/20 transition-all">
          About
        </a>
        {#if data?.isAdmin}
          <a href="/admin"
            class="text-xs font-medium text-ink-500 dark:text-night-300 hover:text-ink-900 dark:hover:text-violet-light px-2 sm:px-3 py-1.5 rounded-full border border-ink-200 dark:border-violet-dark/30 hover:border-ink-400 dark:hover:border-violet-DEFAULT/50 transition-all">
            Admin
          </a>
        {/if}
        <DarkModeToggle />
      </nav>
    </div>
  </header>

  <!-- Main content -->
  <main class="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-8 sm:py-10">
    <slot />
  </main>

  <!-- Footer -->
  <footer class="relative z-10 border-t border-ink-200/60 dark:border-violet-dark/20 mt-16 sm:mt-20">
    <div class="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-ink-400 dark:text-night-500">
        <div class="flex flex-wrap items-center gap-1">
          <span>Written by</span>
          <a href="https://haotian.my.id" target="_blank" rel="noopener noreferrer"
            class="text-accent dark:text-violet-DEFAULT hover:underline font-medium">Haotian</a>
          <span>·</span>
          <a href="https://note.haotian.my.id" target="_blank" rel="noopener noreferrer"
            class="hover:text-ink-600 dark:hover:text-night-300 transition-colors">note.haotian.my.id</a>
        </div>
        <div class="flex items-center gap-2">
          <!-- Decorative stars -->
          <span class="text-accent/40 dark:text-violet-DEFAULT/40 text-[10px] tracking-widest">✦ ✦ ✦</span>
        </div>
      </div>
    </div>
  </footer>

</div>
