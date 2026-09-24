import type { Tour } from '../../types';

export const mangaloreTours: Tour[] = [
  {
    id: 'mangalore-heritage-walk',
    cityId: 'mangalore',
    name: 'Mangalore Heritage Walk',
    description:
      'A curated walk through Mangalore\'s most significant historical and religious landmarks. ' +
      'From a thousand-year-old temple on Kadri Hill to a Jesuit chapel painted by an Italian master, ' +
      'this route reveals the layered history of one of India\'s oldest port cities.',
    category: 'history',
    estimatedDurationMinutes: 180,
    stops: [
      {
        id: 'stop-kadri-temple',
        attractionId: 'kadri-manjunatha-temple',
        order: 1,
        triggerRadiusMeters: 50,
        storyId: 'story-kadri-manjunatha-temple',
      },
      {
        id: 'stop-st-aloysius',
        attractionId: 'st-aloysius-chapel',
        order: 2,
        triggerRadiusMeters: 50,
        storyId: 'story-st-aloysius-chapel',
      },
      {
        id: 'stop-mangaladevi',
        attractionId: 'mangaladevi-temple',
        order: 3,
        triggerRadiusMeters: 50,
        storyId: 'story-mangaladevi-temple',
      },
      {
        id: 'stop-sultan-battery',
        attractionId: 'sultan-battery',
        order: 4,
        triggerRadiusMeters: 60,
        storyId: 'story-sultan-battery',
      },
    ],
  },
];
