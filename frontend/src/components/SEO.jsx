import { Helmet } from 'react-helmet-async';

const titleToEmoji = {
  'overview': '📊',
  'dashboard': '📊',
  'analytics': '📈',
  'report': '📈',
  'history': '🕒',
  'room': '💻',
  'consultation': '🩺',
  'telehealth': '💻',
  'patient record': '📋',
  'medical record': '📂',
  'manage user': '👥',
  'user': '👥',
  'prescription': '💊',
  'medicine': '📦',
  'inventory': '📦',
  'vital sign': '❤️',
  'vital': '❤️',
  'medical image': '🖼️',
  'image': '🖼️',
  'setting': '⚙️',
  'profile': '👤',
  'notification': '🔔',
  'add record': '📝',
  'walk-in': '🏥',
  'onboarding': '👋',
  'login': '🔐',
  'register': '📝',
  'home': '🏥',
  'activity': '🛡️',
  'log': '📜',
};

export default function SEO({ title, description, name, type }) {
  const siteName = "Cabuyao CHO-I Telehealth";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDesc = "Access teleconsultations, digital prescriptions, and secure health records seamlessly through the Cabuyao City Health Office Portal.";

  // Dynamically find a matching emoji based on the title string
  let emojiIcon = null;
  if (title) {
    const lowerTitle = title.toLowerCase();
    const matchedKey = Object.keys(titleToEmoji).find(key => lowerTitle.includes(key));
    if (matchedKey) {
      emojiIcon = titleToEmoji[matchedKey];
    }
  }

  // Create a fully encoded SVG data URI if an emoji was found, otherwise use the default logo
  const svgString = emojiIcon ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emojiIcon}</text></svg>` : '';
  const faviconHref = emojiIcon 
    ? `data:image/svg+xml,${encodeURIComponent(svgString)}`
    : '/cho1-logo.png';

  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{fullTitle}</title>
      <meta name='description' content={description || defaultDesc} />
      
      { /* Dynamic Favicon */ }
      <link rel="icon" type={emojiIcon ? "image/svg+xml" : "image/png"} href={faviconHref} />
      
      { /* End standard metadata tags */ }
      
      { /* OpenGraph tags */ }
      <meta property="og:type" content={type || "website"} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:site_name" content={siteName} />
      { /* End OpenGraph tags */ }
      
      { /* Twitter tags */ }
      <meta name="twitter:creator" content={name || siteName} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDesc} />
      { /* End Twitter tags */ }
    </Helmet>
  );
}
