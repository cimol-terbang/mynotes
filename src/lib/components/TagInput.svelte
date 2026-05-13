<script>
  export let tags = [];
  export let existingTags = [];
  export let name = 'tags';

  let inputValue = '';
  let showDropdown = false;

  // Filter existingTags based on current input (case-insensitive), exclude already-added tags
  $: suggestions = inputValue.trim().length > 0
    ? existingTags.filter(
        t =>
          t.toLowerCase().includes(inputValue.trim().toLowerCase()) &&
          !tags.includes(t)
      )
    : [];

  $: showDropdown = suggestions.length > 0;

  function normalizeTag(raw) {
    return raw.trim().toLowerCase();
  }

  function addTag(raw) {
    const normalized = normalizeTag(raw);
    if (normalized && !tags.includes(normalized)) {
      tags = [...tags, normalized];
    }
    inputValue = '';
  }

  function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (event.key === ',') {
      event.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (event.key === 'Escape') {
      showDropdown = false;
      inputValue = '';
    }
  }

  function handleSuggestionClick(tag) {
    addTag(tag);
  }

  function handleBlur() {
    // Delay hiding dropdown to allow click events on suggestions to fire first
    setTimeout(() => {
      showDropdown = false;
    }, 150);
  }
</script>

<div class="flex flex-col gap-2">
  <!-- Hidden inputs for form submission -->
  {#each tags as tag}
    <input type="hidden" {name} value={tag} />
  {/each}

  <!-- Tag pills -->
  {#if tags.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each tags as tag}
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
          bg-violet-900/30 text-violet-300 border border-violet-700/40
          dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/40">
          #{tag}
          <button
            type="button"
            on:click={() => removeTag(tag)}
            class="ml-0.5 text-violet-400 hover:text-violet-100 transition-colors leading-none"
            aria-label="Remove tag {tag}"
          >
            ×
          </button>
        </span>
      {/each}
    </div>
  {/if}

  <!-- Input + dropdown wrapper -->
  <div class="relative">
    <input
      type="text"
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={handleBlur}
      placeholder="Add a tag… (Enter or comma to confirm)"
      class="w-full px-3 py-2 rounded-lg text-sm
        bg-night-900 text-night-100 border border-night-700
        placeholder:text-night-600
        focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500
        dark:bg-night-900 dark:text-night-100 dark:border-night-700
        dark:placeholder:text-night-600
        dark:focus:ring-violet-500 dark:focus:border-violet-500
        transition-colors"
    />

    <!-- Autocomplete dropdown -->
    {#if showDropdown}
      <ul
        class="absolute z-10 mt-1 w-full rounded-lg border border-night-700
          bg-night-900 dark:bg-night-900 dark:border-night-700
          shadow-lg overflow-hidden"
        role="listbox"
      >
        {#each suggestions as suggestion}
          <li role="option" aria-selected="false">
            <button
              type="button"
              on:mousedown|preventDefault={() => handleSuggestionClick(suggestion)}
              class="w-full text-left px-3 py-2 text-sm
                text-night-200 dark:text-night-200
                hover:bg-violet-900/40 hover:text-violet-200
                dark:hover:bg-violet-900/40 dark:hover:text-violet-200
                transition-colors"
            >
              #{suggestion}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
