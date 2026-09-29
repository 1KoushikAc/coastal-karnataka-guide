import type { Attraction } from '../../types';

// -----------------------------------------------------------------------------
// IMPORTANT: Only include verified or clearly marked placeholder facts.
// Sources must be added to the sources[] array for later verification.
// Placeholder text is prefixed with [PLACEHOLDER].
// -----------------------------------------------------------------------------

export const mangaloreAttractions: Attraction[] = [
  {
    id: 'kadri-manjunatha-temple',
    cityId: 'mangalore',
    name: 'Kadri Manjunatha Temple',
    coordinates: { latitude: 12.8876, longitude: 74.8429 },
    categories: ['religious', 'history', 'architecture'],
    shortDescription:
      'One of the oldest temples in Mangalore, dedicated to Lord Manjunatha, with origins traced to the 10th century CE.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://en.wikipedia.org/wiki/Kadri_Manjunatha_Temple',
    ],
    image: {
      assetKey: 'placeholder-kadri-manjunatha-temple',
      altText: 'Kadri Manjunatha Temple heritage grounds and sacred hill tank',
      isPlaceholder: true,
    },
  },
  {
    id: 'st-aloysius-chapel',
    cityId: 'mangalore',
    name: 'St. Aloysius Chapel',
    coordinates: { latitude: 12.8656, longitude: 74.8426 },
    categories: ['history', 'architecture', 'culture'],
    shortDescription:
      'A Jesuit chapel built in 1880, renowned for its Italian-style frescoes painted by Brother Antonio Moscheni.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://en.wikipedia.org/wiki/St._Aloysius_Chapel,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-st-aloysius-chapel',
      altText: 'St. Aloysius Chapel interior Italian Renaissance frescoes and nave',
      isPlaceholder: true,
    },
  },
  {
    id: 'sultan-battery',
    cityId: 'mangalore',
    name: 'Sultan Battery',
    coordinates: { latitude: 12.9060, longitude: 74.8074 },
    categories: ['history', 'coastal'],
    shortDescription:
      'A historic watchtower built by Tipu Sultan near the Gurupura river mouth, used to monitor naval activity.',
    estimatedVisitDurationMinutes: 20,
    sources: [
      'https://en.wikipedia.org/wiki/Sultan_Battery,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-sultan-battery',
      altText: 'Sultan Battery black-stone watchtower overlooking Gurupura river',
      isPlaceholder: true,
    },
  },
  {
    id: 'mangaladevi-temple',
    cityId: 'mangalore',
    name: 'Mangaladevi Temple',
    coordinates: { latitude: 12.8594, longitude: 74.8423 },
    categories: ['religious', 'history'],
    shortDescription:
      'The temple from which Mangalore derives its name, dedicated to Goddess Mangaladevi.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://en.wikipedia.org/wiki/Mangaladevi_Temple,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-mangaladevi-temple',
      altText: 'Mangaladevi Temple traditional Kerala-style wooden architecture and sanctum',
      isPlaceholder: true,
    },
  },
  {
    id: 'tannirbhavi-beach',
    cityId: 'mangalore',
    name: 'Tannirbhavi Beach',
    coordinates: { latitude: 12.9199, longitude: 74.7922 },
    categories: ['nature', 'coastal'],
    shortDescription:
      'A quiet beach accessible by ferry across the Netravathi river, known for its calm waters and scenic surroundings.',
    estimatedVisitDurationMinutes: 60,
    sources: [
      'https://www.karnataka.com/mangalore/tannirbhavi-beach/',
    ],
    image: {
      assetKey: 'placeholder-tannirbhavi-beach',
      altText: 'Tannirbhavi Beach golden sands and Arabian Sea tree line',
      isPlaceholder: true,
    },
  },
];
