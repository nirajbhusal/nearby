# Sources: Cafés & food dataset (compiled 2026-10-26)

## Base data
- OpenStreetMap through the Overpass API (overpass-api.de), queried 2026-10-26: amenity=cafe|restaurant with a name, in bbox 27.62,85.24,27.78,85.45 (Kathmandu Valley; 3,721 features) and 28.18,83.93,28.24,84.00 (Pokhara; 749 features). Raw dumps: ktm.json, pkr.json. Data © OpenStreetMap contributors, ODbL.
- OSM Nominatim for 7 places that the Overpass name match missed (coord_source = "OSM Nominatim").
- Opening hours, websites, phones and cuisine tags come only from OSM tags. They are null when OSM has no value.

## Quality and popularity cross-checks (each place lists them in cross_check_sources)
- Condé Nast Traveller ME, Kathmandu traditional restaurants: https://www.cntravellerme.com/story/the-best-restaurants-in-kathmandu-for-traditional-nepali-dishes
- Kata Jaam, Patan evening guide: https://katajaam.com/blog/patan-after-dark-evening-guide
- Explore All About Nepal, local restaurants 2026: https://exploreallaboutnepal.com/best-local-restaurants-in-kathmandu/
- Full Time Explorer, Thakali in Lakeside (Oct 2026): https://fulltimeexplorer.com/best-thakali-in-lakeside-pokhara-3-places-to-eat-dal-bhat/
- Full Time Explorer, Bhaktapur restaurants: https://fulltimeexplorer.com/best-restaurants-bhaktapur-nepal/
- Nako Cafe official site: https://nako.com.np/
- Ratings (7 places) come from Exa Places aggregated listings, viewed 2026-10-26. These pages show a star rating but no review count:
  - https://exa.ai/library/places?q=c959b86e852e88dd
  - https://exa.ai/library/places?q=3bc22355e75a982d
  - https://exa.ai/library/places?q=a5ec8641a33f774e

## Rules followed
- No review text was copied. I wrote the descriptions and kept them neutral.
- known_for is set only when a source supports it (OSM cuisine tag, the place name, or a cited guide). Otherwise it is null.
- tripadvisor_url and review_count are null for every place because none were verified.
- The other places were picked from OSM by well-known names. Only the places with a cross_check_sources entry were checked against a web source this session.
