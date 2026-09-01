import { useEffect } from 'react';

export type SEOViewType = 
  | 'home'
  | 'north'
  | 'south'
  | 'central'
  | 'bonedi'
  | 'facilities'
  | 'route-planner'
  | 'medical'
  | 'history'
  | 'admin'
  | '404';

interface SEOHeadProps {
  view: SEOViewType;
  language?: 'bn' | 'en';
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
}

const BASE_URL = 'https://shiuli.online';

interface PageMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: 'website' | 'article';
  ogImage: string;
  robots: string;
  schema: Record<string, any>;
}

export function getMetadataForView(view: SEOViewType, language: 'bn' | 'en' = 'bn'): PageMetadata {
  const isBn = language === 'bn';

  switch (view) {
    case 'history':
      return {
        title: isBn 
          ? 'কলকাতার দুর্গাপূজার ইতিহাস ও ঐতিহ্য | শিউলি' 
          : 'History & Heritage of Durga Puja in Kolkata | Shiuli',
        description: isBn
          ? 'কলকাতার দুর্গাপূজার তিনশত বছরের ঐতিহাসিক বিবর্তন — পারিবারিক ঠাকুরদালান, বারোয়ারি পুজো, কুমোরটুলির ভাস্কর্য ও ইউনেস্কো স্বীকৃতির পূর্ণাঙ্গ ডিজিটাল আর্কাইভ।'
          : 'Discover the 300-year history and cultural evolution of Durga Puja in Kolkata — from historic Bonedi Bari courtyards to community Barowari celebrations and UNESCO heritage.',
        canonicalPath: '/history',
        ogType: 'article',
        ogImage: `${BASE_URL}/images/history/vintage_thakur_dalan.jpg`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          'headline': isBn ? 'কলকাতার দুর্গাপূজার ইতিহাস ও সাংস্কৃতিক ঐতিহ্য' : 'History & Heritage of Durga Puja in Kolkata',
          'description': 'A curated digital archive exploring the history of Kolkata Durga Puja from 18th-century Bonedi Bari courtyards to UNESCO Intangible Cultural Heritage.',
          'image': `${BASE_URL}/images/history/vintage_thakur_dalan.jpg`,
          'author': {
            '@type': 'Organization',
            'name': 'Shiuli',
            'url': BASE_URL
          },
          'publisher': {
            '@type': 'Organization',
            'name': 'Shiuli',
            'logo': {
              '@type': 'ImageObject',
              'url': `${BASE_URL}/logo-shiuli.png`
            }
          },
          'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `${BASE_URL}/history`
          },
          'inLanguage': isBn ? 'bn-IN' : 'en-US'
        }
      };

    case 'north':
      return {
        title: isBn 
          ? 'উত্তর কলকাতার দুর্গাপুজো মণ্ডপ ও পরিক্রমা গাইড | শিউলি' 
          : 'North Kolkata Durga Puja Pandals Guide | Shiuli',
        description: isBn
          ? 'বাগবাজার, শোভাবাজার, কুমারটুলি, আহিরীটোলা সহ উত্তর কলকাতার ঐতিহ্যবাহী সমস্ত দুর্গাপূজা মণ্ডপ, সঠিক মানচিত্র, নিকটবর্তী মেট্রো এবং খাঁটি খাবারের সন্ধান।'
          : 'Complete guide to North Kolkata Durga Puja pandals — Bagbazar, Sovabazar, Kumartuli, Ahiritola, walking routes, metro connectivity, and authentic food nearby.',
        canonicalPath: '/north',
        ogType: 'website',
        ogImage: `${BASE_URL}/tour_card_north.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'TouristAttraction',
          'name': isBn ? 'উত্তর কলকাতা দুর্গাপুজো পরিক্রমা' : 'North Kolkata Durga Puja Tour',
          'description': 'Historic and community Durga Puja pandals of North Kolkata with GPS locations and metro station guides.',
          'image': `${BASE_URL}/tour_card_north.png`,
          'touristType': 'Cultural Tourism',
          'url': `${BASE_URL}/north`
        }
      };

    case 'south':
      return {
        title: isBn 
          ? 'দক্ষিণ কলকাতার দুর্গাপুজো মণ্ডপ ও পরিক্রমা গাইড | শিউলি' 
          : 'South Kolkata Durga Puja Pandals Guide | Shiuli',
        description: isBn
          ? 'একডালিয়া এভারগ্রীন, সুরুচি সংঘ, সিংহী পার্ক, মুদিয়ালি সহ দক্ষিণ কলকাতার বিখ্যাত থিম পুজো মণ্ডপ, রুট ম্যাপ ও ফুড গাইড।'
          : 'Explore South Kolkata Durga Puja pandals — Ekdalia Evergreen, Suruchi Sangha, Singhi Park, Maddox Square, Mudiali, transport guide and food joints.',
        canonicalPath: '/south',
        ogType: 'website',
        ogImage: `${BASE_URL}/tour_card_south.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'TouristAttraction',
          'name': isBn ? 'দক্ষিণ কলকাতা দুর্গাপুজো পরিক্রমা' : 'South Kolkata Durga Puja Tour',
          'description': 'Celebrated theme pandals and historic Pujas of South Kolkata.',
          'image': `${BASE_URL}/tour_card_south.png`,
          'touristType': 'Cultural Tourism',
          'url': `${BASE_URL}/south`
        }
      };

    case 'central':
      return {
        title: isBn 
          ? 'মধ্য কলকাতার দুর্গাপুজো মণ্ডপ ও পরিক্রমা গাইড | শিউলি' 
          : 'Central Kolkata Durga Puja Pandals Guide | Shiuli',
        description: isBn
          ? 'কলেজ স্কয়ার, মহম্মদ আলী পার্ক, সন্তোষ মিত্র স্কয়ার সহ মধ্য কলকাতার চোখ ধাঁধানো আলো ও মণ্ডপ নির্দেশিকা।'
          : 'Guide to Central Kolkata Durga Puja pandals — College Square, Mohammad Ali Park, Santosh Mitra Square, walking routes and nearest metro stations.',
        canonicalPath: '/central',
        ogType: 'website',
        ogImage: `${BASE_URL}/tour_card_central.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'TouristAttraction',
          'name': isBn ? 'মধ্য কলকাতা দুর্গাপুজো পরিক্রমা' : 'Central Kolkata Durga Puja Tour',
          'description': 'Iconic Central Kolkata Durga Puja pandals and illuminations.',
          'image': `${BASE_URL}/tour_card_central.png`,
          'touristType': 'Cultural Tourism',
          'url': `${BASE_URL}/central`
        }
      };

    case 'bonedi':
      return {
        title: isBn 
          ? 'কলকাতা বনেদি বাড়ির দুর্গাপুজো ও ঐতিহ্য গাইড | শিউলি' 
          : 'Bonedi Bari Durga Puja Kolkata | Heritage Family Pujas | Shiuli',
        description: isBn
          ? 'শোভাবাজার রাজবাড়ি, ছাতুবাবু লাহাবাড়ি, দর্জিপাড়া মিত্রবাড়ি সহ কলকাতার শতাব্দীপ্রাচীন পারিবারিক বনেদি পুজোর আচার, ইতিহাস ও দিকনির্দেশ।'
          : 'Discover historic Bonedi Bari Durga Pujas in Kolkata — Shobhabazar Rajbari, Chhatubabu Laha Bari, Sovabazar, century-old rituals, timings, and traditions.',
        canonicalPath: '/bonedi',
        ogType: 'article',
        ogImage: `${BASE_URL}/tour_card_bonedi.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'TouristAttraction',
          'name': isBn ? 'কলকাতার ঐতিহ্যবাহী বনেদি বাড়ির পুজো' : 'Traditional Bonedi Bari Pujas of Kolkata',
          'description': 'Historic aristocratic family Durga Pujas of Kolkata celebrated in heritage Thakur Dalans.',
          'image': `${BASE_URL}/tour_card_bonedi.png`,
          'touristType': 'Heritage Tourism',
          'url': `${BASE_URL}/bonedi`
        }
      };

    case 'facilities':
      return {
        title: isBn 
          ? 'কলকাতা পুজো ফুড গাইড ও প্রয়োজনীয় নাগরিক সেবা | শিউলি' 
          : 'Kolkata Puja Food Guide | Restaurants & Amenities | Shiuli',
        description: isBn
          ? 'পুজো পরিক্রমায় সেরা রেস্তোরাঁ, খাঁটি বাঙালি খাবারের ঠিকানা, স্ট্রিট ফুড স্পট, ওয়াশরুম, এটিএম ও পেট্রোল পাম্পের সরাসরি ডিরেক্টরি।'
          : 'Discover top restaurants, iconic Bengali eateries, street food spots, restrooms, ATMs, and petrol pumps near Kolkata Durga Puja pandals.',
        canonicalPath: '/facilities',
        ogType: 'website',
        ogImage: `${BASE_URL}/food.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'Guide',
          'name': isBn ? 'কলকাতা পুজো ফুড ও সুবিধা গাইড' : 'Kolkata Puja Food & Facilities Guide',
          'description': 'Comprehensive food directory and verified emergency civic amenities for Kolkata Durga Puja.',
          'url': `${BASE_URL}/facilities`
        }
      };

    case 'route-planner':
      return {
        title: isBn 
          ? 'কলকাতা পুজো মেট্রো ও স্মার্ট রুট প্ল্যানার | শিউলি' 
          : 'Kolkata Puja Metro & Transport Guide | Route Planner | Shiuli',
        description: isBn
          ? 'মেট্রো স্টেশন ভিত্তিক কাস্টম পুজো পরিক্রমা রুট তৈরি করুন — সময় হিসাব, হাঁটার দূরত্ব এবং টার্ন-বাই-টার্ন জিপিএস দিকনির্দেশনা।'
          : 'Plan your Durga Puja pandal hopping in Kolkata with custom walking routes, nearest metro stations, estimated walk times, and crowd navigation.',
        canonicalPath: '/route-planner',
        ogType: 'website',
        ogImage: `${BASE_URL}/her-banner.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          'name': isBn ? 'শিউলি স্মার্ট রুট প্ল্যানার' : 'Shiuli Smart Route Planner',
          'description': 'Interactive Durga Puja route planning tool with metro network integration and walking distance optimization.',
          'url': `${BASE_URL}/route-planner`,
          'applicationCategory': 'TravelApplication',
          'operatingSystem': 'All'
        }
      };

    case 'medical':
      return {
        title: isBn 
          ? 'জরুরি চিকিৎসা সেবা ও হাসপাতাল ডিরেক্টরি | শিউলি' 
          : 'Kolkata Puja Emergency Medical & Hospital Directory | Shiuli',
        description: isBn
          ? 'পুজোয় যেকোনো প্রয়োজনে উত্তর ও দক্ষিণ কলকাতার ভেরিফায়েড হাসপাতাল, নার্সিং হোম, ২৪/৭ ফার্মেসি এবং ইমার্জেন্সি অ্যাম্বুলেন্স সহায়িকা।'
          : 'Emergency medical directory for Kolkata Durga Puja — 24/7 hospitals, nursing homes, blood banks, pharmacies, and emergency ambulance contacts.',
        canonicalPath: '/medical',
        ogType: 'website',
        ogImage: `${BASE_URL}/medical_page.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'EmergencyService',
          'name': isBn ? 'কলকাতা পুজো জরুরি চিকিৎসা সহায়তা' : 'Kolkata Puja Emergency Medical Guide',
          'description': 'Verified emergency medical facilities, hospitals, and pharmacies for Kolkata Durga Puja.',
          'url': `${BASE_URL}/medical`
        }
      };

    case 'admin':
      return {
        title: 'Admin Panel | Shiuli',
        description: 'Shiuli administrative portal.',
        canonicalPath: '/admin',
        ogType: 'website',
        ogImage: `${BASE_URL}/logo-shiuli.png`,
        robots: 'noindex, nofollow',
        schema: {}
      };

    case '404':
      return {
        title: isBn ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি (৪০৪) | শিউলি' : '404 — Page Not Found | Shiuli',
        description: isBn
          ? 'অনুরোধকৃত পৃষ্ঠাটি পাওয়া যায়নি। শিউলি-র মূল পাতায় ফিরে গিয়ে কলকাতার দুর্গাপুজো পরিক্রমা শুরু করুন।'
          : 'The requested page could not be found. Explore Kolkata Durga Puja pandals, food, heritage, and routes on Shiuli.',
        canonicalPath: '/',
        ogType: 'website',
        ogImage: `${BASE_URL}/logo-shiuli.png`,
        robots: 'noindex, nofollow',
        schema: {}
      };

    case 'home':
    default:
      return {
        title: isBn 
          ? 'শিউলি — কলকাতার দুর্গাপুজো গাইড | মণ্ডপ, খাওয়া-দাওয়া, ঐতিহ্য ও যাতায়াত' 
          : 'Shiuli — Kolkata Durga Puja Guide | Pandals, Food, Heritage & More',
        description: isBn
          ? 'শিউলি-র সাথে আবিষ্কার করুন কলকাতার দুর্গাপুজো — উত্তর ও দক্ষিণ কলকাতার মণ্ডপ পরিক্রমা, বনেদি বাড়ির পুজো, সেরা খাবারের ঠিকানা, মেট্রো রুট এবং সাংস্কৃতিক ইতিহাস।'
          : 'Explore Kolkata Durga Puja with Shiuli — discover pandals, food, heritage, history, neighbourhoods, transport and everything you need for Puja season.',
        canonicalPath: '/',
        ogType: 'website',
        ogImage: `${BASE_URL}/her-banner.png`,
        robots: 'index, follow',
        schema: {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${BASE_URL}/#website`,
              'url': BASE_URL,
              'name': 'Shiuli',
              'description': 'Kolkata Durga Puja Digital Discovery & Culture Guide',
              'inLanguage': ['bn-IN', 'en-US'],
              'publisher': {
                '@id': `${BASE_URL}/#organization`
              }
            },
            {
              '@type': 'Organization',
              '@id': `${BASE_URL}/#organization`,
              'name': 'Shiuli',
              'url': BASE_URL,
              'logo': {
                '@type': 'ImageObject',
                'url': `${BASE_URL}/logo-shiuli.png`,
                'width': 512,
                'height': 512
              },
              'sameAs': [
                'https://www.facebook.com/share/1DTxLYsnmc/',
                'https://instagram.com/monoc_'
              ]
            },
            {
              '@type': 'Event',
              'name': isBn ? 'কলকাতা দুর্গাপূজা ২০২৬' : 'Kolkata Durga Puja 2026',
              'description': 'The biggest cultural and religious festival in Kolkata, recognized by UNESCO as an Intangible Cultural Heritage of Humanity.',
              'startDate': '2026-10-15',
              'endDate': '2026-10-21',
              'eventStatus': 'https://schema.org/EventScheduled',
              'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
              'location': {
                '@type': 'Place',
                'name': 'Kolkata',
                'address': {
                  '@type': 'PostalAddress',
                  'addressLocality': 'Kolkata',
                  'addressRegion': 'West Bengal',
                  'addressCountry': 'IN'
                }
              },
              'image': `${BASE_URL}/her-banner.png`,
              'organizer': {
                '@type': 'Organization',
                'name': 'Shiuli',
                'url': BASE_URL
              }
            }
          ]
        }
      };
  }
}

