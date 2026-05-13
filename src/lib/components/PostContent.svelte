<script>
  import { renderMarkdown } from '$lib/utils/markdown.js';
  export let content;
  $: html = renderMarkdown(content);
</script>

<div class="prose prose-gray dark:prose-invert max-w-none">
  {@html html}
</div>
