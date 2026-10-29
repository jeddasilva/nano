import { DM_Sans, Syne } from 'next/font/google';
import { GTM_ID } from 'lib/analytics';
import { getAnalyticsConfig } from 'lib/fourthwall';
import { ensureStartsWith } from 'lib/utils';
import Script from 'next/script';
import { ReactNode } from 'react';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap'
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap'
});

const { TWITTER_CREATOR, TWITTER_SITE, SITE_NAME } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined;
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME || 'nano'
  },
  robots: {
    follow: true,
    index: true
  },
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite
      }
    })
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const analytics = await getAnalyticsConfig();

  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable}`}>
      <head>
        <Script id="analytics-config" strategy="beforeInteractive">
          {`
            window.creatorGa4Id = '${analytics.ga4Id}';
            window.creatorFbPixelId = '${analytics.fbPixelId}';
            window.creatorTiktokAnalyticsId = '${analytics.tiktokId}';
            window.creatorKlaviyoAnalyticsId = '${analytics.klaviyoId}';
            window.useServerAnalytics = ${analytics.useServerAnalytics};
            window.cookie_policy = 'ShowInEu';
          `}
        </Script>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            '/_c/mtg.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
