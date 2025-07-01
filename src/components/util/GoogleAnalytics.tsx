"use client";

import Script from "next/script";

interface GoogleAnalyticsProps {
  userId?: string;
}

const GoogleAnalytics = ({ userId }: GoogleAnalyticsProps) => {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaMeasurementId) {
    return null; // 如果没有配置ID，则不渲染任何内容
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}', {
              page_path: window.location.pathname,
              ${userId ? `user_id: '${userId}'` : ""}
            });
          `,
        }}
      />
    </>
  );
};

export default GoogleAnalytics;