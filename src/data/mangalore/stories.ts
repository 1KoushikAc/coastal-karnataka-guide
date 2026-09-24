import type { Story } from '../../types';

// -----------------------------------------------------------------------------
// Narration scripts for each attraction in Mangalore.
// [PLACEHOLDER] marks content that needs expert/local review before use.
// Sources array must list references backing every factual claim.
// -----------------------------------------------------------------------------

export const mangaloreStories: Story[] = [
  {
    id: 'story-kadri-manjunatha-temple',
    attractionId: 'kadri-manjunatha-temple',
    title: 'A Thousand Years at Kadri Hill',
    narrationText: `
Welcome to the Kadri Manjunatha Temple, one of the oldest places of worship in Mangalore.
The temple is dedicated to Lord Manjunatha, a form of Shiva, and its origins are believed
to date back to the 10th century CE, during the reign of the Alupa dynasty.

The bronze idol of Lokeshwara enshrined here is considered one of the finest examples of
Buddhist bronze craftsmanship in Karnataka, and is dated to 968 CE — a remarkable artifact
that reflects the region's layered religious history, when Buddhism and Shaivism coexisted
in Coastal Karnataka.

[PLACEHOLDER: Additional details about the temple tank, festival traditions, and architectural
features are pending local expert review.]

Take a moment to absorb the stillness here. This hill has been a place of pilgrimage for
over a thousand years.
    `.trim(),
    sources: [
      'https://en.wikipedia.org/wiki/Kadri_Manjunatha_Temple',
    ],
  },
  {
    id: 'story-st-aloysius-chapel',
    attractionId: 'st-aloysius-chapel',
    title: 'The Chapel of a Thousand Frescoes',
    narrationText: `
You are standing inside St. Aloysius Chapel, built in 1880 by the Society of Jesus — the Jesuits.
But what makes this chapel truly extraordinary is what you see on every wall and ceiling around you.

These frescoes were painted entirely by one man: Brother Antonio Moscheni, an Italian Jesuit brother,
between 1899 and 1900. Using techniques inspired by the Italian Renaissance masters, he covered
the chapel's interior with over a hundred scenes from the Bible and the life of St. Aloysius Gonzaga.

The chapel was built on the grounds of St. Aloysius College, established in 1880. At a time when
Mangalore was under British administration, this college and its chapel became a landmark of
education and faith on the coast.

[PLACEHOLDER: Details about specific fresco panels and their iconographic significance
are pending art historical review.]
    `.trim(),
    sources: [
      'https://en.wikipedia.org/wiki/St._Aloysius_Chapel,_Mangalore',
    ],
  },
  {
    id: 'story-sultan-battery',
    attractionId: 'sultan-battery',
    title: 'Tipu Sultan\'s Eye on the Sea',
    narrationText: `
This modest structure overlooking the Gurupura river mouth carries a significant chapter
of Mangalore's history. Sultan Battery was built by Tipu Sultan — ruler of the Kingdom of
Mysore — as a watchtower and gun battery to guard the river approach to his territories.

Tipu Sultan controlled Mangalore from 1784, and the port here was strategically important
for trade and military movement along the Arabian Sea coast.

The battery gets its name from Tipu Sultan himself. From this vantage point, his forces
could monitor ships entering and leaving the river, making it a key point in the coastal
defence network of the time.

[PLACEHOLDER: Precise construction date, garrison size, and armament details
are pending archival verification.]
    `.trim(),
    sources: [
      'https://en.wikipedia.org/wiki/Sultan_Battery,_Mangalore',
      'https://en.wikipedia.org/wiki/Tipu_Sultan',
    ],
  },
  {
    id: 'story-mangaladevi-temple',
    attractionId: 'mangaladevi-temple',
    title: 'The Goddess Who Named a City',
    narrationText: `
The city of Mangalore takes its very name from this temple — the Mangaladevi Temple,
dedicated to Goddess Mangaladevi, a form of Parvati.

According to local tradition, a merchant from Kerala brought the goddess to this location,
and the temple was established here centuries ago. The city that grew around this sacred
site came to be known as Mangalapura — the city of Mangaladevi — which over time
became Mangalore.

[PLACEHOLDER: The founding date, historical patronage, and details of the temple's
architectural evolution are pending verification from local historical records.]
    `.trim(),
    sources: [
      'https://en.wikipedia.org/wiki/Mangaladevi_Temple,_Mangalore',
    ],
  },
  {
    id: 'story-tannirbhavi-beach',
    attractionId: 'tannirbhavi-beach',
    title: 'Across the River to a Quieter Shore',
    narrationText: `
Tannirbhavi Beach sits just across the Netravathi river from the city, and that short
ferry crossing is part of what makes it special. The name Tannirbhavi means "water well"
in Kannada, a reference to freshwater wells that were once found along this shore.

Unlike the busier beaches closer to the city centre, Tannirbhavi has stayed relatively
quiet — a stretch of dark sand where the Arabian Sea meets the river mouth, and where
fishermen still bring in their catch each morning.

On a clear day you can see the Western Ghats rising to the east, and cargo ships
moving slowly along the horizon to the west.

[PLACEHOLDER: Historical details about the ferry service, fishing community traditions,
and ecological notes about the estuary pending local research.]
    `.trim(),
    sources: [
      'https://www.karnataka.com/mangalore/tannirbhavi-beach/',
    ],
  },
];
