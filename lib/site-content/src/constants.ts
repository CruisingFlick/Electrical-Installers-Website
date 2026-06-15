export const BUSINESS_NAME = "Electrical Installers";
export const LEGAL_NAME = "Design Quote Electrical Pty Ltd";
export const REC_NUMBER = "REC 25510";
export const ABN = "35 608 171 802";

export const BUSINESS_PHONE = "0419 868 703";
export const BUSINESS_PHONE_E164 = "+61419868703";
export const BUSINESS_PHONE_TEL = "tel:0419868703";
export const BUSINESS_EMAIL = "info@electricalinstallers.com.au";

export const SITE_URL = "https://electricalinstallers.com.au";
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const SERVICE_REGION_LINE =
  "Serving the Mornington Peninsula, Bayside & South East Melbourne";

export const BUSINESS_ID = `${SITE_URL}/#business`;

export const BUSINESS_AREAS_SERVED = [
  "Mornington Peninsula",
  "Bayside",
  "South East Melbourne",
] as const;

const ABN_IDENTIFIER = {
  "@type": "PropertyValue",
  propertyID: "ABN",
  value: ABN,
} as const;

export const BUSINESS_PROVIDER = {
  "@type": "Electrician",
  "@id": BUSINESS_ID,
  name: BUSINESS_NAME,
  legalName: LEGAL_NAME,
  url: SITE_URL,
  telephone: BUSINESS_PHONE_E164,
  identifier: ABN_IDENTIFIER,
} as const;

export const BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Electrician", "LocalBusiness"],
  "@id": BUSINESS_ID,
  name: BUSINESS_NAME,
  legalName: LEGAL_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  telephone: BUSINESS_PHONE_E164,
  email: BUSINESS_EMAIL,
  priceRange: "$$",
  identifier: ABN_IDENTIFIER,
  address: {
    "@type": "PostalAddress",
    addressRegion: "VIC",
    addressCountry: "AU",
  },
  areaServed: BUSINESS_AREAS_SERVED.map((name) => ({
    "@type": "Place",
    name,
  })),
} as const;
