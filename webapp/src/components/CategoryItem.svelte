<script lang="ts">
  import type { Category, Location } from '../lib/types';

  export let category: Category;
  export let locations: Location[];
  export let subscriptions: Array<{ categoryId: string; locationIds: string[] }>;

  let expanded = false;

  $: subscription = subscriptions.find(s => s.categoryId === category.id);
  $: isSubscribed = !!subscription;
  $: selectedLocationIds = subscription?.locationIds || [];
  $: locationCount = selectedLocationIds.length;

  function toggleCategory() {
    if (isSubscribed) {
      // Unsubscribe
      subscriptions = subscriptions.filter(s => s.categoryId !== category.id);
      expanded = false;
    } else {
      // Subscribe (with all locations by default)
      subscriptions = [...subscriptions, {
        categoryId: category.id,
        locationIds: []
      }];
    }
  }

  function toggleExpand() {
    if (isSubscribed) {
      expanded = !expanded;
    }
  }

  function toggleLocation(locationId: string) {
    const sub = subscriptions.find(s => s.categoryId === category.id);
    if (!sub) return;

    if (sub.locationIds.includes(locationId)) {
      sub.locationIds = sub.locationIds.filter(id => id !== locationId);
    } else {
      sub.locationIds = [...sub.locationIds, locationId];
    }

    subscriptions = subscriptions; // trigger reactivity
  }
</script>

<div class="category-item">
  <label class="category-checkbox">
    <input
      type="checkbox"
      checked={isSubscribed}
      on:change={toggleCategory}
    />
    <span class="category-name">{category.name}</span>
  </label>

  {#if isSubscribed}
    <button class="locations-toggle" on:click={toggleExpand} type="button">
      <span class="icon">📍</span>
      <span class="text">
        Select locations ({locationCount > 0 ? locationCount : 'all'})
      </span>
      <span class="arrow">{expanded ? '▲' : '▼'}</span>
    </button>

    {#if expanded}
      <div class="locations-list">
        {#each locations as location}
          <label class="location-checkbox">
            <input
              type="checkbox"
              checked={selectedLocationIds.includes(location.id)}
              on:change={() => toggleLocation(location.id)}
            />
            <span>{location.name}</span>
          </label>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .category-item {
    margin-bottom: 12px;
    padding: 12px;
    background: var(--tg-theme-secondary-bg-color, #f0f0f0);
    border-radius: 8px;
  }

  .category-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
  }

  .category-checkbox input {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .category-name {
    flex: 1;
  }

  .locations-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    background: var(--tg-theme-bg-color, #fff);
    border: 1px solid var(--tg-theme-hint-color, #ccc);
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: var(--tg-theme-text-color, #000);
  }

  .locations-toggle:hover {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }

  .locations-toggle .icon {
    font-size: 16px;
  }

  .locations-toggle .text {
    flex: 1;
    text-align: left;
  }

  .locations-toggle .arrow {
    font-size: 12px;
    color: var(--tg-theme-hint-color, #999);
  }

  .locations-list {
    margin-top: 8px;
    padding: 8px;
    background: var(--tg-theme-bg-color, #fff);
    border-radius: 6px;
    max-height: 300px;
    overflow-y: auto;
  }

  .location-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .location-checkbox:hover {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    border-radius: 4px;
  }

  .location-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
</style>


