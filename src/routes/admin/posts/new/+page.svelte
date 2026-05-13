<script>
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
  import TagInput from '$lib/components/TagInput.svelte';
  import { CATEGORY_LABELS, CATEGORIES } from '$lib/constants.js';
  export let form;

  let submitting = false;
  let contentValue = form?.content ?? '';
  let tags = form?.tags ?? [];
  let existingTags = [];

  onMount(async () => {
    try {
      const res = await fetch('/api/tags');
      existingTags = await res.json();
    } catch {
      existingTags = [];
    }
  });
</script>

<svelte:head>
  <title>Tulisan Baru — Admin</title>
</svelte:head>

<div class="flex items-center gap-3 mb-8">
  <a href="/admin" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">← Kembali</a>
  <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Tulisan Baru</h1>
</div>

{#if form?.error}
  <div class="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
    <p class="text-sm text-red-600 dark:text-red-400">{form.error}</p>
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
        value={form?.title ?? ''}
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
        <option value="">Pilih kategori...</option>
        {#each CATEGORIES as cat}
          <option value={cat} selected={form?.category === cat}>{CATEGORY_LABELS[cat]}</option>
        {/each}
      </select>
    </div>

    <MarkdownEditor bind:value={contentValue} name="content" label="Konten" />

    <TagInput bind:tags {existingTags} />

    <div class="flex gap-3">
      <button
        type="submit"
        formaction="?/saveDraft"
        disabled={submitting}
        class="px-6 py-2 border border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Menyimpan...' : 'Simpan Draft'}
      </button>
      <button
        type="submit"
        formaction="?/publish"
        disabled={submitting}
        class="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {submitting ? 'Menyimpan...' : 'Publikasikan'}
      </button>
      <a href="/admin" class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        Batal
      </a>
    </div>
  </div>
</form>
