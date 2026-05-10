/**
 * Maps Polymarket's `groupItemTitle` (the country name) to a canonical app
 * country code (ISO-3166-1 alpha-2 where possible) plus a flag emoji.
 *
 * Eurovision country list as of 2026-05-10 (from the Polymarket eurovision-winner-2026
 * event). Names match Polymarket's strings exactly so the seed script can join them.
 */
export type CountryMeta = {
  code: string;
  flag: string;
};

export const COUNTRY_META: Record<string, CountryMeta> = {
  Albania: { code: "AL", flag: "🇦🇱" },
  Armenia: { code: "AM", flag: "🇦🇲" },
  Australia: { code: "AU", flag: "🇦🇺" },
  Austria: { code: "AT", flag: "🇦🇹" },
  Azerbaijan: { code: "AZ", flag: "🇦🇿" },
  Belgium: { code: "BE", flag: "🇧🇪" },
  Bulgaria: { code: "BG", flag: "🇧🇬" },
  Croatia: { code: "HR", flag: "🇭🇷" },
  Cyprus: { code: "CY", flag: "🇨🇾" },
  Czechia: { code: "CZ", flag: "🇨🇿" },
  Denmark: { code: "DK", flag: "🇩🇰" },
  Estonia: { code: "EE", flag: "🇪🇪" },
  Finland: { code: "FI", flag: "🇫🇮" },
  France: { code: "FR", flag: "🇫🇷" },
  Georgia: { code: "GE", flag: "🇬🇪" },
  Germany: { code: "DE", flag: "🇩🇪" },
  Greece: { code: "GR", flag: "🇬🇷" },
  Iceland: { code: "IS", flag: "🇮🇸" },
  Ireland: { code: "IE", flag: "🇮🇪" },
  Israel: { code: "IL", flag: "🇮🇱" },
  Italy: { code: "IT", flag: "🇮🇹" },
  Latvia: { code: "LV", flag: "🇱🇻" },
  Lithuania: { code: "LT", flag: "🇱🇹" },
  Luxembourg: { code: "LU", flag: "🇱🇺" },
  Malta: { code: "MT", flag: "🇲🇹" },
  Moldova: { code: "MD", flag: "🇲🇩" },
  Montenegro: { code: "ME", flag: "🇲🇪" },
  Netherlands: { code: "NL", flag: "🇳🇱" },
  Norway: { code: "NO", flag: "🇳🇴" },
  Poland: { code: "PL", flag: "🇵🇱" },
  Portugal: { code: "PT", flag: "🇵🇹" },
  Romania: { code: "RO", flag: "🇷🇴" },
  "San Marino": { code: "SM", flag: "🇸🇲" },
  Serbia: { code: "RS", flag: "🇷🇸" },
  Slovenia: { code: "SI", flag: "🇸🇮" },
  Spain: { code: "ES", flag: "🇪🇸" },
  Sweden: { code: "SE", flag: "🇸🇪" },
  Switzerland: { code: "CH", flag: "🇨🇭" },
  Ukraine: { code: "UA", flag: "🇺🇦" },
  "United Kingdom": { code: "GB", flag: "🇬🇧" },
};

export function metaForName(name: string): CountryMeta | null {
  return COUNTRY_META[name] ?? null;
}
