import { Language } from '../data/translations';

// Pre-recorded announcements for results (Tanzanian Swahili + English tones)
const ANNOUNCEMENTS: Record<Language, Record<string, string[]>> = {
  en: {
    nitrogen: [
      'Nitrogen deficiency detected. Your crop needs nitrogen-rich fertilizer like Urea.',
      'Analysis complete. Nitrogen deficiency found. Apply urea or NPK fertilizer soon.',
      'The leaf shows signs of nitrogen deficiency. I recommend applying nitrogen fertilizer.',
    ],
    phosphorus: [
      'Phosphorus deficiency detected. Apply DAP fertilizer near the root zone.',
      'Analysis shows phosphorus deficiency. Use DAP or TSP fertilizer for best results.',
      'Your crop lacks phosphorus. I recommend applying phosphate fertilizer immediately.',
    ],
    potassium: [
      'Potassium deficiency detected. Apply MOP or wood ash to your field.',
      'The analysis reveals potassium deficiency. Use potash fertilizer for recovery.',
      'Potassium deficiency found. Apply potassium sulfate or wood ash to improve crop health.',
    ],
    healthy: [
      'Congratulations! Your leaf appears healthy. No deficiency detected. Keep up the good work!',
      'Great news! The analysis shows your crop is healthy and well-nourished.',
      'Your plant looks excellent. No nutrient deficiencies were found. Continue your good farming practices.',
    ],
    analyzing: [
      'Analyzing your leaf image. Please wait a moment.',
      'Processing your leaf scan. Our AI is examining the image now.',
      'Scanning in progress. Results will be ready shortly.',
    ],
    welcome: [
      'Welcome to Smart Vision NPK. Your AI-powered crop health assistant.',
      'Karibu! Welcome to Smart Vision NPK deficiency detection system.',
    ],
  },
  sw: {
    nitrogen: [
      'Upungufu wa nitrojeni umegunduliwa. Tumia mbolea yenye nitrojeni kama Urea.',
      'Uchambuzi umekamilika. Upungufu wa nitrojeni umegunduliwa. Weka mbolea ya Urea au NPK.',
      'Jani linaonyesha dalili za upungufu wa nitrojeni. Napendekeza uweke mbolea ya nitrojeni.',
    ],
    phosphorus: [
      'Upungufu wa fosforasi umegunduliwa. Weka mbolea ya DAP karibu na mizizi.',
      'Uchambuzi unaonyesha upungufu wa fosforasi. Tumia mbolea ya DAP au TSP.',
      'Zao lako linakosa fosforasi. Napendekeza uweke mbolea ya fosfati mara moja.',
    ],
    potassium: [
      'Upungufu wa potasiamu umegunduliwa. Weka MOP au majivu ya kuni shambani.',
      'Uchambuzi unaonyesha upungufu wa potasiamu. Tumia mbolea ya potashi.',
      'Upungufu wa potasiamu umegunduliwa. Weka sulfati ya potasiamu au majivu ya kuni.',
    ],
    healthy: [
      'Hongera! Jani lako lina afya. Hakuna upungufu uliogunduliwa. Endelea na kazi nzuri!',
      'Habari njema! Uchambuzi unaonyesha zao lako lina afya na lishe bora.',
      'Mmea wako unaonekana bora. Hakuna upungufu wa madini uliogunduliwa. Endelea na mbinu zako nzuri za kilimo.',
    ],
    analyzing: [
      'Inachambua picha ya jani lako. Tafadhali subiri kidogo.',
      'Inachakata uchunguzi wa jani lako. AI yetu inachunguza picha sasa.',
      'Uchunguzi unaendelea. Matokeo yatakuwa tayari hivi karibuni.',
    ],
    welcome: [
      'Karibu kwenye Smart Vision NPK. Msaidizi wako wa afya ya mazao kwa AI.',
      'Karibu! Welcome to Smart Vision NPK.',
    ],
  },
};

function getRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Check if Web Speech API is available
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Get best voice for Tanzanian accent (prefer Swahili-capable or African-accented English)
export function getBestVoice(language: Language): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (language === 'sw') {
    // Try to find Swahili voice
    const swVoice = voices.find(v =>
      v.lang.startsWith('sw') ||
      v.name.toLowerCase().includes('swahili') ||
      v.lang === 'sw-KE' ||
      v.lang === 'sw-TZ'
    );
    if (swVoice) return swVoice;

    // Fallback: find an African English voice
    const africanVoice = voices.find(v =>
      v.lang.startsWith('en-KE') ||
      v.lang.startsWith('en-TZ') ||
      v.lang.startsWith('en-ZA') ||
      v.lang.startsWith('en-NG') ||
      v.lang.startsWith('en-GH')
    );
    if (africanVoice) return africanVoice;
  }

  if (language === 'en') {
    // For English, prefer African-accented English for Tanzanian feel
    const africanEn = voices.find(v =>
      v.lang.startsWith('en-KE') ||
      v.lang.startsWith('en-TZ') ||
      v.lang.startsWith('en-ZA') ||
      v.lang.startsWith('en-NG')
    );
    if (africanEn) return africanEn;

    // Fallback to UK English (closer to East African English)
    const ukVoice = voices.find(v => v.lang.startsWith('en-GB'));
    if (ukVoice) return ukVoice;
  }

  // Final fallback: any English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

// Speak text with appropriate voice and tone
export function speak(text: string, language: Language): Promise<void> {
  if (!isSpeechSupported()) return Promise.resolve();

  return new Promise((resolve) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Warm, friendly Tanzanian-sounding tone
    const voice = getBestVoice(language);
    if (voice) utterance.voice = voice;

    utterance.lang = language === 'sw' ? 'sw-TZ' : 'en-TZ';
    utterance.rate = 0.88;  // Slightly slower, warm and clear
    utterance.pitch = 0.95;  // Slightly lower, authoritative but friendly
    utterance.volume = 1.0;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    // Small delay for natural feel
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 250);
  });
}

// Announce a specific result
export async function announceResult(
  deficiency: string,
  language: Language
): Promise<void> {
  const announcements = ANNOUNCEMENTS[language]?.[deficiency];
  if (!announcements) return;

  const message = getRandom(announcements);
  await speak(message, language);
}

// Announce analysis starting
export async function announceAnalyzing(language: Language): Promise<void> {
  const announcements = ANNOUNCEMENTS[language]?.analyzing;
  if (!announcements) return;
  await speak(getRandom(announcements), language);
}

// Announce welcome
export async function announceWelcome(language: Language): Promise<void> {
  const announcements = ANNOUNCEMENTS[language]?.welcome;
  if (!announcements) return;
  await speak(getRandom(announcements), language);
}

// Stop all speech
export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
}

// Toggle voice announcements setting
export function getVoiceEnabled(): boolean {
  return localStorage.getItem('npk_voice_enabled') !== 'false';
}

export function setVoiceEnabled(enabled: boolean): void {
  localStorage.setItem('npk_voice_enabled', String(enabled));
  if (!enabled) stopSpeaking();
}
