<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryItem from '../components/CategoryItem.svelte';
  import * as api from '../lib/api';
  import * as telegram from '../lib/telegram';
  import type { Category, Location } from '../lib/types';

  let categories: Category[] = [];
  let locations: Location[] = [];
  let subscriptions: Array<{ categoryId: string; locationIds: string[] }> = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    telegram.initTelegram();

    try {
      // Load data in parallel
      const [categoriesData, locationsData, subscriptionsData] = await Promise.all([
        api.getCategories(),
        api.getLocations(),
        api.getSubscriptions()
      ]);

      categories = categoriesData;
      locations = locationsData;

      // Transform subscriptions to the format needed by UI
      subscriptions = subscriptionsData.map(sub => ({
        categoryId: sub.categoryId,
        locationIds: sub.locations.map(loc => loc.id)
      }));

      loading = false;

      // Setup Main Button
      telegram.showMainButton('💾 Save', handleSave);
    } catch (err) {
      loading = false;
      error = err instanceof Error ? err.message : 'Failed to load data';
      telegram.showAlert(error);
    }
  });

  async function handleSave() {
    telegram.showMainButtonProgress();

    try {
      await api.saveSubscriptions(subscriptions);
      telegram.showAlert('Subscriptions saved!', () => {
        telegram.closeApp();
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save subscriptions';
      telegram.showAlert(errorMsg);
    } finally {
      telegram.hideMainButtonProgress();
    }
  }
</script>

<main>
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>❌ {error}</p>
      <button on:click={() => location.reload()}>Retry</button>
    </div>
  {:else}
    <div class="settings">
      <h1>📋 Manage Subscriptions</h1>
      <p class="description">
        Choose the categories you're interested in and optionally select specific locations.
        If no locations are selected for a category, you'll receive all jobs from that category.
      </p>

      <div class="categories-list">
        {#each categories as category}
          <CategoryItem
            {category}
            {locations}
            bind:subscriptions
          />
        {/each}
      </div>

      {#if subscriptions.length === 0}
        <div class="empty-state">
          <p>👆 Select at least one category to start receiving notifications</p>
        </div>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    padding: 16px;
    padding-bottom: 80px; /* Space for Main Button */
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
    margin-bottom: 16px;
    color: var(--tg-theme-destructive-text-color, #ff3b30);
  }

  .error button {
    padding: 10px 20px;
    background: var(--tg-theme-button-color, #0088cc);
    color: var(--tg-theme-button-text-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }

  h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .description {
    font-size: 14px;
    color: var(--tg-theme-hint-color, #999);
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    margin-top: 20px;
    padding: 20px;
    text-align: center;
    color: var(--tg-theme-hint-color, #999);
    font-size: 14px;
    background: var(--tg-theme-secondary-bg-color, #f0f0f0);
    border-radius: 8px;
  }
</style>


