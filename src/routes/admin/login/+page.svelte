<script>
  import { enhance } from '$app/forms';
  export let form;
</script>

<svelte:head>
  <title>Admin Login</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
  <div class="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h1 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Login</h1>

    {#if form?.error}
      <p class="mb-4 text-sm text-red-600 dark:text-red-400">{form.error}</p>
    {/if}

    <form method="POST" use:enhance>
      <div class="mb-4">
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autocomplete="username"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-6">
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
      >
        Masuk
      </button>
    </form>
  </div>
</div>
