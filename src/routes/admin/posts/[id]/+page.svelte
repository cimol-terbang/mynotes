<script>
  import { enhance } from '$app/forms';
  import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
  import TagInput from '$lib/components/TagInput.svelte';
  import { CATEGORY_LABELS, CATEGORIES } from '$lib/constants.js';
  export let data;
  export let form;

  let submitting = false;
  let deleting = false;
  let showDeleteConfirm = false;
  let contentValue = form?.content ?? data.post.content;
  let currentTags = form?.tags ?? data.post.tags ?? [];
</script>

<svelte:head>
  <title>Edit: {data.post.title} — Admin</title>
</svelte:head>

<div class="flex items-center gap-3 mb-8">
  <a href="/admin" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">← Kembali</a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Tulisan</h1>
  {#if data.post.status === 'draft'}
    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>
  {:else}
    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Dipublikasikan</span>
  {/if}
</div>

{#if form?.error}
  <div class="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
    <p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
  </div>
{/if}

{#if form?.success}
  <div class="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
    <p class="text-sm text-green-600 dark:text-green-400">Draft berhasil disimpan.</p>
  </div>
{/if}

<form method="POST" use:enhance={() => {
  submitting = true;
  return async ({ update }) => { submitting = false; await update(); };
}}>
  <div class="space-y-6">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
      <input
        id="title"
        name="title"
        type="text"
        required
        value={form?.title ?? data.post.title}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div>
      <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
      <select
        id="category"
        name="category"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each CATEGORIES as cat}
          <option value={cat} selected={(form?.category ?? data.post.category) === cat}>{CATEGORY_LABELS[cat]}</option>
        {/each}
      </select>
    </div>

    <MarkdownEditor bind:value={contentValue} name="content" label="Konten" />

    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
      <TagInput bind:tags={currentTags} existingTags={data.existingTags} />
    </div>

    <div class="flex items-center justify-between">
      <div class="flex gap-3">
        {#if data.post.status === 'draft'}
          <!-- Draft: Simpan Draft + Publikasikan -->
          <button
            type="submit"
            formaction="?/saveDraft"
            disabled={submitting}
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Draft'}
          </button>
          <button
            type="submit"
            formaction="?/publish"
            disabled={submitting}
            class="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Publikasikan'}
          </button>
        {:else}
          <!-- Published: Perbarui + Jadikan Draft (form terpisah) -->
          <button
            type="submit"
            formaction="?/update"
            disabled={submitting}
            class="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Perbarui'}
          </button>
        {/if}
        <a href="/admin" class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Batal
        </a>
      </div>

      <button
        type="button"
        on:click={() => showDeleteConfirm = true}
        class="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
      >
        Hapus Tulisan
      </button>
    </div>
  </div>
</form>

<!-- Form terpisah untuk unpublish (tidak membutuhkan field konten) -->
{#if data.post.status === 'published'}
  <form method="POST" action="?/unpublish" use:enhance={() => {
    submitting = true;
    return async ({ update }) => { submitting = false; await update(); };
  }} class="mt-3">
    <button
      type="submit"
      disabled={submitting}
      class="px-6 py-2 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-400 font-medium rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50"
    >
      {submitting ? 'Memproses...' : 'Jadikan Draft'}
    </button>
  </form>
{/if}

{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
      <h2 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Hapus Tulisan?</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Tindakan ini tidak dapat dibatalkan. Semua komentar pada tulisan ini juga akan dihapus.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          on:click={() => showDeleteConfirm = false}
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
        >
          Batal
        </button>
        <form method="POST" action="?/delete" use:enhance={() => {
          deleting = true;
          return async ({ update }) => { deleting = false; await update(); };
        }}>
          <button
            type="submit"
            disabled={deleting}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
          >
            {deleting ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
