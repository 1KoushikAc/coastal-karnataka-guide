import type { Attraction } from '../../types';

// -----------------------------------------------------------------------------
// Verified Attraction Seed Data for Mangaluru & Coastal Environs
// Verified using official sources:
//   - https://dk.nic.in/en/places-of-interest/ (Dakshina Kannada District)
//   - https://karnatakatourism.org/ (Karnataka Tourism)
//   - https://www.mangalurusmartcity.net/tourism/ (Mangaluru Smart City)
//   - https://www.incredibleindia.gov.in/ (Incredible India)
// -----------------------------------------------------------------------------

export const mangaloreAttractions: Attraction[] = [
  // ── 1. Kadri Manjunatha Temple ─────────────────────────────────────────────
  {
    id: 'kadri-manjunatha-temple',
    cityId: 'mangalore',
    name: 'Kadri Manjunatha Temple',
    coordinates: { latitude: 12.8876, longitude: 74.8429 },
    categories: ['religious', 'history', 'architecture'],
    shortDescription:
      'One of the oldest temples in Mangalore, dedicated to Lord Manjunatha, with origins traced to the 10th century CE during the Alupa dynasty.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/kadri-manjunatheshwara-temple/',
      'https://en.wikipedia.org/wiki/Kadri_Manjunatha_Temple',
    ],
    image: {
      assetKey: 'placeholder-kadri-manjunatha-temple',
      altText: 'Kadri Manjunatha Temple heritage grounds and sacred hill tank',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public admission; voluntary donations',
    },
  },

  // ── 2. St. Aloysius Chapel ─────────────────────────────────────────────────
  {
    id: 'st-aloysius-chapel',
    cityId: 'mangalore',
    name: 'St. Aloysius Chapel',
    coordinates: { latitude: 12.8656, longitude: 74.8426 },
    categories: ['history', 'architecture', 'culture'],
    shortDescription:
      'A Jesuit chapel built in 1880, renowned for its Italian-style frescoes painted by Brother Antonio Moscheni covering walls and ceilings.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/st-aloysius-chapel/',
      'https://en.wikipedia.org/wiki/St._Aloysius_Chapel,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-st-aloysius-chapel',
      altText: 'St. Aloysius Chapel interior Italian Renaissance frescoes and nave',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public entry to chapel',
    },
  },

  // ── 3. Sultan Battery ──────────────────────────────────────────────────────
  {
    id: 'sultan-battery',
    cityId: 'mangalore',
    name: 'Sultan Battery',
    coordinates: { latitude: 12.9060, longitude: 74.8074 },
    categories: ['history', 'coastal'],
    shortDescription:
      'A historic black-stone watchtower built by Tipu Sultan in 1784 overlooking the Gurupura river mouth, constructed to guard the naval entrance.',
    estimatedVisitDurationMinutes: 20,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/sultan-battery/',
      'https://en.wikipedia.org/wiki/Sultan_Battery,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-sultan-battery',
      altText: 'Sultan Battery black-stone watchtower overlooking Gurupura river',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public monument access',
    },
  },

  // ── 4. Mangaladevi Temple ──────────────────────────────────────────────────
  {
    id: 'mangaladevi-temple',
    cityId: 'mangalore',
    name: 'Mangaladevi Temple',
    coordinates: { latitude: 12.8594, longitude: 74.8423 },
    categories: ['religious', 'history'],
    shortDescription:
      'The sacred temple from which the city of Mangalore derives its name, dedicated to Goddess Mangaladevi with classical Kerala-style woodcraft.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/mangaladevi-temple/',
      'https://en.wikipedia.org/wiki/Mangaladevi_Temple,_Mangalore',
    ],
    image: {
      assetKey: 'placeholder-mangaladevi-temple',
      altText: 'Mangaladevi Temple traditional Kerala-style wooden architecture and sanctum',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public admission',
    },
  },

  // ── 5. Tannirbhavi Beach ───────────────────────────────────────────────────
  {
    id: 'tannirbhavi-beach',
    cityId: 'mangalore',
    name: 'Tannirbhavi Beach',
    coordinates: { latitude: 12.9199, longitude: 74.7922 },
    categories: ['nature', 'coastal'],
    shortDescription:
      'A serene beach accessible by ferry across the Netravathi river, famed for quiet coastal sands, pine trees, and dramatic Arabian Sea sunsets.',
    estimatedVisitDurationMinutes: 60,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/tannirbhavi-beach/',
    ],
    image: {
      assetKey: 'placeholder-tannirbhavi-beach',
      altText: 'Tannirbhavi Beach golden sands and Arabian Sea tree line',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public beach access',
    },
  },

  // ── 6. Kudroli Gokarnanatheshwara Temple ────────────────────────────────────
  {
    id: 'kudroli-gokarnanatheshwara-temple',
    cityId: 'mangalore',
    name: 'Kudroli Gokarnanatheshwara Temple',
    coordinates: { latitude: 12.8797, longitude: 74.8329 },
    categories: ['religious', 'culture', 'architecture'],
    shortDescription:
      'Consecrated in 1912 under the guidance of social reformer Narayana Guru, celebrated for its golden gopuram and vibrant Mangaluru Dasara festival.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/kudroli-gokarnanatheshwara-temple/',
      'https://en.wikipedia.org/wiki/Gokarnanatheshwara_Temple',
    ],
    image: {
      assetKey: 'placeholder-kudroli-gokarnanatheshwara-temple',
      altText: 'Kudroli Gokarnanatheshwara Temple golden gopuram and expansive courtyard',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public temple admission',
    },
  },

  // ── 7. Panambur Beach ──────────────────────────────────────────────────────
  {
    id: 'panambur-beach',
    cityId: 'mangalore',
    name: 'Panambur Beach',
    coordinates: { latitude: 12.9348, longitude: 74.8016 },
    categories: ['coastal', 'nature'],
    shortDescription:
      'Mangalore\'s most vibrant coastal beach, located near New Mangalore Port, famed for coastal sunsets and the International Kite Festival.',
    estimatedVisitDurationMinutes: 60,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/panambur-beach/',
    ],
    image: {
      assetKey: 'placeholder-panambur-beach',
      altText: 'Panambur Beach shoreline, gentle Arabian Sea waves, and coastal sunset',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public beach access',
    },
  },

  // ── 8. Someshwara Beach & Rudra Shila ──────────────────────────────────────
  {
    id: 'someshwara-beach',
    cityId: 'mangalore',
    name: 'Someshwara Beach & Rudra Shila',
    coordinates: { latitude: 12.7932, longitude: 74.8587 },
    categories: ['coastal', 'nature', 'religious'],
    shortDescription:
      'A rugged southern coastline notable for the ancient Rudra Shila granitic rock formations and the cliffside Someshwara Temple overlooking the surf.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/someshwara-beach/',
    ],
    image: {
      assetKey: 'placeholder-someshwara-beach',
      altText: 'Someshwara Beach massive Rudra Shila coastal rocks and ocean surf',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public beach access',
    },
  },

  // ── 9. Ullal Beach ─────────────────────────────────────────────────────────
  {
    id: 'ullal-beach',
    cityId: 'mangalore',
    name: 'Ullal Beach',
    coordinates: { latitude: 12.8055, longitude: 74.8483 },
    categories: ['coastal', 'history'],
    shortDescription:
      'A historic coastline bordered by casuarina groves, rooted in the legacy of 16th-century anti-colonial warrior queen Rani Abbakka Chowta.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/ullal-beach/',
    ],
    image: {
      assetKey: 'placeholder-ullal-beach',
      altText: 'Ullal Beach casuarina tree line and quiet sandy shores',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public beach access',
    },
  },

  // ── 10. Surathkal Beach & Lighthouse ───────────────────────────────────────
  {
    id: 'surathkal-beach-lighthouse',
    cityId: 'mangalore',
    name: 'Surathkal Beach & Lighthouse',
    coordinates: { latitude: 13.0069, longitude: 74.7894 },
    categories: ['coastal', 'architecture', 'history'],
    shortDescription:
      'A picturesque rocky beach with an active 1972 lighthouse atop a coastal hillock, providing elevated vistas across the Arabian Sea coastline.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
    image: {
      assetKey: 'placeholder-surathkal-beach-lighthouse',
      altText: 'Surathkal Lighthouse tower on a coastal promontory overlooking the ocean',
      isPlaceholder: true,
    },
    admission: {
      isFree: false,
      currency: 'INR',
      amount: 20,
      notes: 'Free beach access; nominal ticket fee for lighthouse viewing gallery',
    },
  },

  // ── 11. Rosario Cathedral ──────────────────────────────────────────────────
  {
    id: 'rosario-cathedral',
    cityId: 'mangalore',
    name: 'Rosario Cathedral',
    coordinates: { latitude: 12.8583, longitude: 74.8361 },
    categories: ['architecture', 'religious', 'history'],
    shortDescription:
      'First established in 1568, Mangalore\'s historic cathedral features a commanding Roman dome modeled after St. Peter\'s Basilica in Rome.',
    estimatedVisitDurationMinutes: 35,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.mangalurusmartcity.net/tourism/',
      'https://en.wikipedia.org/wiki/Rosario_Cathedral',
    ],
    image: {
      assetKey: 'placeholder-rosario-cathedral',
      altText: 'Rosario Cathedral Roman-style facade and central dome in Bolar',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public entry',
    },
  },

  // ── 12. Milagres Church ────────────────────────────────────────────────────
  {
    id: 'milagres-church',
    cityId: 'mangalore',
    name: 'Milagres Church',
    coordinates: { latitude: 12.8686, longitude: 74.8447 },
    categories: ['architecture', 'religious', 'history'],
    shortDescription:
      'A central Hampankatta landmark established in 1680, known for its neoclassical facade, marble altars, and three centuries of parish heritage.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://en.wikipedia.org/wiki/Milagres_Church_(Mangalore)',
    ],
    image: {
      assetKey: 'placeholder-milagres-church',
      altText: 'Milagres Church neoclassical portico and spire in central Mangalore',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public entry',
    },
  },

  // ── 13. Kadri Park ─────────────────────────────────────────────────────────
  {
    id: 'kadri-park',
    cityId: 'mangalore',
    name: 'Kadri Park',
    coordinates: { latitude: 12.8893, longitude: 74.8517 },
    categories: ['nature'],
    shortDescription:
      'The largest civic garden in Mangaluru, offering landscaped walking paths, horticulture nurseries, and a verdant retreat next to Kadri Hill.',
    estimatedVisitDurationMinutes: 40,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.mangalurusmartcity.net/tourism/',
    ],
    image: {
      assetKey: 'placeholder-kadri-park',
      altText: 'Kadri Park verdant landscaped lawns, palm trees, and pathways',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public park entry',
    },
  },

  // ── 14. Pilikula Nisargadhama ──────────────────────────────────────────────
  {
    id: 'pilikula-nisargadhama',
    cityId: 'mangalore',
    name: 'Pilikula Nisargadhama',
    coordinates: { latitude: 12.9286, longitude: 74.9015 },
    categories: ['nature', 'culture'],
    shortDescription:
      'An integrated eco-cultural heritage sanctuary at Vamanjoor featuring an authentic Tuluva artisan village, biological park, and botanical gardens.',
    estimatedVisitDurationMinutes: 90,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/pilikula-nisargadhama/',
    ],
    image: {
      assetKey: 'placeholder-pilikula-nisargadhama',
      altText: 'Pilikula Heritage Village traditional thatched wooden huts and artisan compound',
      isPlaceholder: true,
    },
    admission: {
      isFree: false,
      currency: 'INR',
      amount: 100,
      notes: 'Entry tickets for biological park and heritage village sections',
    },
  },

  // ── 15. Bejai Government Museum ────────────────────────────────────────────
  {
    id: 'bejai-museum',
    cityId: 'mangalore',
    name: 'Bejai Government Museum',
    coordinates: { latitude: 12.8824, longitude: 74.8465 },
    categories: ['history', 'culture'],
    shortDescription:
      'Mangaluru\'s premier archaeological museum, housed in a heritage ship-shaped mansion displaying ancient coins, Vijayanagara bronzes, and weapons.',
    estimatedVisitDurationMinutes: 45,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
    image: {
      assetKey: 'placeholder-bejai-museum',
      altText: 'Bejai Government Museum historic ship-shaped colonial building',
      isPlaceholder: true,
    },
    admission: {
      isFree: false,
      currency: 'INR',
      amount: 20,
      notes: 'Nominal Department of Archaeology entry ticket',
    },
  },

  // ── 16. Swami Vivekananda Planetarium ─────────────────────────────────────
  {
    id: 'swami-vivekananda-planetarium',
    cityId: 'mangalore',
    name: 'Swami Vivekananda Planetarium',
    coordinates: { latitude: 12.9272, longitude: 74.8988 },
    categories: ['culture', 'architecture'],
    shortDescription:
      'India\'s first 3D 8K digital planetarium located at the Pilikula Regional Science Centre, delivering immersive astronomical presentations.',
    estimatedVisitDurationMinutes: 60,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.incredibleindia.gov.in/',
    ],
    image: {
      assetKey: 'placeholder-swami-vivekananda-planetarium',
      altText: 'Swami Vivekananda 3D 8K Planetarium dome structure at Pilikula',
      isPlaceholder: true,
    },
    admission: {
      isFree: false,
      currency: 'INR',
      amount: 80,
      notes: 'Ticketed planetarium show admission',
    },
  },

  // ── 17. Sharavu Mahaganapathi Temple ───────────────────────────────────────
  {
    id: 'sharavu-mahaganapathi-temple',
    cityId: 'mangalore',
    name: 'Sharavu Mahaganapathi Temple',
    coordinates: { latitude: 12.8712, longitude: 74.8437 },
    categories: ['religious', 'history'],
    shortDescription:
      'An eight-century-old temple in the city center venerating Lord Ganapathi and Shiva, renowned for its sacred theertha tank and Yakshagana recitals.',
    estimatedVisitDurationMinutes: 30,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
    image: {
      assetKey: 'placeholder-sharavu-mahaganapathi-temple',
      altText: 'Sharavu Mahaganapathi Temple sacred courtyard and brass deepastambha',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public temple admission',
    },
  },

  // ── 18. Sri Venkataramana Temple, Car Street ───────────────────────────────
  {
    id: 'car-street-venkataramana-temple',
    cityId: 'mangalore',
    name: 'Sri Venkataramana Temple, Car Street',
    coordinates: { latitude: 12.8703, longitude: 74.8398 },
    categories: ['religious', 'culture', 'history'],
    shortDescription:
      'A 17th-century spiritual center of the Gowd Saraswat Brahmin community, famous for its grand wooden chariot festival and vibrant Car Street commerce.',
    estimatedVisitDurationMinutes: 35,
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
    image: {
      assetKey: 'placeholder-car-street-venkataramana-temple',
      altText: 'Car Street Venkataramana Temple intricately carved entrance and festival square',
      isPlaceholder: true,
    },
    admission: {
      isFree: true,
      currency: 'INR',
      amount: 0,
      notes: 'Free public temple admission',
    },
  },
];
