<script>
  import { page } from '$app/stores';
  import { CATEGORY_LABELS } from '$lib/constants.js';
  export let data;

  $: successMsg = $page.url.searchParams.get('success');

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Admin — Tulisanku</title>
</svelte:head>

<div class="flex items-center justify-between mb-8">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Semua Tulisan</h1>
  <a
    href="/admin/posts/new"
    class="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
  >
    + Tulisan Baru
  </a>
</div>

{#if successMsg}
  <div class="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
    <p class="text-sm text-green-700 dark:text-green-400">Postingan berhasil disimpan.</p>
  </div>
{/if}

{#if data.error}
  <p class="text-red-600 dark:text-red-400 text-sm mb-4">{data.error}</p>
{/if}

{#if data.posts.length === 0}
  <p class="text-gray-500 dark:text-gray-400 text-center py-12">Belum ada tulisan.</p>
{:else}
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <tr>
          <th class="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Judul</th>
          <th class="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">Kategori</th>
          <th class="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">Status</th>
          <th class="text-left px-4 py-3 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">Tanggal</th>
          <th class="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each data.posts as post (post._id)}
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
              <a href="/{post.slug}" target="_blank" class="hover:text-blue-600 dark:hover:text-blue-400">
                {post.title}
              </a>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
              {CATEGORY_LABELS[post.category]}
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              {#if post.status === 'draft'}
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>
              {:else}
                <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Dipublikasikan</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
              {formatDate(post.createdAt)}
            </td>
            <td class="px-4 py-3 text-right">
              <a
                href="/admin/posts/{post._id}"
                class="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Edit
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
