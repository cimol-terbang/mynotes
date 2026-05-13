<script>
  import { tick } from 'svelte';
  import { renderMarkdown } from '$lib/utils/markdown.js';
  import ImageInsertForm from '$lib/components/ImageInsertForm.svelte';

  export let value = '';
  export let name = 'content';
  export let label = 'Konten';

  // 5.1 Referensi DOM ke elemen textarea
  let textareaEl;

  // 5.4 Kontrol visibilitas ImageInsertForm
  let showInsertForm = false;

  // 5.5 State untuk upload
  let uploading = false;
  let uploadError = '';

  $: preview = renderMarkdown(value);

  // 5.2 Sisipkan teks di posisi kursor saat ini
  async function insertAtCursor(text) {
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    value = value.slice(0, start) + text + value.slice(end);
    // Kembalikan posisi kursor setelah tick agar DOM diperbarui terlebih dahulu
    await tick();
    const newPos = start + text.length;
    textareaEl.selectionStart = newPos;
    textareaEl.selectionEnd = newPos;
    textareaEl.focus();
  }

  // 5.4 Handler saat shortcode berhasil disisipkan dari ImageInsertForm
  function handleInsert(shortcode) {
    insertAtCursor(shortcode);
    showInsertForm = false;
  }

  // 5.4 Handler saat form dibatalkan
  function handleCancel() {
    showInsertForm = false;
    textareaEl.focus();
  }

  // 7.1 Referensi DOM ke elemen file input tersembunyi
  let fileInputEl;

  // 7.1 Handler klik tombol "Unggah Gambar" — memicu klik pada file input tersembunyi
  function handleUploadButtonClick() {
    fileInputEl.click();
  }

  // 7.2 & 7.3 & 7.4 & 7.5 & 7.6 Handler saat file dipilih
  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 7.2 Bersihkan error sebelum validasi
    uploadError = '';

    // 7.2 Validasi tipe MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      uploadError = 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP';
      fileInputEl.value = '';
      return;
    }

    // 7.2 Validasi ukuran file (maks 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      uploadError = 'Ukuran file maksimal adalah 5MB';
      fileInputEl.value = '';
      return;
    }

    // 7.4 Tampilkan loading dan nonaktifkan tombol
    uploading = true;

    try {
      // 7.3 Kirim file ke endpoint upload menggunakan fetch + FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // 7.6 Tampilkan pesan error dari server
        uploadError = data.error || 'Gagal mengunggah gambar';
      } else {
        // 7.5 Sisipkan shortcode ke posisi kursor
        await insertAtCursor(`{{image:${data.url}}}`);
        // Reset file input agar file yang sama bisa diunggah ulang
        fileInputEl.value = '';
      }
    } catch (err) {
      // 7.6 Tangani error jaringan
      uploadError = 'Gagal mengunggah gambar. Periksa koneksi internet Anda.';
    } finally {
      // 7.4 & 7.6 Aktifkan kembali tombol setelah upload selesai
      uploading = false;
    }
  }
</script>

<div>
  <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>

  <!-- 5.3 Toolbar di atas textarea -->
  <div class="flex items-center gap-2 mb-2">
    <button
      type="button"
      on:click={() => { showInsertForm = !showInsertForm; }}
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors"
      aria-pressed={showInsertForm}
    >
      <!-- Image icon -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Sisipkan Gambar
    </button>

    <!-- 7.1 File input tersembunyi — hanya menerima tipe gambar yang diizinkan -->
    <input
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      bind:this={fileInputEl}
      on:change={handleFileChange}
      class="hidden"
      aria-hidden="true"
    />

    <button
      type="button"
      disabled={uploading}
      on:click={handleUploadButtonClick}
      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors"
      aria-label="Unggah Gambar"
    >
      {#if uploading}
        <!-- Loading spinner -->
        <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Mengunggah...
      {:else}
        <!-- Upload icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Unggah Gambar
      {/if}
    </button>
  </div>

  <!-- 5.5 Tampilkan pesan error upload jika ada -->
  {#if uploadError}
    <p class="mb-2 text-sm text-red-500 dark:text-red-400" role="alert">{uploadError}</p>
  {/if}

  <!-- 5.4 Form inline ImageInsertForm -->
  {#if showInsertForm}
    <div class="mb-3">
      <ImageInsertForm
        onInsert={handleInsert}
        onCancel={handleCancel}
      />
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Markdown</p>
      <!-- 5.1 bind:this untuk mendapatkan referensi DOM textarea -->
      <textarea
        {name}
        bind:value
        bind:this={textareaEl}
        rows="20"
        required
        placeholder="Tulis konten dalam format Markdown..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      ></textarea>
    </div>
    <div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Pratinjau</p>
      <!-- 5.6 Pratinjau real-time tetap berfungsi karena renderMarkdown sudah diperbarui -->
      <div class="prose prose-sm prose-gray dark:prose-invert max-w-none min-h-[20rem] p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 overflow-auto">
        {#if preview}
          {@html preview}
        {:else}
          <p class="text-gray-400 dark:text-gray-600 italic">Pratinjau akan muncul di sini...</p>
        {/if}
      </div>
    </div>
  </div>
</div>
