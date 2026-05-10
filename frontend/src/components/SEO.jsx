import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name, type }) {
  const siteName = "Cabuyao CHO-I Telehealth";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDesc = "Access teleconsultations, digital prescriptions, and secure health records seamlessly through the Cabuyao City Health Office Portal.";

  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{fullTitle}</title>
      <meta name='description' content={description || defaultDesc} />
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
