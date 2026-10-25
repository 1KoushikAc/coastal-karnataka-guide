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
    `.trim(),
    sources: [
      'https://www.karnataka.com/mangalore/tannirbhavi-beach/',
    ],
  },
  {
    id: 'story-kudroli-gokarnanatheshwara-temple',
    attractionId: 'kudroli-gokarnanatheshwara-temple',
    title: 'A Beacon of Reform and Light',
    narrationText: `
Consecrated in 1912 under the guidance of renowned Kerala philosopher and social reformer Narayana Guru, this temple was established to provide spiritual dignity and access to the Billava community and all people regardless of caste.

The temple complex is celebrated for its radiant golden gopuram, extensive marble courtyards, and sacred sanctorum dedicated to Lord Shiva. During Navaratri, it hosts the internationally famous Mangaluru Dasara, transforming the sanctum and surrounding streets into a sea of dazzling illumination and folk pageantry.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/kudroli-gokarnanatheshwara-temple/',
      'https://en.wikipedia.org/wiki/Gokarnanatheshwara_Temple',
    ],
  },
  {
    id: 'story-panambur-beach',
    attractionId: 'panambur-beach',
    title: 'Where Trade and Tides Converge',
    narrationText: `
Panambur Beach is Mangaluru's premier coastal waterfront, situated just north of New Mangalore Port. Famed for its expansive golden sands and well-maintained public promenade, it is one of the safest beaches along Coastal Karnataka with continuous lifeguard patrols.

Every winter, Panambur hosts the International Kite Festival, drawing master kite flyers from dozens of countries whose monumental airborne creations float against the Arabian Sea horizon.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/panambur-beach/',
    ],
  },
  {
    id: 'story-someshwara-beach',
    attractionId: 'someshwara-beach',
    title: 'The Sacred Rocks of Rudra Shila',
    narrationText: `
Located along the rugged southern coastline of Ullal, Someshwara Beach is famous for its massive granitic boulder formations known as Rudra Shila, which have withstood the Arabian Sea's pounding surf for millennia.

Perched directly on the cliffs above these formations stands the historic Someshwara Temple dedicated to Lord Somanatha, built centuries ago by the Alupa kings. The crashing waves against ancient stones evoke the primordial power of the sea.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/someshwara-beach/',
    ],
  },
  {
    id: 'story-ullal-beach',
    attractionId: 'ullal-beach',
    title: 'The Brave Queen of the Coast',
    narrationText: `
Ullal Beach is characterized by its tranquil casuarina groves and gentle estuary currents, but its shores carry the indelible spirit of resistance. Ullal was the seat of Rani Abbakka Chowta, the fearless 16th-century warrior queen.

Rani Abbakka commanded an army drawn from all local communities and repeatedly repelled Portuguese naval invaders across four decades, earning her an enduring place in Indian history as Abbakka Rani, the unconquered queen of Coastal Karnataka.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/ullal-beach/',
    ],
  },
  {
    id: 'story-surathkal-beach-lighthouse',
    attractionId: 'surathkal-beach-lighthouse',
    title: 'Beacon Over the Rocky Promontory',
    narrationText: `
Surathkal Beach curves along the northern coastline of Mangaluru, dominated by a rocky hillock that meets the sea. Perched atop this headland is the Surathkal Lighthouse, established in 1972.

Rising 35 meters into the coastal breeze, the lighthouse provides panoramic views of the curving coastline, fishing vessels at sea, and the adjacent Sadashiva Temple, built on a rocky outcrop right at the water's edge.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
  },
  {
    id: 'story-rosario-cathedral',
    attractionId: 'rosario-cathedral',
    title: 'The Historic Dome of Bolar',
    narrationText: `
Established in 1568, the Church of Our Lady of the Rosary in Bolar is the oldest Roman Catholic institution in Canara. Raised to the status of a cathedral in 1850, it underwent an ambitious reconstruction in 1910 under Italian Jesuit architect Brother Divo.

Its defining architectural marvel is the majestic central dome, consciously modeled after St. Peter's Basilica in the Vatican, complete with 48 soaring arches and a cross visible to ships navigating the coastal waters.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.mangalurusmartcity.net/tourism/',
      'https://en.wikipedia.org/wiki/Rosario_Cathedral',
    ],
  },
  {
    id: 'story-milagres-church',
    attractionId: 'milagres-church',
    title: 'Three Centuries of Coastal Resilience',
    narrationText: `
Founded in 1680 by Bishop Thomas de Castro, the Church of Our Lady of Miracles in Hampankatta has witnessed over three centuries of Mangaluru's evolving history.

After being damaged during regional conflicts in 1784, the church was lovingly rebuilt by the local Catholic community starting in 1811. Its dignified neoclassical facade, arched windows, and marble altars make it one of the most prominent ecclesiastical landmarks of downtown Mangaluru.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://en.wikipedia.org/wiki/Milagres_Church_(Mangalore)',
    ],
  },
  {
    id: 'story-kadri-park',
    attractionId: 'kadri-park',
    title: 'The Green Heart of Mangaluru',
    narrationText: `
Spanning across rolling acres adjacent to Kadri Hill, Kadri Park is the largest civic lung of Mangaluru. Maintained with manicured gardens, flowering tropical canopies, and serene walking tracks, it is the city's favorite gathering space for morning walkers and nature lovers.

The park also features a musical fountain and children's garden, providing a verdant oasis of relaxation in the middle of a bustling commercial port city.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.mangalurusmartcity.net/tourism/',
    ],
  },
  {
    id: 'story-pilikula-nisargadhama',
    attractionId: 'pilikula-nisargadhama',
    title: 'Living Traditions of Tulunadu',
    narrationText: `
Pilikula, translating to "Tiger's Pond" in Tulu, is an expansive 370-acre ecological and cultural heritage reserve situated in Vamanjoor. At its cultural core lies the Artisans Heritage Village, anchored by an authentic Guttu House — the traditional ancestral mansion of coastal feudal chieftains.

Here, visitors witness master artisans practicing age-old coastal crafts, from handloom weaving and black pottery to wood carving and cane weaving, keeping Tulunadu's tangible heritage vibrantly alive.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/tourist-place/pilikula-nisargadhama/',
    ],
  },
  {
    id: 'story-bejai-museum',
    attractionId: 'bejai-museum',
    title: 'Relics of Coastal Empires',
    narrationText: `
Housed within the heritage two-story Srimanthi Bai Memorial building in Bejai, this archaeological museum is designed uniquely in the architectural likeness of a ship.

Its galleries preserve priceless antiquities from Coastal Karnataka's trade and dynastic history, including ancient Roman coins discovered along coastal ports, Vijayanagara and Hoysala bronzes, copper plate inscriptions, and centuries-old defensive armor.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
  },
  {
    id: 'story-swami-vivekananda-planetarium',
    attractionId: 'swami-vivekananda-planetarium',
    title: 'A Window to the Cosmos',
    narrationText: `
Situated within the Pilikula Regional Science Centre, the Swami Vivekananda 3D Planetarium is India's first 8K resolution 3D digital planetarium, and only one of a handful in the entire world.

Housed beneath an 18-meter tilted nano-seam dome, its active stereoscopic 3D projection system allows audiences to journey across planetary systems, deep space nebulae, and astrophysical phenomena with extraordinary visual fidelity.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://www.incredibleindia.gov.in/',
    ],
  },
  {
    id: 'story-sharavu-mahaganapathi-temple',
    attractionId: 'sharavu-mahaganapathi-temple',
    title: 'The Sacred Arrow and Theertha',
    narrationText: `
With a recorded history spanning over eight centuries, Sharavu Mahaganapathi Temple in central Mangaluru is steeped in local folklore. The name Sharavu is derived from "shara" (arrow), linked to a legendary penance performed by Maharaja Veerabahu.

The temple unites shrines of Lord Ganapathi and Lord Kadri Manjunatha, drawing pilgrims from all over Karnataka. Its sacred theertha tank and festive cultural courtyard host classical Yakshagana dance-dramas and temple arts throughout the festival seasons.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
  },
  {
    id: 'story-car-street-venkataramana-temple',
    attractionId: 'car-street-venkataramana-temple',
    title: 'The Chariots of Car Street',
    narrationText: `
Established in the 17th century, Sri Venkataramana Temple on Car Street is the sacred nerve center of the Gowd Saraswat Brahmin (GSB) community in Mangaluru.

The temple is globally famed for its annual Rathotsava (Car Festival), during which the towering wooden chariot (Brahma Ratha) bearing the deity is pulled by thousands of devotees down Car Street. The festival is accompanied by vibrant market bazaars, Vedic chanting, and the playful communal joy of Okuli.
    `.trim(),
    sources: [
      'https://dk.nic.in/en/places-of-interest/',
      'https://karnatakatourism.org/',
    ],
  },
];
