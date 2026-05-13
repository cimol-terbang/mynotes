<script>
  export let data;
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← Lihat Blog
        </a>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <a href="/admin" class="font-semibold text-gray-900 dark:text-gray-100">
          Admin
        </a>
      </div>
      <form method="POST" action="/admin/logout">
        <button type="submit" class="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          Keluar
        </button>
      </form>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-8">
    <slot />
  </main>
</div>
