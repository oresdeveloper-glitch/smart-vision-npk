export interface EducationArticle {
  id: string;
  title: { en: string; sw: string };
  category: 'maize' | 'beans' | 'fertilizer' | 'practices';
  content: { en: string; sw: string };
  icon: string;
}

export const educationArticles: EducationArticle[] = [
  {
    id: 'maize-n-deficiency',
    title: { en: 'Nitrogen Deficiency in Maize', sw: 'Upungufu wa Nitrojeni kwenye Mahindi' },
    category: 'maize',
    icon: '🌽',
    content: {
      en: `## Nitrogen Deficiency in Maize

Nitrogen is the most critical nutrient for maize production. It is a key component of chlorophyll, the compound that gives plants their green color and enables photosynthesis.

### Symptoms
- Yellowing (chlorosis) of older/lower leaves first
- V-shaped yellowing pattern from leaf tip toward the stalk
- Stunted plant growth
- Thin, spindly stalks
- Small ear size with poor grain fill
- Light green to yellow overall plant color

### Causes
- Insufficient nitrogen fertilizer application
- Leaching due to heavy rainfall
- Sandy soils with low organic matter
- Continuous maize cropping without rotation
- Removal of crop residues

### Impact on Yield
Nitrogen deficiency can reduce maize yields by 30-70% depending on severity. It affects both grain quality and quantity.

### Management
1. Apply recommended nitrogen rates based on soil testing
2. Split nitrogen applications (at planting, V6 stage, and pre-tasseling)
3. Use slow-release nitrogen fertilizers in high-rainfall areas
4. Practice crop rotation with legumes
5. Incorporate crop residues and organic matter`,
      sw: `## Upungufu wa Nitrojeni kwenye Mahindi

Nitrojeni ni madini muhimu zaidi kwa uzalishaji wa mahindi. Ni sehemu muhimu ya klorofili, kiwanja kinachowapa mimea rangi ya kijani na kuwezesha usanidimwanga.

### Dalili
- Kugeuka njano (klorosisi) kwa majani makubwa/ya chini kwanza
- Mfumo wa kugeuka njano wa umbo la V kutoka ncha ya jani kuelekea shina
- Ukuaji duni wa mmea
- Mashina membamba na madogo
- Magunzi madogo yenye nafaka chache
- Rangi ya mmea mzima kuwa kijani hafifu hadi njano

### Visababishi
- Kutoweka mbolea ya nitrojeni ya kutosha
- Kusombwa na mvua kubwa
- Udongo wa mchanga wenye vitu vya kikaboni vichache
- Kulima mahindi mfululizo bila mzunguko
- Kuondoa mabaki ya mazao

### Athari kwa Mavuno
Upungufu wa nitrojeni unaweza kupunguza mavuno ya mahindi kwa 30-70% kutegemea ukali. Unaathiri ubora na wingi wa nafaka.

### Usimamizi
1. Weka viwango vya nitrojeni vilivyopendekezwa kulingana na uchunguzi wa udongo
2. Gawanya matumizi ya nitrojeni (wakati wa kupanda, hatua ya V6, na kabla ya kutoa mbelewele)
3. Tumia mbolea za nitrojeni zinazotolewa taratibu katika maeneo yenye mvua nyingi
4. Zingatia mzunguko wa mazao na mikunde
5. Changanya mabaki ya mazao na vitu vya kikaboni`,
    },
  },
  {
    id: 'maize-p-deficiency',
    title: { en: 'Phosphorus Deficiency in Maize', sw: 'Upungufu wa Fosforasi kwenye Mahindi' },
    category: 'maize',
    icon: '🟣',
    content: {
      en: `## Phosphorus Deficiency in Maize

Phosphorus is essential for energy transfer (ATP), root development, and early plant growth. It plays a vital role in photosynthesis and cell division.

### Symptoms
- Purple or reddish-purple coloration on leaf tips and margins
- Dark green leaves with purple tints
- Stunted early growth
- Delayed maturity
- Poor root development
- Twisted or curled leaves in severe cases
- Reduced ear size and irregular kernel rows

### Causes
- Cold, wet soils that limit phosphorus availability
- Low soil phosphorus levels
- High soil pH (above 7.5) or very low pH (below 5.5)
- Compacted soils restricting root growth
- Insufficient phosphorus fertilizer application

### Impact on Yield
Phosphorus deficiency during early growth stages can cause irreversible yield losses of 15-25%, even if phosphorus is supplied later.

### Management
1. Apply phosphorus fertilizer at or before planting (band placement)
2. Maintain soil pH between 6.0-7.0
3. Use starter fertilizers containing phosphorus
4. Improve soil drainage in wet areas
5. Consider mycorrhizal inoculants`,
      sw: `## Upungufu wa Fosforasi kwenye Mahindi

Fosforasi ni muhimu kwa uhamishaji wa nishati (ATP), ukuzaji wa mizizi, na ukuaji wa mapema wa mmea. Ina jukumu muhimu katika usanidimwanga na mgawanyiko wa seli.

### Dalili
- Rangi ya zambarau au zambarau-nyekundu kwenye ncha na pembe za majani
- Majani ya kijani iliyokolea yenye rangi ya zambarau
- Ukuaji duni wa mapema
- Kuchelewa kukomaa
- Ukuzaji duni wa mizizi
- Majani yaliyojikunja au kujipinda katika hali kali
- Magunzi madogo na mistari isiyo ya kawaida ya nafaka

### Visababishi
- Udongo baridi na wenye maji unaozuia upatikanaji wa fosforasi
- Viwango vya chini vya fosforasi kwenye udongo
- pH ya juu ya udongo (zaidi ya 7.5) au pH ya chini sana (chini ya 5.5)
- Udongo uliogandamizwa unaozuia ukuaji wa mizizi
- Kutoweka mbolea ya fosforasi ya kutosha

### Athari kwa Mavuno
Upungufu wa fosforasi wakati wa hatua za ukuaji wa mapema unaweza kusababisha hasara za mavuno zisizoweza kutibika za 15-25%.

### Usimamizi
1. Weka mbolea ya fosforasi wakati au kabla ya kupanda (kwa mkanda)
2. Dumisha pH ya udongo kati ya 6.0-7.0
3. Tumia mbolea za kuanzishia zenye fosforasi
4. Boresha mifereji ya maji katika maeneo yenye maji
5. Zingatia chanjo za mycorrhizal`,
    },
  },
  {
    id: 'maize-k-deficiency',
    title: { en: 'Potassium Deficiency in Maize', sw: 'Upungufu wa Potasiamu kwenye Mahindi' },
    category: 'maize',
    icon: '🌿',
    content: {
      en: `## Potassium Deficiency in Maize

Potassium is crucial for water regulation, enzyme activation, photosynthesis, and stalk strength. It helps plants resist drought and diseases.

### Symptoms
- Yellowing and browning (necrosis) along leaf margins and tips
- Symptoms appear first on older/lower leaves
- Weak stalks prone to lodging
- Shortened internodes
- Poor ear tip fill
- Increased susceptibility to diseases
- "Firing" appearance of leaves

### Causes
- Sandy soils with low cation exchange capacity
- Soils with low potassium levels
- Drought conditions limiting potassium uptake
- Heavy crop removal without potassium replacement
- Soil compaction

### Impact on Yield
Potassium deficiency can reduce yields by 20-40% and significantly decrease grain quality and stalk strength.

### Management
1. Apply potassium fertilizer based on soil test recommendations
2. Split applications on sandy soils
3. Return crop residues to the field
4. Maintain adequate soil moisture
5. Use potassium-rich organic amendments like wood ash`,
      sw: `## Upungufu wa Potasiamu kwenye Mahindi

Potasiamu ni muhimu kwa udhibiti wa maji, uamilishaji wa vimeng'enya, usanidimwanga, na nguvu ya shina. Inasaidia mimea kupinga ukame na magonjwa.

### Dalili
- Kugeuka njano na kahawia (nekrosisi) pembezoni na kwenye ncha za majani
- Dalili zinaonekana kwanza kwenye majani makubwa/ya chini
- Mashina dhaifu yanayoweza kuanguka
- Vifundo vilivyofupishwa
- Kujaa hafifu kwa ncha za magunzi
- Kuongezeka kwa uwezekano wa magonjwa
- Mwonekano wa "kuungua" wa majani

### Visababishi
- Udongo wa mchanga wenye uwezo mdogo wa kubadilishana ioni
- Udongo wenye viwango vya chini vya potasiamu
- Hali ya ukame inayozuia ufyonzaji wa potasiamu
- Uondoshaji mkubwa wa mazao bila kurudisha potasiamu
- Kugandamizwa kwa udongo

### Athari kwa Mavuno
Upungufu wa potasiamu unaweza kupunguza mavuno kwa 20-40% na kupunguza kwa kiasi kikubwa ubora wa nafaka na nguvu ya shina.

### Usimamizi
1. Weka mbolea ya potasiamu kulingana na ushauri wa uchunguzi wa udongo
2. Gawanya matumizi kwenye udongo wa mchanga
3. Rudisha mabaki ya mazao shambani
4. Dumisha unyevu wa kutosha wa udongo
5. Tumia marekebisho ya kikaboni yenye potasiamu kama majivu ya kuni`,
    },
  },
  {
    id: 'fertilizer-guide',
    title: { en: 'Complete Fertilizer Guide', sw: 'Mwongozo Kamili wa Mbolea' },
    category: 'fertilizer',
    icon: '🧪',
    content: {
      en: `## Complete Fertilizer Guide for Maize and Beans

### Understanding NPK Ratios
Fertilizer labels show three numbers representing N-P-K percentages:
- **N (Nitrogen)**: Leaf growth and green color
- **P (Phosphorus)**: Root development and energy transfer
- **K (Potassium)**: Water regulation and disease resistance

### Common Fertilizers

**Urea (46-0-0)**
- Highest nitrogen content
- Best for nitrogen deficiency
- Apply 100-150 kg/ha for maize

**DAP - Diammonium Phosphate (18-46-0)**
- High phosphorus content
- Best applied at planting
- Apply 100-150 kg/ha

**MOP - Muriate of Potash (0-0-60)**
- High potassium content
- Best for potassium deficiency
- Apply 80-120 kg/ha

**NPK Blends**
- Balanced nutrition
- Common ratios: 15-15-15, 10-20-10, 23-10-5
- Choose based on crop needs and soil tests

### Application Methods
1. **Broadcasting**: Spreading fertilizer evenly over the field
2. **Band Placement**: Placing fertilizer in bands near the seed row
3. **Side-dressing**: Applying fertilizer beside growing plants
4. **Foliar Application**: Spraying liquid fertilizer on leaves
5. **Fertigation**: Applying fertilizer through irrigation water

### Best Practices
- Always conduct soil tests before fertilizer application
- Apply phosphorus at or before planting
- Split nitrogen applications for better efficiency
- Consider organic sources like compost and manure
- Follow recommended rates to avoid environmental damage`,
      sw: `## Mwongozo Kamili wa Mbolea kwa Mahindi na Maharagwe

### Kuelewa Uwiano wa NPK
Lebo za mbolea zinaonyesha namba tatu zinazowakilisha asilimia za N-P-K:
- **N (Nitrojeni)**: Ukuaji wa majani na rangi ya kijani
- **P (Fosforasi)**: Ukuzaji wa mizizi na uhamishaji wa nishati
- **K (Potasiamu)**: Udhibiti wa maji na upinzani wa magonjwa

### Mbolea za Kawaida

**Urea (46-0-0)**
- Kiwango cha juu zaidi cha nitrojeni
- Bora kwa upungufu wa nitrojeni
- Weka kilo 100-150 kwa hekta kwa mahindi

**DAP - Fosfati ya Diamonia (18-46-0)**
- Kiwango cha juu cha fosforasi
- Bora kuwekwa wakati wa kupanda
- Weka kilo 100-150 kwa hekta

**MOP - Muriate ya Potashi (0-0-60)**
- Kiwango cha juu cha potasiamu
- Bora kwa upungufu wa potasiamu
- Weka kilo 80-120 kwa hekta

**Mchanganyiko wa NPK**
- Lishe iliyosawazishwa
- Uwiano wa kawaida: 15-15-15, 10-20-10, 23-10-5
- Chagua kulingana na mahitaji ya zao na uchunguzi wa udongo

### Njia za Kuweka
1. **Kutapanya**: Kusambaza mbolea sawasawa shambani
2. **Kuweka kwa Mkanda**: Kuweka mbolea kwenye mistari karibu na mbegu
3. **Kuweka Kando**: Kuweka mbolea kando ya mimea inayokua
4. **Kunyunyizia Majani**: Kunyunyizia mbolea ya maji kwenye majani
5. **Kuweka kwa Umwagiliaji**: Kuweka mbolea kupitia maji ya umwagiliaji

### Mbinu Bora
- Fanya uchunguzi wa udongo kila wakati kabla ya kuweka mbolea
- Weka fosforasi wakati au kabla ya kupanda
- Gawanya matumizi ya nitrojeni kwa ufanisi bora
- Zingatia vyanzo vya kikaboni kama samadi
- Fuata viwango vilivyopendekezwa kuepuka uharibifu wa mazingira`,
    },
  },
  {
    id: 'best-practices',
    title: { en: 'Farming Best Practices', sw: 'Mbinu Bora za Kilimo' },
    category: 'practices',
    icon: '🌱',
    content: {
      en: `## Farming Best Practices for Maize and Beans

### Soil Management
1. **Regular Soil Testing**: Test soil every 2-3 years for pH and nutrients
2. **Maintain Soil pH**: Keep pH between 6.0-7.0 for optimal nutrient availability
3. **Add Organic Matter**: Incorporate compost, manure, and crop residues
4. **Prevent Erosion**: Use contour plowing, terracing, and cover crops
5. **Avoid Compaction**: Minimize heavy machinery on wet soils

### Crop Management
1. **Crop Rotation**: Rotate maize with legumes (beans, soybeans, groundnuts)
2. **Intercropping**: Grow maize and beans together for mutual benefits
3. **Proper Spacing**: Follow recommended plant spacing (75cm x 25cm for maize)
4. **Timely Planting**: Plant at the onset of reliable rains
5. **Weed Control**: Keep fields weed-free especially during first 6-8 weeks

### Water Management
1. **Adequate Irrigation**: Maize needs 500-800mm of water per season
2. **Critical Stages**: Ensure water during flowering and grain filling
3. **Drainage**: Prevent waterlogging in heavy soils
4. **Mulching**: Conserve soil moisture with organic mulch
5. **Water Harvesting**: Collect rainwater for supplemental irrigation

### Pest and Disease Management
1. **Regular Scouting**: Inspect fields weekly for pests and diseases
2. **Integrated Pest Management**: Combine biological, cultural, and chemical controls
3. **Resistant Varieties**: Use disease-resistant seed varieties
4. **Proper Storage**: Store harvested grain in clean, dry conditions
5. **Sanitation**: Remove infected plant material from fields

### Harvest and Post-Harvest
1. **Timely Harvesting**: Harvest maize at 20-25% moisture content
2. **Proper Drying**: Dry grain to 13-14% moisture for safe storage
3. **Clean Storage**: Use hermetic bags or treated storage facilities
4. **Record Keeping**: Maintain records of inputs, yields, and observations
5. **Market Research**: Understand market demands and price trends`,
      sw: `## Mbinu Bora za Kilimo kwa Mahindi na Maharagwe

### Usimamizi wa Udongo
1. **Uchunguzi wa Udongo Mara kwa Mara**: Chunguza udongo kila baada ya miaka 2-3
2. **Dumisha pH ya Udongo**: Weka pH kati ya 6.0-7.0 kwa upatikanaji bora wa madini
3. **Ongeza Vitu vya Kikaboni**: Changanya samadi na mabaki ya mazao
4. **Zuia Mmomonyoko**: Tumia kulima kwa kufuata kontua na mazao ya kufunika ardhi
5. **Epuka Kugandamiza**: Punguza mitambo mizito kwenye udongo wenye maji

### Usimamizi wa Mazao
1. **Mzunguko wa Mazao**: Zungusha mahindi na mikunde (maharagwe, soya, njugu)
2. **Kuchanganya Mazao**: Lima mahindi na maharagwe pamoja kwa faida za pande zote
3. **Nafasi Sahihi**: Fuata nafasi iliyopendekezwa (sentimita 75 x 25 kwa mahindi)
4. **Kupanda kwa Wakati**: Panda mwanzoni mwa mvua za uhakika
5. **Udhibiti wa Magugu**: Weka mashamba bila magugu hasa wiki 6-8 za kwanza

### Usimamizi wa Maji
1. **Umwagiliaji wa Kutosha**: Mahindi yanahitaji milimita 500-800 za maji kwa msimu
2. **Hatua Muhimu**: Hakikisha maji wakati wa kuchanua na kujaza nafaka
3. **Mifereji**: Zuia kujaa maji kwenye udongo mzito
4. **Kufunika Udongo**: Hifadhi unyevu wa udongo kwa matandazo ya kikaboni
5. **Kuvuna Maji**: Kusanya maji ya mvua kwa umwagiliaji wa ziada

### Usimamizi wa Wadudu na Magonjwa
1. **Upelelezi wa Mara kwa Mara**: Kagua mashamba kila wiki
2. **Usimamizi Jumuishi**: Changanya udhibiti wa kibiolojia, kitamaduni na kemikali
3. **Aina Zinazostahimili**: Tumia aina za mbegu zinazostahimili magonjwa
4. **Uhifadhi Sahihi**: Hifadhi nafaka zilizovunwa katika hali safi na kavu
5. **Usafi**: Ondoa mimea iliyoathirika na magonjwa shambani

### Uvunaji na Baada ya Uvunaji
1. **Uvunaji kwa Wakati**: Vuna mahindi yakiwa na unyevu wa 20-25%
2. **Kukausha Vizuri**: Kausha nafaka hadi unyevu wa 13-14%
3. **Uhifadhi Safi**: Tumia mifuko isiyopitisha hewa au ghala zilizotibiwa
4. **Utunzaji wa Kumbukumbu**: Weka kumbukumbu za pembejeo, mavuno na uchunguzi
5. **Utafiti wa Soko**: Elewa mahitaji ya soko na mwenendo wa bei`,
    },
  },
  {
    id: 'beans-n-deficiency',
    title: { en: 'Nitrogen Deficiency in Beans', sw: 'Upungufu wa Nitrojeni kwenye Maharagwe' },
    category: 'beans',
    icon: '🫘',
    content: {
      en: `## Nitrogen Deficiency in Beans

Beans are legumes and can fix atmospheric nitrogen through symbiosis with Rhizobium bacteria. However, nitrogen deficiency can still occur.

### Symptoms
- Uniform yellowing of older leaves
- Stunted growth
- Poor pod development
- Reduced nodulation on roots
- Premature leaf drop
- Light green overall plant color

### Causes
- Poor or absent Rhizobium nodulation
- Very low soil nitrogen at planting
- Acidic soils (pH below 5.5)
- Compacted or waterlogged soils
- Nutrient imbalances (especially molybdenum and iron)

### Management
1. Inoculate seeds with appropriate Rhizobium strain before planting
2. Apply starter nitrogen (20-30 kg/ha) if nodules are absent
3. Maintain soil pH between 6.0-7.0
4. Ensure good soil aeration
5. Avoid excessive nitrogen which inhibits nodulation`,
      sw: `## Upungufu wa Nitrojeni kwenye Maharagwe

Maharagwe ni mikunde na yanaweza kutengeneza nitrojeni ya anga kupitia ushirikiano na bakteria wa Rhizobium. Hata hivyo, upungufu wa nitrojeni bado unaweza kutokea.

### Dalili
- Kugeuka njano kwa usawa kwa majani makubwa
- Ukuaji duni
- Ukuzaji hafifu wa maganda
- Vinundu vichache kwenye mizizi
- Kuanguka mapema kwa majani
- Rangi ya mmea kuwa kijani hafifu

### Visababishi
- Vinundu duni au visivyopo vya Rhizobium
- Nitrojeni ya chini sana kwenye udongo wakati wa kupanda
- Udongo wenye asidi (pH chini ya 5.5)
- Udongo uliogandamizwa au uliojaa maji
- Ukosefu wa usawa wa madini (hasa molybdenum na chuma)

### Usimamizi
1. Paka mbegu dawa ya Rhizobium inayofaa kabla ya kupanda
2. Weka nitrojeni ya kuanzishia (kilo 20-30 kwa hekta) kama vinundu havipo
3. Dumisha pH ya udongo kati ya 6.0-7.0
4. Hakikisha hewa ya kutosha kwenye udongo
5. Epuka nitrojeni nyingi inayozuia utengenezaji wa vinundu`,
    },
  },
];

export function getArticlesByCategory(category: 'maize' | 'beans' | 'fertilizer' | 'practices'): EducationArticle[] {
  return educationArticles.filter(a => a.category === category);
}
