import type { GeneratorContext, TfilaRow } from './types'
import type { Nusach } from '../lib/settings'
import { p } from './util'

/**
 * Kaddish variants — ported from `g7/d.java` in the decompiled APK.
 *
 * The Kaddish is recited at multiple points in every service. The Android
 * source called `new g7.d(SSApp.d.<KIND>, ...).a()` ~25 times across the
 * Mincha/Arvit/Shacharit/Halel/TorahReading generators. Each variant has its
 * own opening title and four nusach-specific texts; on a fast day (`isTaanis`)
 * a different closing phrase is interpolated.
 */
export type KaddishKind = 'derabbanan' | 'yehe' | 'titkabal' | 'hazi'

const KEYS: Record<KaddishKind, { titleKey: string; base: string }> = {
  derabbanan: { titleKey: 'kadishDerTitle', base: 'kadishDer' },
  yehe: { titleKey: 'kadishTitle', base: 'kadishYehe' },
  titkabal: { titleKey: 'kadishTitkTitle', base: 'kadishTitk' },
  hazi: { titleKey: 'kadishTitle', base: 'kadishHazi' },
}

function nusachSuffix(n: Nusach): string {
  if (n === 'sfarad') return 'Sefarad'
  if (n === 'ashkenaz') return 'Ashkenaz'
  if (n === 'chabad') return 'Chabad'
  return '' // edot uses the bare key
}

/**
 * Render a single Kaddish row. Returns null if the body can't be resolved
 * (shouldn't happen with our corpus, but defensive).
 */
export function kaddishRow(
  kind: KaddishKind,
  ctx: GeneratorContext,
  rowIdSuffix: string = kind,
): TfilaRow | null {
  const { base, titleKey } = KEYS[kind]
  const { nusach } = ctx.settings

  const template = p(base + nusachSuffix(nusach)) || p(base)
  if (!template) return null

  // The body has %1$s and (for ashkenaz/sfarad) %2$s placeholders. On a fast
  // day they take the "lela aseret + hashalom" pair; otherwise the "lela
  // sefarad + shalom" pair. Edot uses a single placeholder.
  const isFast = ctx.jc.isTaanis()
  let body: string
  if (isFast) {
    if (nusach === 'sfarad') {
      body = template.replace('%1$s', p('lelaAseretSefarad')).replace('%2$s', p('hashalom'))
    } else if (nusach === 'ashkenaz') {
      body = template.replace('%1$s', p('lelaAseretAshkenaz')).replace('%2$s', p('hashalom'))
    } else {
      body = template.replace('%1$s', p('hashalom'))
    }
  } else {
    if (nusach === 'ashkenaz' || nusach === 'sfarad') {
      body = template.replace('%1$s', p('lelaSefarad')).replace('%2$s', p('shalom'))
    } else {
      body = template.replace('%1$s', p('shalom'))
    }
  }

  return {
    id: `kaddish-${rowIdSuffix}`,
    title: titleKey,
    titleIsKey: true,
    body,
  }
}
