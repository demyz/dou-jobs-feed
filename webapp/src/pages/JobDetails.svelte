<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '../lib/api';
  import * as telegram from '../lib/telegram';
  import type { Job } from '../lib/types';

  let jobId = '';
  let job: Job | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    telegram.initTelegram();

    // Show back button
    telegram.showBackButton(() => {
      telegram.closeApp();
    });

    // Get jobId from hash (#/job/123)
    const hash = window.location.hash;
    const match = hash.match(/#\/job\/(.+)/);

    if (!match) {
      error = 'Invalid job URL';
      loading = false;
      return;
    }

    jobId = match[1];

    try {
      job = await api.getJob(jobId);
      loading = false;

      // Show "Open on Dou" button
      telegram.showMainButton('🔗 Open on Dou', openJob);
    } catch (err) {
      loading = false;
      error = err instanceof Error ? err.message : 'Failed to load job';
      telegram.showAlert(error);
    }
  });

  function openJob() {
    if (job) {
      telegram.openLink(job.url);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
</script>

<main>
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading job details...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ {error}</p>
    </div>
  {:else if job}
    <article class="job-details">
      <h1>{job.title}</h1>

      <div class="meta">
        <div class="meta-item">
          <span class="label">🏢 Company:</span>
          <span class="value">{job.company.name}</span>
        </div>

        <div class="meta-item">
          <span class="label">📂 Category:</span>
          <span class="value">{job.category.name}</span>
        </div>

        <div class="meta-item">
          <span class="label">📍 Locations:</span>
          <span class="value">
            {job.locations.map(l => l.name).join(', ') || 'Not specified'}
          </span>
        </div>

        <div class="meta-item">
          <span class="label">📅 Published:</span>
          <span class="value">{formatDate(job.publishedAt)}</span>
        </div>
      </div>

      {#if job.fullDescription}
        <div class="description">
          {@html job.fullDescription}
        </div>
      {:else}
        <div class="description">
          {@html job.description}
        </div>
      {/if}
    </article>
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    padding: 16px;
    background: var(--tg-theme-bg-color, #fff);
    color: var(--tg-theme-text-color, #000);
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--tg-theme-hint-color, #ccc);
    border-top-color: var(--tg-theme-button-color, #0088cc);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error p {
    color: var(--tg-theme-destructive-text-color, #ff3b30);
  }

  h1 {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 16px;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    padding: 12px;
    background: var(--tg-theme-secondary-bg-color, #f0f0f0);
    border-radius: 8px;
  }

  .meta-item {
    display: flex;
    gap: 8px;
    font-size: 14px;
  }

  .meta-item .label {
    font-weight: 500;
    min-width: 100px;
  }

  .meta-item .value {
    color: var(--tg-theme-hint-color, #666);
  }

  .description {
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 20px;
  }

  .description :global(p) {
    margin-bottom: 12px;
  }

  .description :global(ul),
  .description :global(ol) {
    margin-bottom: 12px;
    padding-left: 20px;
  }

  .description :global(li) {
    margin-bottom: 6px;
  }

  .description :global(strong) {
    font-weight: 600;
  }

  .description :global(a) {
    color: var(--tg-theme-link-color, #0088cc);
    text-decoration: none;
  }
</style>


