<script>
  export let onInsert = (shortcode) => {};
  export let onCancel = () => {};

  let url = '';
  let alt = '';
  let caption = '';
  let size = 'default';
  let urlError = '';

  const sizeOptions = [
    { value: 'default', label: 'Default' },
    { value: 'small',   label: 'Small (25%)' },
    { value: 'medium',  label: 'Medium (50%)' },
    { value: 'large',   label: 'Large (75%)' },
    { value: 'full',    label: 'Full (100%)' },
  ];

  function buildShortcode(url, alt, caption, size) {
    let sc = `{{image:${url}`;
    if (alt)                        sc += `|alt=${alt}`;
    if (caption)                    sc += `|caption=${caption}`;
    if (size && size !== 'default') sc += `|size=${size}`;
    sc += '}}';
    return sc;
  }

  function handleSubmit() {
    if (!url.trim()) {
      urlError = 'URL gambar tidak boleh kosong';
      return;
    }
    urlError = '';
    const shortcode = buildShortcode(url.trim(), alt.trim(), caption.trim(), size);
    onInsert(shortcode);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onCancel();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  role="dialog"
  aria-label="Sisipkan Gambar"
  class="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
  on:keydown={handleKeydown}
>
  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sisipkan Gambar</h3>

  <div class="space-y-3">
    <!-- URL Field (required) -->
    <div>
      <label for="image-url" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        URL Gambar <span class="text-red-500" aria-hidden="true">*</span>
      </label>
      <input
        id="image-url"
        type="url"
        bind:value={url}
        placeholder="https://example.com/image.jpg"
        aria-required="true"
        aria-describedby={urlError ? 'url-error' : undefined}
        class="w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500
          {urlError
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600'}"
      />
      {#if urlError}
        <p id="url-error" class="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">{urlError}</p>
      {/if}
    </div>

    <!-- Alt Text Field (optional) -->
    <div>
      <label for="image-alt" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Alt Text <span class="text-gray-400 dark:text-gray-600 font-normal">(opsional)</span>
      </label>
      <input
        id="image-alt"
        type="text"
        bind:value={alt}
        placeholder="Deskripsi gambar untuk aksesibilitas"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Caption Field (optional) -->
    <div>
      <label for="image-caption" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Caption <span class="text-gray-400 dark:text-gray-600 font-normal">(opsional)</span>
      </label>
      <input
        id="image-caption"
        type="text"
        bind:value={caption}
        placeholder="Keterangan gambar"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Size Dropdown -->
    <div>
      <label for="image-size" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Ukuran
      </label>
      <select
        id="image-size"
        bind:value={size}
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {#each sizeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-end gap-2 mt-4">
    <button
      type="button"
      on:click={onCancel}
      class="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors"
    >
      Batal
    </button>
    <button
      type="button"
      on:click={handleSubmit}
      class="px-3 py-1.5 text-sm rounded-md
        bg-blue-600 text-white hover:bg-blue-700
        dark:bg-blue-500 dark:hover:bg-blue-600
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors"
    >
      Sisipkan
    </button>
  </div>
</div>
