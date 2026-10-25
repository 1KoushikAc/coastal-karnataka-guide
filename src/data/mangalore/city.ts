import type { City, Destination } from '../../types';

export const mangaloreDestination: Destination = {
  id: 'mangalore',
  name: 'Mangalore',
  state: 'Karnataka',
  country: 'India',
  tagline: 'Gateway to Coastal Karnataka & the Arabian Sea',
  description:
    'A historic coastal city where ancient Alupa dynasty temples, Italian Renaissance frescoes, and Arabian Sea lookout towers meet living Tulu traditions.',
  // Approximate city centre — Hampankatta area
  coordinates: { latitude: 12.8698, longitude: 74.8430 },
  attractionIds: [
    'kadri-manjunatha-temple',
    'st-aloysius-chapel',
    'sultan-battery',
    'mangaladevi-temple',
    'tannirbhavi-beach',
    'kudroli-gokarnanatheshwara-temple',
    'panambur-beach',
    'someshwara-beach',
    'ullal-beach',
    'surathkal-beach-lighthouse',
    'rosario-cathedral',
    'milagres-church',
    'kadri-park',
    'pilikula-nisargadhama',
    'bejai-museum',
    'swami-vivekananda-planetarium',
    'sharavu-mahaganapathi-temple',
    'car-street-venkataramana-temple',
  ],
  tourIds: ['mangalore-heritage-walk'],
  heroImage: {
    assetKey: 'placeholder-mangalore-heritage-walk',
    altText: 'Mangalore coastal city and heritage landmarks',
    isPlaceholder: true,
  },
};

export const mangaloreCity: City = mangaloreDestination;
