/**
 * ui.js — Panel lateral minimalista (sin bloques grises)
 */

import { GOV_PALETTE } from './wikidata.js';

export function renderOffcanvas(data) {
  document.getElementById('offcanvasLoader').classList.add('d-none');
  const el = document.getElementById('offcanvasContent');
  el.classList.remove('d-none');
  el.innerHTML = buildPanel(data);
}

function buildPanel(d) {
  const govColor = govBadgeColor(d.govForms);

  return `
    ${d.description ? `<div class="panel-desc">${d.description}</div>` : ''}

    <div class="panel-section">
      <div class="panel-section-title">Gobierno</div>

      ${row('Forma', d.govForms.length
        ? d.govForms.map(g => `<span class="gov-badge" style="background:${govColor}">${g}</span>`).join(' ')
        : '—')}
      ${row('Jefe de Estado', d.headOfState)}
      ${d.headOfGov && d.headOfGov !== d.headOfState && d.headOfGov !== '—'
        ? row('Jefe de Gobierno', d.headOfGov) : ''}
    </div>

    <div class="panel-section" style="margin-top:.6rem">
      <div class="panel-section-title">General</div>

      ${row('Capital',     d.capital)}
      ${row('Población',   d.population)}
      ${row('Superficie',  d.area)}
      ${row('Moneda',      d.currency)}
      ${row('Idioma(s)',   d.langs.join(', ') || '—')}
    </div>

    <div class="panel-footer">
      <a href="${d.wikidataUrl}" target="_blank" rel="noopener" class="btn-wiki">
        <i class="bi bi-box-arrow-up-right me-1"></i>Ver en Wikidata · ${d.qid}
      </a>
    </div>
  `;
}

function row(label, value) {
  if (!value || value === '—') return '';
  return `
    <div class="panel-row">
      <span class="pr-label">${label}</span>
      <span class="pr-value">${value}</span>
    </div>`;
}

// Elige un color de paleta basado en el primer form de gobierno
function govBadgeColor(govForms) {
  if (!govForms || govForms.length === 0) return '#94a3b8';
  const first = (govForms[0] || '').toLowerCase();
  if (first.includes('federal'))       return GOV_PALETTE.fed_republic.color;
  if (first.includes('monarqu'))       return GOV_PALETTE.monarchy.color;
  if (first.includes('comunist') || first.includes('popular') || first.includes('socialist'))
                                       return GOV_PALETTE.communist.color;
  if (first.includes('islam') || first.includes('teocracia'))
                                       return GOV_PALETTE.theocracy.color;
  if (first.includes('republic') || first.includes('repúblic'))
                                       return GOV_PALETTE.republic.color;
  return GOV_PALETTE.other.color;
}
