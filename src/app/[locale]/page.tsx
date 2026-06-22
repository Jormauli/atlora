import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicHome } from "@/components/public-home";
import { getCurrentUser } from "@/lib/auth/session";
import { buildLocaleMetadata, buildWebApplicationJsonLd, isSeoLocale, type SeoLocale } from "@/lib/seo";

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }];
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isSeoLocale(params.locale)) return {};
  return buildLocaleMetadata(params.locale);
}

export default async function LocaleHomePage({ params }: { params: { locale: string } }) {
  if (!isSeoLocale(params.locale)) notFound();

  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const locale: SeoLocale = params.locale;
  const jsonLd = buildWebApplicationJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <PublicHome locale={locale} />
    </>
  );
}
