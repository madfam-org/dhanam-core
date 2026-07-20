/**
 * Lightweight ICU MessageFormat resolver
 * Handles {count, plural, ...} and {gender, select, ...} patterns
 * Uses Intl.PluralRules for locale-correct category selection
 */

import type { Locale } from '../types';
import { toIntlLocale } from '../utils/formatters';

/**
 * Resolve ICU plural/select patterns in a template string
 *
 * @example
 * resolveICU('{count, plural, =0 {none} one {# item} other {# items}}', { count: 5 }, 'en')
 * // => '5 items'
 *
 * resolveICU('{gender, select, male {He} female {She} other {They}}', { gender: 'female' }, 'en')
 * // => 'She'
 */
export function resolveICU(
  template: string,
  params: Record<string, string | number>,
  locale: Locale
): string {
  // Match top-level ICU patterns: {varName, plural|select, ...choices}
  return template.replace(
    /\{(\w+),\s*(plural|select),\s*([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    (_match, varName: string, type: string, choicesStr: string) => {
      const value = params[varName];
      if (value === undefined) return _match;

      if (type === 'plural') {
        return resolvePlural(choicesStr, Number(value), locale);
      }
      if (type === 'select') {
        return resolveSelect(choicesStr, String(value));
      }
      return _match;
    }
  );
}

function resolvePlural(choicesStr: string, count: number, locale: Locale): string {
  const choices = parseChoices(choicesStr);

  // 1. Check exact match (=0, =1, =42, etc.)
  const exact = choices[`=${count}`];
  if (exact !== undefined) return exact.replace(/#/g, String(count));

  // 2. Use Intl.PluralRules for locale-correct category
  const rules = new Intl.PluralRules(toIntlLocale(locale));
  const category = rules.select(count); // 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

  const result = choices[category] ?? choices['other'] ?? '';
  return result.replace(/#/g, String(count));
}

function resolveSelect(choicesStr: string, value: string): string {
  const choices = parseChoices(choicesStr);
  return choices[value] ?? choices['other'] ?? '';
}

/**
 * Parse "key1 {value1} key2 {value2}" into { key1: 'value1', key2: 'value2' }
 */
function parseChoices(str: string): Record<string, string> {
  const choices: Record<string, string> = {};
  const regex = /(\S+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(str)) !== null) {
    choices[m[1]!] = m[2]!;
  }
  return choices;
}