function setOrCreateMeta(selector: string, attrName: string, attrVal: string, content: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrVal);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setOrCreateLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export default function SEOHead({ view, language = 'bn', customTitle, customDescription, customImage }: SEOHeadProps) {
  useEffect(() => {
    const meta = getMetadataForView(view, language);
    const title = customTitle || meta.title;
    const description = customDescription || meta.description;
    const image = customImage || meta.ogImage;
    const canonicalUrl = `${BASE_URL}${meta.canonicalPath}`;

    // 1. Document Title
    document.title = title;

    // 2. Primary Meta Tags
    setOrCreateMeta('meta[name="description"]', 'name', 'description', description);
    setOrCreateMeta('meta[name="robots"]', 'name', 'robots', meta.robots);
    setOrCreateMeta('meta[name="googlebot"]', 'name', 'googlebot', meta.robots);

    // 3. Canonical Link
    setOrCreateLink('canonical', canonicalUrl);

    // 4. Open Graph Tags
    setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', meta.ogType);
    setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Shiuli');
    setOrCreateMeta('meta[property="og:locale"]', 'property', 'og:locale', language === 'bn' ? 'bn_IN' : 'en_US');

    // 5. Twitter / X Card Tags
    setOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // 6. JSON-LD Structured Data
    const existingScript = document.getElementById('shiuli-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    if (meta.schema && Object.keys(meta.schema).length > 0) {
      const script = document.createElement('script');
      script.id = 'shiuli-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(meta.schema);
      document.head.appendChild(script);
    }
  }, [view, language, customTitle, customDescription, customImage]);

  return null;
}
