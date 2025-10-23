<script lang="ts">
  import { onMount } from 'svelte';
  import Settings from './pages/Settings.svelte';
  import JobDetails from './pages/JobDetails.svelte';

  let currentPage: 'settings' | 'job' = 'settings';

  onMount(() => {
    // Simple hash-based router
    function handleHashChange() {
      const hash = window.location.hash;

      // FIXME
      if (hash.startsWith('#/job/')) {
        currentPage = 'job';
      } else {
        currentPage = 'settings';
      }
    }

    // Handle initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  });
</script>

<div class="app">
  {#if currentPage === 'settings'}
    <Settings />
  {:else if currentPage === 'job'}
    <JobDetails />
  {/if}
</div>

<style>
  .app {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  :global(*) {
    box-sizing: border-box;
  }
</style>


