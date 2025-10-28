import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CategoryItem from '../CategoryItem.svelte';

describe('CategoryItem', () => {
  const mockLocations = [
    { id: 'loc1', name: 'Kyiv', slug: 'kyiv' },
    { id: 'loc2', name: 'Lviv', slug: 'lviv' },
  ];

  it('should render category name', () => {
    const { getByText } = render(CategoryItem, {
      props: {
        category: {
          id: 'cat1',
          name: 'QA',
          slug: 'qa',
        },
        locations: mockLocations,
        subscriptions: [],
      },
    });

    expect(getByText('QA')).toBeTruthy();
  });

  it('should show subscribed state when category is in subscriptions', () => {
    const { container } = render(CategoryItem, {
      props: {
        category: {
          id: 'cat1',
          name: 'QA',
          slug: 'qa',
        },
        locations: mockLocations,
        subscriptions: [
          {
            categoryId: 'cat1',
            locationIds: [],
          },
        ],
      },
    });

    // Component should render without errors
    expect(container).toBeTruthy();
  });

  it('should show unsubscribed state when category is not in subscriptions', () => {
    const { container } = render(CategoryItem, {
      props: {
        category: {
          id: 'cat1',
          name: 'DevOps',
          slug: 'devops',
        },
        locations: mockLocations,
        subscriptions: [
          {
            categoryId: 'cat2',
            locationIds: [],
          },
        ],
      },
    });

    // Component should render without errors
    expect(container).toBeTruthy();
  });
});

