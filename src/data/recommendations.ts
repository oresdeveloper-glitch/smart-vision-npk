export interface Recommendation {
  deficiency: 'nitrogen' | 'phosphorus' | 'potassium' | 'healthy';
  cropType: 'maize' | 'beans';
  fertilizers: { en: string[]; sw: string[] };
  treatmentSteps: { en: string[]; sw: string[] };
  preventionMeasures: { en: string[]; sw: string[] };
  farmingTips: { en: string[]; sw: string[] };
}

export const recommendationData: Recommendation[] = [
  {
    deficiency: 'nitrogen',
    cropType: 'maize',
    fertilizers: {
      en: [
        'Urea (46-0-0) – Apply 100-150 kg/ha',
        'NPK 23-10-5 – Apply 200 kg/ha',
        'Ammonium Nitrate (34-0-0) – Apply 120 kg/ha',
        'Composted manure – Apply 5-10 tons/ha',
      ],
      sw: [
        'Urea (46-0-0) – Weka kilo 100-150 kwa hekta',
        'NPK 23-10-5 – Weka kilo 200 kwa hekta',
        'Nitrati ya Amonia (34-0-0) – Weka kilo 120 kwa hekta',
        'Samadi iliyooza – Weka tani 5-10 kwa hekta',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply nitrogen-rich fertilizer immediately',
        'Water the crop adequately after fertilizer application',
        'Apply split doses: half at planting, half at knee-height stage',
        'Consider foliar spray of urea solution (2-3%) for quick recovery',
        'Monitor leaf color change over the next 7-14 days',
      ],
      sw: [
        'Weka mbolea yenye nitrojeni mara moja',
        'Mwagilia mazao vizuri baada ya kuweka mbolea',
        'Weka dozi zilizogawanywa: nusu wakati wa kupanda, nusu kwenye hatua ya magoti',
        'Zingatia kunyunyizia myeyusho wa urea (2-3%) kwa uponaji wa haraka',
        'Fuatilia mabadiliko ya rangi ya jani kwa siku 7-14 zijazo',
      ],
    },
    preventionMeasures: {
      en: [
        'Practice crop rotation with legumes',
        'Apply organic matter regularly',
        'Use cover crops during off-season',
        'Conduct soil tests before planting',
        'Apply basal fertilizer at planting time',
      ],
      sw: [
        'Zingatia mzunguko wa mazao na mikunde',
        'Weka mbolea ya kikaboni mara kwa mara',
        'Tumia mazao ya kufunika ardhi nje ya msimu',
        'Fanya uchunguzi wa udongo kabla ya kupanda',
        'Weka mbolea ya msingi wakati wa kupanda',
      ],
    },
    farmingTips: {
      en: [
        'Nitrogen is essential for chlorophyll and leaf growth',
        'Yellowing of older leaves first indicates nitrogen deficiency',
        'Maize needs most nitrogen during rapid growth stages',
        'Avoid applying nitrogen during heavy rain to prevent leaching',
      ],
      sw: [
        'Nitrojeni ni muhimu kwa klorofili na ukuaji wa majani',
        'Kugeuka njano kwa majani makubwa kunaonyesha upungufu wa nitrojeni',
        'Mahindi yanahitaji nitrojeni zaidi wakati wa hatua za ukuaji wa haraka',
        'Epuka kuweka nitrojeni wakati wa mvua kubwa kuzuia kusombwa',
      ],
    },
  },
  {
    deficiency: 'phosphorus',
    cropType: 'maize',
    fertilizers: {
      en: [
        'DAP (Diammonium Phosphate 18-46-0) – Apply 100-150 kg/ha',
        'TSP (Triple Super Phosphate 0-46-0) – Apply 80-120 kg/ha',
        'SSP (Single Super Phosphate 0-20-0) – Apply 200-250 kg/ha',
        'Rock phosphate – Apply 300-500 kg/ha',
      ],
      sw: [
        'DAP (Fosfati ya Diamonia 18-46-0) – Weka kilo 100-150 kwa hekta',
        'TSP (Fosfati ya Super Triple 0-46-0) – Weka kilo 80-120 kwa hekta',
        'SSP (Fosfati ya Super Moja 0-20-0) – Weka kilo 200-250 kwa hekta',
        'Fosfati ya mwamba – Weka kilo 300-500 kwa hekta',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply phosphorus fertilizer near the root zone',
        'Ensure adequate soil moisture for phosphorus uptake',
        'Phosphorus is immobile in soil, so place it where roots can access',
        'Combine with organic matter to improve phosphorus availability',
        'Consider mycorrhizal inoculants to enhance phosphorus absorption',
      ],
      sw: [
        'Weka mbolea ya fosforasi karibu na eneo la mizizi',
        'Hakikisha unyevu wa kutosha wa udongo kwa ufyonzaji wa fosforasi',
        'Fosforasi haitembei kwenye udongo, hivyo iweke mahali mizizi inaweza kufikia',
        'Changanya na vitu vya kikaboni kuboresha upatikanaji wa fosforasi',
        'Zingatia dawa za mycorrhizal kuongeza ufyonzaji wa fosforasi',
      ],
    },
    preventionMeasures: {
      en: [
        'Apply phosphorus at planting as it supports root development',
        'Maintain soil pH between 6.0-7.0 for optimal phosphorus availability',
        'Use phosphorus-efficient crop varieties',
        'Incorporate crop residues to recycle phosphorus',
        'Avoid soil erosion which removes phosphorus-rich topsoil',
      ],
      sw: [
        'Weka fosforasi wakati wa kupanda kwani inasaidia ukuzaji wa mizizi',
        'Dumisha pH ya udongo kati ya 6.0-7.0 kwa upatikanaji bora wa fosforasi',
        'Tumia aina za mazao zinazotumia fosforasi kwa ufanisi',
        'Changanya mabaki ya mazao kusambaza tena fosforasi',
        'Epuka mmomonyoko wa udongo unaoondoa tabaka la juu lenye fosforasi',
      ],
    },
    farmingTips: {
      en: [
        'Phosphorus is crucial for energy transfer and root development',
        'Purple or reddish leaves indicate phosphorus deficiency',
        'Cold soils reduce phosphorus availability',
        'Phosphorus deficiency early in the season severely impacts yield',
      ],
      sw: [
        'Fosforasi ni muhimu kwa uhamishaji wa nishati na ukuzaji wa mizizi',
        'Majani ya zambarau au mekundu yanaonyesha upungufu wa fosforasi',
        'Udongo baridi hupunguza upatikanaji wa fosforasi',
        'Upungufu wa fosforasi mapema msimu unaathiri sana mavuno',
      ],
    },
  },
  {
    deficiency: 'potassium',
    cropType: 'maize',
    fertilizers: {
      en: [
        'MOP (Muriate of Potash 0-0-60) – Apply 80-120 kg/ha',
        'NPK 15-15-15 – Apply 200-300 kg/ha',
        'Potassium Sulfate (0-0-50) – Apply 100-150 kg/ha',
        'Wood ash – Apply 200-400 kg/ha',
      ],
      sw: [
        'MOP (Muriate ya Potashi 0-0-60) – Weka kilo 80-120 kwa hekta',
        'NPK 15-15-15 – Weka kilo 200-300 kwa hekta',
        'Sulfati ya Potasiamu (0-0-50) – Weka kilo 100-150 kwa hekta',
        'Majivu ya kuni – Weka kilo 200-400 kwa hekta',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply potassium fertilizer as a top-dress during vegetative growth',
        'Water adequately to facilitate potassium uptake',
        'Split applications for sandy soils to prevent leaching',
        'Apply near the root zone for best absorption',
        'Monitor for improved stalk strength and disease resistance',
      ],
      sw: [
        'Weka mbolea ya potasiamu kama mbolea ya juu wakati wa ukuaji',
        'Mwagilia vizuri kuwezesha ufyonzaji wa potasiamu',
        'Gawanya maombi kwa udongo wa mchanga kuzuia kusombwa',
        'Weka karibu na eneo la mizizi kwa ufyonzaji bora',
        'Fuatilia uboreshaji wa nguvu ya shina na upinzani wa magonjwa',
      ],
    },
    preventionMeasures: {
      en: [
        'Return crop residues to the field to recycle potassium',
        'Use balanced NPK fertilizers according to soil test recommendations',
        'Avoid removing all crop biomass from the field',
        'Maintain adequate soil organic matter',
        'Monitor for potassium deficiency symptoms regularly',
      ],
      sw: [
        'Rudisha mabaki ya mazao shambani kusambaza tena potasiamu',
        'Tumia mbolea za NPK zilizosawazishwa kulingana na ushauri wa uchunguzi wa udongo',
        'Epuka kuondoa mabaki yote ya mazao shambani',
        'Dumisha vitu vya kikaboni vya kutosha kwenye udongo',
        'Fuatilia dalili za upungufu wa potasiamu mara kwa mara',
      ],
    },
    farmingTips: {
      en: [
        'Potassium regulates water use and strengthens plant stalks',
        'Yellowing/browning along leaf edges indicates potassium deficiency',
        'Potassium improves drought tolerance and disease resistance',
        'Sandy soils are more prone to potassium deficiency',
      ],
      sw: [
        'Potasiamu inasimamia matumizi ya maji na kuimarisha shina za mimea',
        'Kugeuka njano/kahawia pembezoni mwa jani kunaonyesha upungufu wa potasiamu',
        'Potasiamu inaboresha uvumilivu wa ukame na upinzani wa magonjwa',
        'Udongo wa mchanga una uwezekano mkubwa wa upungufu wa potasiamu',
      ],
    },
  },
  {
    deficiency: 'nitrogen',
    cropType: 'beans',
    fertilizers: {
      en: [
        'Urea (46-0-0) – Apply 50-80 kg/ha (beans need less N due to nitrogen fixation)',
        'NPK 10-20-10 – Apply 150 kg/ha',
        'Composted manure – Apply 5-8 tons/ha',
        'Rhizobium inoculant to boost natural nitrogen fixation',
      ],
      sw: [
        'Urea (46-0-0) – Weka kilo 50-80 kwa hekta (maharagwe yanahitaji N kidogo)',
        'NPK 10-20-10 – Weka kilo 150 kwa hekta',
        'Samadi iliyooza – Weka tani 5-8 kwa hekta',
        'Chanjo ya Rhizobium kuongeza utengenezaji wa nitrojeni asilia',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply nitrogen fertilizer sparingly as beans fix their own nitrogen',
        'Ensure good nodulation by checking root nodules',
        'If nodules are absent, apply starter nitrogen (20-30 kg/ha)',
        'Water adequately to support nitrogen fixation process',
        'Monitor leaf color improvement over 10-14 days',
      ],
      sw: [
        'Weka mbolea ya nitrojeni kwa kiasi kwani maharagwe yanatengeneza nitrojeni yake',
        'Hakikisha vinundu vizuri kwa kukagua vinundu vya mizizi',
        'Kama vinundu havipo, weka nitrojeni ya kuanzishia (kilo 20-30 kwa hekta)',
        'Mwagilia vizuri kusaidia mchakato wa utengenezaji wa nitrojeni',
        'Fuatilia uboreshaji wa rangi ya majani kwa siku 10-14',
      ],
    },
    preventionMeasures: {
      en: [
        'Inoculate seeds with Rhizobium before planting',
        'Maintain soil pH between 6.0-7.0 for optimal nitrogen fixation',
        'Avoid excessive nitrogen which inhibits nodulation',
        'Practice crop rotation with cereals',
        'Ensure good soil aeration for root health',
      ],
      sw: [
        'Paka mbegu dawa ya Rhizobium kabla ya kupanda',
        'Dumisha pH ya udongo kati ya 6.0-7.0 kwa utengenezaji bora wa nitrojeni',
        'Epuka nitrojeni nyingi inayozuia utengenezaji wa vinundu',
        'Zingatia mzunguko wa mazao na nafaka',
        'Hakikisha hewa ya kutosha kwenye udongo kwa afya ya mizizi',
      ],
    },
    farmingTips: {
      en: [
        'Beans can fix 50-100 kg N/ha through symbiotic nitrogen fixation',
        'Well-nodulated beans rarely show nitrogen deficiency',
        'Inoculation is most important in fields without recent legume history',
        'Intercropping beans with maize improves soil nitrogen for both crops',
      ],
      sw: [
        'Maharagwe yanaweza kutengeneza kilo 50-100 N kwa hekta kwa utengenezaji asilia',
        'Maharagwe yenye vinundu vizuri hayaonyeshi upungufu wa nitrojeni',
        'Chanjo ni muhimu zaidi kwenye mashamba bila historia ya mikunde',
        'Kuchanganya maharagwe na mahindi kunaboresha nitrojeni ya udongo kwa mazao yote',
      ],
    },
  },
  {
    deficiency: 'phosphorus',
    cropType: 'beans',
    fertilizers: {
      en: [
        'DAP (18-46-0) – Apply 80-120 kg/ha',
        'TSP (0-46-0) – Apply 60-100 kg/ha',
        'NPK 10-20-10 – Apply 150-200 kg/ha',
        'Bone meal – Apply 200-300 kg/ha',
      ],
      sw: [
        'DAP (18-46-0) – Weka kilo 80-120 kwa hekta',
        'TSP (0-46-0) – Weka kilo 60-100 kwa hekta',
        'NPK 10-20-10 – Weka kilo 150-200 kwa hekta',
        'Unga wa mifupa – Weka kilo 200-300 kwa hekta',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply phosphorus fertilizer at planting in the root zone',
        'Phosphorus is critical for bean pod development',
        'Ensure soil pH is 6.0-7.0 for maximum phosphorus availability',
        'Apply as band placement rather than broadcasting',
        'Water after application to help dissolve and move phosphorus',
      ],
      sw: [
        'Weka mbolea ya fosforasi wakati wa kupanda kwenye eneo la mizizi',
        'Fosforasi ni muhimu kwa ukuzaji wa maganda ya maharagwe',
        'Hakikisha pH ya udongo ni 6.0-7.0 kwa upatikanaji bora wa fosforasi',
        'Weka kwa njia ya mkanda badala ya kutapanya',
        'Mwagilia baada ya kuweka ili kusaidia kuyeyusha na kusogeza fosforasi',
      ],
    },
    preventionMeasures: {
      en: [
        'Apply phosphorus before or at planting',
        'Use phosphorus-efficient bean varieties',
        'Maintain optimal soil pH',
        'Add organic matter to improve phosphorus cycling',
        'Avoid compaction to allow root exploration',
      ],
      sw: [
        'Weka fosforasi kabla au wakati wa kupanda',
        'Tumia aina za maharagwe zinazotumia fosforasi kwa ufanisi',
        'Dumisha pH bora ya udongo',
        'Ongeza vitu vya kikaboni kuboresha mzunguko wa fosforasi',
        'Epuka kugandamiza udongo kuruhusu mizizi kuchungulia',
      ],
    },
    farmingTips: {
      en: [
        'Phosphorus is vital for flowering and pod formation in beans',
        'Dark green or purple-tinged leaves may indicate phosphorus deficiency',
        'Bean roots exude organic acids that help mobilize soil phosphorus',
        'Phosphorus deficiency reduces nodulation and nitrogen fixation',
      ],
      sw: [
        'Fosforasi ni muhimu kwa kuchanua na kutengeneza maganda ya maharagwe',
        'Majani ya kijani iliyokolea au yenye rangi ya zambarau yanaonyesha upungufu',
        'Mizizi ya maharagwe inatoa asidi za kikaboni zinazosaidia kupata fosforasi',
        'Upungufu wa fosforasi unapunguza vinundu na utengenezaji wa nitrojeni',
      ],
    },
  },
  {
    deficiency: 'potassium',
    cropType: 'beans',
    fertilizers: {
      en: [
        'MOP (0-0-60) – Apply 60-100 kg/ha',
        'NPK 10-10-20 – Apply 150-200 kg/ha',
        'Potassium Sulfate (0-0-50) – Apply 80-120 kg/ha',
        'Wood ash – Apply 150-300 kg/ha',
      ],
      sw: [
        'MOP (0-0-60) – Weka kilo 60-100 kwa hekta',
        'NPK 10-10-20 – Weka kilo 150-200 kwa hekta',
        'Sulfati ya Potasiamu (0-0-50) – Weka kilo 80-120 kwa hekta',
        'Majivu ya kuni – Weka kilo 150-300 kwa hekta',
      ],
    },
    treatmentSteps: {
      en: [
        'Apply potassium fertilizer as a side-dress during early growth',
        'Potassium improves bean quality and pod filling',
        'Split application: half at planting, half at flowering',
        'Ensure adequate moisture for potassium uptake',
        'Monitor pod development for improvement',
      ],
      sw: [
        'Weka mbolea ya potasiamu kando wakati wa ukuaji wa mapema',
        'Potasiamu inaboresha ubora wa maharagwe na ujazaji wa maganda',
        'Gawanya: nusu wakati wa kupanda, nusu wakati wa kuchanua',
        'Hakikisha unyevu wa kutosha kwa ufyonzaji wa potasiamu',
        'Fuatilia ukuzaji wa maganda kwa uboreshaji',
      ],
    },
    preventionMeasures: {
      en: [
        'Apply potassium based on soil test results',
        'Return crop residues to recycle potassium',
        'Use balanced fertilization program',
        'Avoid excessive removal of crop biomass',
        'Monitor for deficiency symptoms during pod filling',
      ],
      sw: [
        'Weka potasiamu kulingana na matokeo ya uchunguzi wa udongo',
        'Rudisha mabaki ya mazao kusambaza tena potasiamu',
        'Tumia mpango wa mbolea uliosawazishwa',
        'Epuka kuondoa mabaki mengi ya mazao',
        'Fuatilia dalili za upungufu wakati wa kujaza maganda',
      ],
    },
    farmingTips: {
      en: [
        'Potassium is essential for protein synthesis in beans',
        'Leaf margin scorching indicates potassium deficiency',
        'Potassium improves bean drought tolerance',
        'Beans remove significant potassium from soil (30-40 kg K per ton of grain)',
      ],
      sw: [
        'Potasiamu ni muhimu kwa utengenezaji wa protini kwenye maharagwe',
        'Kuungua kwa pembe za jani kunaonyesha upungufu wa potasiamu',
        'Potasiamu inaboresha uvumilivu wa ukame wa maharagwe',
        'Maharagwe yanaondoa potasiamu nyingi kwenye udongo (kilo 30-40 K kwa tani ya nafaka)',
      ],
    },
  },
  {
    deficiency: 'healthy',
    cropType: 'maize',
    fertilizers: {
      en: [
        'Maintain with balanced NPK fertilizer (e.g., 15-15-15)',
        'Apply compost to maintain soil organic matter',
        'Continue regular soil testing schedule',
      ],
      sw: [
        'Dumisha kwa mbolea ya NPK iliyosawazishwa (mf. 15-15-15)',
        'Weka samadi kudumisha vitu vya kikaboni vya udongo',
        'Endelea na ratiba ya uchunguzi wa udongo mara kwa mara',
      ],
    },
    treatmentSteps: {
      en: ['No treatment needed – your crop is healthy!', 'Continue monitoring leaf health weekly.', 'Maintain current fertilizer program.'],
      sw: ['Hakuna tiba inayohitajika – zao lako lina afya!', 'Endelea kufuatilia afya ya majani kila wiki.', 'Dumisha mpango wa sasa wa mbolea.'],
    },
    preventionMeasures: {
      en: ['Regular soil testing', 'Balanced fertilization', 'Crop rotation', 'Proper irrigation management'],
      sw: ['Uchunguzi wa udongo mara kwa mara', 'Mbolea iliyosawazishwa', 'Mzunguko wa mazao', 'Usimamizi sahihi wa umwagiliaji'],
    },
    farmingTips: {
      en: ['Healthy plants have deep green leaves', 'Prevention is better than cure', 'Regular monitoring ensures early detection'],
      sw: ['Mimea yenye afya ina majani ya kijani iliyokolea', 'Kinga ni bora kuliko tiba', 'Ufuatiliaji wa mara kwa mara unahakikisha ugunduzi wa mapema'],
    },
  },
  {
    deficiency: 'healthy',
    cropType: 'beans',
    fertilizers: {
      en: [
        'Maintain with NPK 10-20-10 for continued pod production',
        'Apply compost to maintain soil health',
        'Continue Rhizobium inoculation for new plantings',
      ],
      sw: [
        'Dumisha kwa NPK 10-20-10 kwa uzalishaji endelevu wa maganda',
        'Weka samadi kudumisha afya ya udongo',
        'Endelea na chanjo ya Rhizobium kwa upandaji mpya',
      ],
    },
    treatmentSteps: {
      en: ['No treatment needed – your beans are healthy!', 'Continue monitoring pod development.', 'Maintain current fertilizer and irrigation program.'],
      sw: ['Hakuna tiba inayohitajika – maharagwe yako yana afya!', 'Endelea kufuatilia ukuzaji wa maganda.', 'Dumisha mpango wa sasa wa mbolea na umwagiliaji.'],
    },
    preventionMeasures: {
      en: ['Regular soil testing', 'Balanced fertilization', 'Crop rotation with cereals', 'Proper Rhizobium inoculation'],
      sw: ['Uchunguzi wa udongo mara kwa mara', 'Mbolea iliyosawazishwa', 'Mzunguko wa mazao na nafaka', 'Chanjo sahihi ya Rhizobium'],
    },
    farmingTips: {
      en: ['Healthy bean plants have vibrant green leaves and good pod set', 'Intercropping with maize can improve overall soil health', 'Regular scouting prevents pest and disease outbreaks'],
      sw: ['Mimea ya maharagwe yenye afya ina majani ya kijani na maganda mazuri', 'Kuchanganya na mahindi kunaweza kuboresha afya ya udongo', 'Upelelezi wa mara kwa mara unazuia milipuko ya wadudu na magonjwa'],
    },
  },
];

export function getRecommendation(deficiency: 'nitrogen' | 'phosphorus' | 'potassium' | 'healthy', cropType: 'maize' | 'beans'): Recommendation | undefined {
  return recommendationData.find(r => r.deficiency === deficiency && r.cropType === cropType);
}
