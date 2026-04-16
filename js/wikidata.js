/**
 * wikidata.js — Servicio Wikidata Action API
 *
 * Lookup de QID en 4 capas (sin red):
 *   1. ISO A2  → A2_QID
 *   2. ISO A3  → A3_QID
 *   3. Nombre  → NAME_QID  (generado de world-countries, cubre ~365 entradas)
 *   4. SPARQL  → fallback final
 */

const ACTION_API = 'https://www.wikidata.org/w/api.php';
const SPARQL_URL = 'https://query.wikidata.org/sparql';

const PROPS = {
  headOfState:  'P35',
  headOfGov:    'P6',
  govForm:      'P122',
  capital:      'P36',
  population:   'P1082',
  area:         'P2046',
  currency:     'P38',
  officialLang: 'P37',
};

const _cache = new Map();

// ── Tablas de lookup ──────────────────────────────────────

const A2_QID = {
  AF:'Q889',AL:'Q222',DZ:'Q262',AD:'Q228',AO:'Q916',AG:'Q781',AR:'Q414',
  AM:'Q399',AU:'Q408',AT:'Q40',AZ:'Q227',BS:'Q778',BH:'Q398',BD:'Q902',
  BB:'Q244',BY:'Q184',BE:'Q31',BZ:'Q242',BJ:'Q962',BT:'Q917',BO:'Q750',
  BA:'Q225',BW:'Q963',BR:'Q155',BN:'Q921',BG:'Q219',BF:'Q965',BI:'Q967',
  CV:'Q1011',KH:'Q424',CM:'Q1009',CA:'Q16',CF:'Q929',TD:'Q657',CL:'Q298',
  CN:'Q148',CO:'Q739',KM:'Q970',CG:'Q971',CD:'Q974',CR:'Q800',CI:'Q1008',
  HR:'Q224',CU:'Q241',CY:'Q229',CZ:'Q213',DK:'Q35',DJ:'Q977',DM:'Q784',
  DO:'Q786',EC:'Q736',EG:'Q79',SV:'Q792',GQ:'Q983',ER:'Q986',EE:'Q191',
  SZ:'Q1050',ET:'Q115',FJ:'Q712',FI:'Q33',FR:'Q142',GA:'Q1000',GM:'Q1005',
  GE:'Q230',DE:'Q183',GH:'Q117',GR:'Q41',GD:'Q769',GT:'Q774',GN:'Q1006',
  GW:'Q1007',GY:'Q734',HT:'Q790',HN:'Q783',HU:'Q28',IS:'Q189',IN:'Q668',
  ID:'Q252',IR:'Q794',IQ:'Q796',IE:'Q27',IL:'Q801',IT:'Q38',JM:'Q766',
  JP:'Q17',JO:'Q810',KZ:'Q232',KE:'Q114',KI:'Q710',KP:'Q423',KR:'Q884',
  KW:'Q817',KG:'Q813',LA:'Q819',LV:'Q211',LB:'Q822',LS:'Q1013',LR:'Q1014',
  LY:'Q1016',LI:'Q347',LT:'Q37',LU:'Q32',MG:'Q1019',MW:'Q1020',MY:'Q833',
  MV:'Q826',ML:'Q912',MT:'Q233',MH:'Q709',MR:'Q1025',MU:'Q1027',MX:'Q96',
  FM:'Q702',MD:'Q217',MC:'Q235',MN:'Q711',ME:'Q236',MA:'Q1028',MZ:'Q1029',
  MM:'Q836',NA:'Q1030',NR:'Q697',NP:'Q837',NL:'Q55',NZ:'Q664',NI:'Q811',
  NE:'Q1032',NG:'Q1033',NO:'Q20',OM:'Q842',PK:'Q843',PW:'Q695',PA:'Q804',
  PG:'Q691',PY:'Q733',PE:'Q419',PH:'Q928',PL:'Q36',PT:'Q45',QA:'Q846',
  RO:'Q218',RU:'Q159',RW:'Q1037',KN:'Q763',LC:'Q760',VC:'Q757',WS:'Q683',
  SM:'Q238',ST:'Q1039',SA:'Q851',SN:'Q1041',RS:'Q403',SC:'Q1042',SL:'Q1044',
  SG:'Q334',SK:'Q214',SI:'Q215',SB:'Q685',SO:'Q1045',ZA:'Q258',SS:'Q958',
  ES:'Q29',LK:'Q854',SD:'Q1049',SR:'Q730',SE:'Q34',CH:'Q39',SY:'Q858',
  TW:'Q865',TJ:'Q863',TZ:'Q924',TH:'Q869',TL:'Q574',TG:'Q945',TO:'Q678',
  TT:'Q754',TN:'Q948',TR:'Q43',TM:'Q874',TV:'Q672',UG:'Q1036',UA:'Q212',
  AE:'Q878',GB:'Q145',US:'Q30',UY:'Q77',UZ:'Q265',VU:'Q686',VE:'Q717',
  VN:'Q881',YE:'Q805',ZM:'Q953',ZW:'Q954',MK:'Q221',PS:'Q219060',XK:'Q1246',
};

const A3_QID = {
  AFG:'Q889',ALB:'Q222',DZA:'Q262',AND:'Q228',AGO:'Q916',ATG:'Q781',
  ARG:'Q414',ARM:'Q399',AUS:'Q408',AUT:'Q40',AZE:'Q227',BHS:'Q778',
  BHR:'Q398',BGD:'Q902',BRB:'Q244',BLR:'Q184',BEL:'Q31',BLZ:'Q242',
  BEN:'Q962',BTN:'Q917',BOL:'Q750',BIH:'Q225',BWA:'Q963',BRA:'Q155',
  BRN:'Q921',BGR:'Q219',BFA:'Q965',BDI:'Q967',CPV:'Q1011',KHM:'Q424',
  CMR:'Q1009',CAN:'Q16',CAF:'Q929',TCD:'Q657',CHL:'Q298',CHN:'Q148',
  COL:'Q739',COM:'Q970',COG:'Q971',COD:'Q974',CRI:'Q800',CIV:'Q1008',
  HRV:'Q224',CUB:'Q241',CYP:'Q229',CZE:'Q213',DNK:'Q35',DJI:'Q977',
  DMA:'Q784',DOM:'Q786',ECU:'Q736',EGY:'Q79',SLV:'Q792',GNQ:'Q983',
  ERI:'Q986',EST:'Q191',SWZ:'Q1050',ETH:'Q115',FJI:'Q712',FIN:'Q33',
  FRA:'Q142',GAB:'Q1000',GMB:'Q1005',GEO:'Q230',DEU:'Q183',GHA:'Q117',
  GRC:'Q41',GRD:'Q769',GTM:'Q774',GIN:'Q1006',GNB:'Q1007',GUY:'Q734',
  HTI:'Q790',HND:'Q783',HUN:'Q28',ISL:'Q189',IND:'Q668',IDN:'Q252',
  IRN:'Q794',IRQ:'Q796',IRL:'Q27',ISR:'Q801',ITA:'Q38',JAM:'Q766',
  JPN:'Q17',JOR:'Q810',KAZ:'Q232',KEN:'Q114',KIR:'Q710',PRK:'Q423',
  KOR:'Q884',KWT:'Q817',KGZ:'Q813',LAO:'Q819',LVA:'Q211',LBN:'Q822',
  LSO:'Q1013',LBR:'Q1014',LBY:'Q1016',LIE:'Q347',LTU:'Q37',LUX:'Q32',
  MDG:'Q1019',MWI:'Q1020',MYS:'Q833',MDV:'Q826',MLI:'Q912',MLT:'Q233',
  MHL:'Q709',MRT:'Q1025',MUS:'Q1027',MEX:'Q96',FSM:'Q702',MDA:'Q217',
  MCO:'Q235',MNG:'Q711',MNE:'Q236',MAR:'Q1028',MOZ:'Q1029',MMR:'Q836',
  NAM:'Q1030',NRU:'Q697',NPL:'Q837',NLD:'Q55',NZL:'Q664',NIC:'Q811',
  NER:'Q1032',NGA:'Q1033',NOR:'Q20',OMN:'Q842',PAK:'Q843',PLW:'Q695',
  PAN:'Q804',PNG:'Q691',PRY:'Q733',PER:'Q419',PHL:'Q928',POL:'Q36',
  PRT:'Q45',QAT:'Q846',ROU:'Q218',RUS:'Q159',RWA:'Q1037',KNA:'Q763',
  LCA:'Q760',VCT:'Q757',WSM:'Q683',SMR:'Q238',STP:'Q1039',SAU:'Q851',
  SEN:'Q1041',SRB:'Q403',SYC:'Q1042',SLE:'Q1044',SGP:'Q334',SVK:'Q214',
  SVN:'Q215',SLB:'Q685',SOM:'Q1045',ZAF:'Q258',SSD:'Q958',ESP:'Q29',
  LKA:'Q854',SDN:'Q1049',SUR:'Q730',SWE:'Q34',CHE:'Q39',SYR:'Q858',
  TWN:'Q865',TJK:'Q863',TZA:'Q924',THA:'Q869',TLS:'Q574',TGO:'Q945',
  TON:'Q678',TTO:'Q754',TUN:'Q948',TUR:'Q43',TKM:'Q874',TUV:'Q672',
  UGA:'Q1036',UKR:'Q212',ARE:'Q878',GBR:'Q145',USA:'Q30',URY:'Q77',
  UZB:'Q265',VUT:'Q686',VEN:'Q717',VNM:'Q881',YEM:'Q805',ZMB:'Q953',
  ZWE:'Q954',MKD:'Q221',PSE:'Q219060',XKX:'Q1246',
  // Casos especiales Natural Earth
  FXX:'Q142',NOR:'Q20',
};

// Generado de world-countries — nombres comunes + oficiales en inglés
const NAME_QID = {
  'Afghanistan':'Q889','Islamic Republic of Afghanistan':'Q889',
  'Angola':'Q916','Republic of Angola':'Q916',
  'Albania':'Q222','Republic of Albania':'Q222',
  'Andorra':'Q228','Principality of Andorra':'Q228',
  'United Arab Emirates':'Q878',
  'Argentina':'Q414','Argentine Republic':'Q414',
  'Armenia':'Q399','Republic of Armenia':'Q399',
  'Antigua and Barbuda':'Q781',
  'Australia':'Q408','Commonwealth of Australia':'Q408',
  'Austria':'Q40','Republic of Austria':'Q40',
  'Azerbaijan':'Q227','Republic of Azerbaijan':'Q227',
  'Burundi':'Q967','Republic of Burundi':'Q967',
  'Belgium':'Q31','Kingdom of Belgium':'Q31',
  'Benin':'Q962','Republic of Benin':'Q962',
  'Burkina Faso':'Q965',
  'Bangladesh':'Q902',"People's Republic of Bangladesh":'Q902',
  'Bulgaria':'Q219','Republic of Bulgaria':'Q219',
  'Bahrain':'Q398','Kingdom of Bahrain':'Q398',
  'Bahamas':'Q778','Commonwealth of the Bahamas':'Q778',
  'Bosnia and Herzegovina':'Q225',
  'Belarus':'Q184','Republic of Belarus':'Q184',
  'Belize':'Q242',
  'Bolivia':'Q750','Plurinational State of Bolivia':'Q750',
  'Brazil':'Q155','Federative Republic of Brazil':'Q155',
  'Barbados':'Q244',
  'Brunei':'Q921',"Nation of Brunei, Abode of Peace":'Q921',
  'Bhutan':'Q917','Kingdom of Bhutan':'Q917',
  'Botswana':'Q963','Republic of Botswana':'Q963',
  'Central African Republic':'Q929',
  'Canada':'Q16',
  'Switzerland':'Q39','Swiss Confederation':'Q39',
  'Chile':'Q298','Republic of Chile':'Q298',
  'China':'Q148',"People's Republic of China":'Q148',
  'Ivory Coast':'Q1008',"Republic of Côte d'Ivoire":'Q1008','Côte d\'Ivoire':'Q1008',
  'Cameroon':'Q1009','Republic of Cameroon':'Q1009',
  'DR Congo':'Q974','Democratic Republic of the Congo':'Q974',
  'Republic of the Congo':'Q971','Congo':'Q971',
  'Colombia':'Q739','Republic of Colombia':'Q739',
  'Comoros':'Q970','Union of the Comoros':'Q970',
  'Cape Verde':'Q1011','Republic of Cabo Verde':'Q1011','Cabo Verde':'Q1011',
  'Costa Rica':'Q800','Republic of Costa Rica':'Q800',
  'Cuba':'Q241','Republic of Cuba':'Q241',
  'Cyprus':'Q229','Republic of Cyprus':'Q229',
  'Czechia':'Q213','Czech Republic':'Q213',
  'Germany':'Q183','Federal Republic of Germany':'Q183',
  'Djibouti':'Q977','Republic of Djibouti':'Q977',
  'Dominica':'Q784','Commonwealth of Dominica':'Q784',
  'Denmark':'Q35','Kingdom of Denmark':'Q35',
  'Dominican Republic':'Q786',
  'Algeria':'Q262',"People's Democratic Republic of Algeria":'Q262',
  'Ecuador':'Q736','Republic of Ecuador':'Q736',
  'Egypt':'Q79','Arab Republic of Egypt':'Q79',
  'Eritrea':'Q986','State of Eritrea':'Q986',
  'Spain':'Q29','Kingdom of Spain':'Q29',
  'Estonia':'Q191','Republic of Estonia':'Q191',
  'Ethiopia':'Q115','Federal Democratic Republic of Ethiopia':'Q115',
  'Finland':'Q33','Republic of Finland':'Q33',
  'Fiji':'Q712','Republic of Fiji':'Q712',
  'France':'Q142','French Republic':'Q142',
  'Micronesia':'Q702','Federated States of Micronesia':'Q702',
  'Gabon':'Q1000','Gabonese Republic':'Q1000',
  'United Kingdom':'Q145','United Kingdom of Great Britain and Northern Ireland':'Q145',
  'Georgia':'Q230',
  'Ghana':'Q117','Republic of Ghana':'Q117',
  'Guinea':'Q1006','Republic of Guinea':'Q1006',
  'Gambia':'Q1005','Republic of the Gambia':'Q1005',
  'Guinea-Bissau':'Q1007','Republic of Guinea-Bissau':'Q1007',
  'Equatorial Guinea':'Q983','Republic of Equatorial Guinea':'Q983',
  'Greece':'Q41','Hellenic Republic':'Q41',
  'Grenada':'Q769',
  'Guatemala':'Q774','Republic of Guatemala':'Q774',
  'Guyana':'Q734','Co-operative Republic of Guyana':'Q734',
  'Honduras':'Q783','Republic of Honduras':'Q783',
  'Croatia':'Q224','Republic of Croatia':'Q224',
  'Haiti':'Q790','Republic of Haiti':'Q790',
  'Hungary':'Q28',
  'Indonesia':'Q252','Republic of Indonesia':'Q252',
  'India':'Q668','Republic of India':'Q668',
  'Ireland':'Q27','Republic of Ireland':'Q27',
  'Iran':'Q794','Islamic Republic of Iran':'Q794',
  'Iraq':'Q796','Republic of Iraq':'Q796',
  'Iceland':'Q189',
  'Israel':'Q801','State of Israel':'Q801',
  'Italy':'Q38','Italian Republic':'Q38',
  'Jamaica':'Q766',
  'Jordan':'Q810','Hashemite Kingdom of Jordan':'Q810',
  'Japan':'Q17',
  'Kazakhstan':'Q232','Republic of Kazakhstan':'Q232',
  'Kenya':'Q114','Republic of Kenya':'Q114',
  'Kyrgyzstan':'Q813','Kyrgyz Republic':'Q813',
  'Cambodia':'Q424','Kingdom of Cambodia':'Q424',
  'Kiribati':'Q710',
  'Saint Kitts and Nevis':'Q763',
  'South Korea':'Q884','Republic of Korea':'Q884','Korea':'Q884',
  'Kosovo':'Q1246','Republic of Kosovo':'Q1246',
  'Kuwait':'Q817','State of Kuwait':'Q817',
  'Laos':'Q819',"Lao People's Democratic Republic":'Q819',
  'Lebanon':'Q822','Lebanese Republic':'Q822',
  'Liberia':'Q1014','Republic of Liberia':'Q1014',
  'Libya':'Q1016','State of Libya':'Q1016',
  'Saint Lucia':'Q760',
  'Liechtenstein':'Q347','Principality of Liechtenstein':'Q347',
  'Sri Lanka':'Q854','Democratic Socialist Republic of Sri Lanka':'Q854',
  'Lesotho':'Q1013','Kingdom of Lesotho':'Q1013',
  'Lithuania':'Q37','Republic of Lithuania':'Q37',
  'Luxembourg':'Q32','Grand Duchy of Luxembourg':'Q32',
  'Latvia':'Q211','Republic of Latvia':'Q211',
  'Morocco':'Q1028','Kingdom of Morocco':'Q1028',
  'Monaco':'Q235','Principality of Monaco':'Q235',
  'Moldova':'Q217','Republic of Moldova':'Q217',
  'Madagascar':'Q1019','Republic of Madagascar':'Q1019',
  'Maldives':'Q826','Republic of the Maldives':'Q826',
  'Mexico':'Q96','United Mexican States':'Q96',
  'Marshall Islands':'Q709','Republic of the Marshall Islands':'Q709',
  'North Macedonia':'Q221','Republic of North Macedonia':'Q221','Macedonia':'Q221',
  'Mali':'Q912','Republic of Mali':'Q912',
  'Malta':'Q233','Republic of Malta':'Q233',
  'Myanmar':'Q836','Republic of the Union of Myanmar':'Q836','Burma':'Q836',
  'Montenegro':'Q236',
  'Mongolia':'Q711',
  'Mozambique':'Q1029','Republic of Mozambique':'Q1029',
  'Mauritania':'Q1025','Islamic Republic of Mauritania':'Q1025',
  'Mauritius':'Q1027','Republic of Mauritius':'Q1027',
  'Malawi':'Q1020','Republic of Malawi':'Q1020',
  'Malaysia':'Q833',
  'Namibia':'Q1030','Republic of Namibia':'Q1030',
  'Niger':'Q1032','Republic of Niger':'Q1032',
  'Nigeria':'Q1033','Federal Republic of Nigeria':'Q1033',
  'Nicaragua':'Q811','Republic of Nicaragua':'Q811',
  'Netherlands':'Q55','Kingdom of the Netherlands':'Q55',
  'Norway':'Q20','Kingdom of Norway':'Q20',
  'Nepal':'Q837','Federal Democratic Republic of Nepal':'Q837',
  'Nauru':'Q697','Republic of Nauru':'Q697',
  'New Zealand':'Q664',
  'Oman':'Q842','Sultanate of Oman':'Q842',
  'Pakistan':'Q843','Islamic Republic of Pakistan':'Q843',
  'Panama':'Q804','Republic of Panama':'Q804',
  'Peru':'Q419','Republic of Peru':'Q419',
  'Philippines':'Q928','Republic of the Philippines':'Q928',
  'Palau':'Q695','Republic of Palau':'Q695',
  'Papua New Guinea':'Q691','Independent State of Papua New Guinea':'Q691',
  'Poland':'Q36','Republic of Poland':'Q36',
  'North Korea':'Q423',"Democratic People's Republic of Korea":'Q423',
  'Portugal':'Q45','Portuguese Republic':'Q45',
  'Paraguay':'Q733','Republic of Paraguay':'Q733',
  'Palestine':'Q219060','State of Palestine':'Q219060','Palestinian Territory':'Q219060',
  'Qatar':'Q846','State of Qatar':'Q846',
  'Romania':'Q218',
  'Russia':'Q159','Russian Federation':'Q159',
  'Rwanda':'Q1037','Republic of Rwanda':'Q1037',
  'Saudi Arabia':'Q851','Kingdom of Saudi Arabia':'Q851',
  'Sudan':'Q1049','Republic of the Sudan':'Q1049',
  'Senegal':'Q1041','Republic of Senegal':'Q1041',
  'Singapore':'Q334','Republic of Singapore':'Q334',
  'Solomon Islands':'Q685',
  'Sierra Leone':'Q1044','Republic of Sierra Leone':'Q1044',
  'El Salvador':'Q792','Republic of El Salvador':'Q792',
  'San Marino':'Q238','Most Serene Republic of San Marino':'Q238',
  'Somalia':'Q1045','Federal Republic of Somalia':'Q1045',
  'Serbia':'Q403','Republic of Serbia':'Q403',
  'South Sudan':'Q958','Republic of South Sudan':'Q958',
  'São Tomé and Príncipe':'Q1039','Sao Tome and Principe':'Q1039',
  'Suriname':'Q730','Republic of Suriname':'Q730',
  'Slovakia':'Q214','Slovak Republic':'Q214',
  'Slovenia':'Q215','Republic of Slovenia':'Q215',
  'Sweden':'Q34','Kingdom of Sweden':'Q34',
  'Eswatini':'Q1050','Kingdom of Eswatini':'Q1050','Swaziland':'Q1050',
  'Seychelles':'Q1042','Republic of Seychelles':'Q1042',
  'Syria':'Q858','Syrian Arab Republic':'Q858',
  'Chad':'Q657','Republic of Chad':'Q657',
  'Togo':'Q945','Togolese Republic':'Q945',
  'Thailand':'Q869','Kingdom of Thailand':'Q869',
  'Tajikistan':'Q863','Republic of Tajikistan':'Q863',
  'Turkmenistan':'Q874',
  'Timor-Leste':'Q574','East Timor':'Q574','Democratic Republic of Timor-Leste':'Q574',
  'Tonga':'Q678','Kingdom of Tonga':'Q678',
  'Trinidad and Tobago':'Q754','Republic of Trinidad and Tobago':'Q754',
  'Tunisia':'Q948','Tunisian Republic':'Q948',
  'Turkey':'Q43','Türkiye':'Q43','Republic of Türkiye':'Q43',
  'Tuvalu':'Q672',
  'Taiwan':'Q865','Republic of China (Taiwan)':'Q865',
  'Tanzania':'Q924','United Republic of Tanzania':'Q924',
  'Uganda':'Q1036','Republic of Uganda':'Q1036',
  'Ukraine':'Q212',
  'Uruguay':'Q77','Oriental Republic of Uruguay':'Q77',
  'United States':'Q30','United States of America':'Q30',
  'Uzbekistan':'Q265','Republic of Uzbekistan':'Q265',
  'Saint Vincent and the Grenadines':'Q757',
  'Venezuela':'Q717','Bolivarian Republic of Venezuela':'Q717',
  'Vietnam':'Q881','Viet Nam':'Q881','Socialist Republic of Vietnam':'Q881',
  'Vanuatu':'Q686','Republic of Vanuatu':'Q686',
  'Samoa':'Q683','Independent State of Samoa':'Q683',
  'Yemen':'Q805','Republic of Yemen':'Q805',
  'South Africa':'Q258','Republic of South Africa':'Q258',
  'Zambia':'Q953','Republic of Zambia':'Q953',
  'Zimbabwe':'Q954','Republic of Zimbabwe':'Q954',
  'Western Sahara':'Q40362','Sahrawi Arab Democratic Republic':'Q40362',
  'Somaliland':'Q34754',
  'Northern Cyprus':'Q23681',
};

// ── API ───────────────────────────────────────────────────

async function fetchEntities(qids) {
  if (!qids || qids.length === 0) return {};
  const needed = qids.filter(q => q && !_cache.has(q));

  if (needed.length > 0) {
    for (let i = 0; i < needed.length; i += 50) {
      const chunk = needed.slice(i, i + 50);
      const params = new URLSearchParams({
        action: 'wbgetentities', ids: chunk.join('|'),
        props: 'labels|descriptions|claims',
        languages: 'es|en', languagefallback: '1',
        format: 'json', origin: '*',
      });
      const res  = await fetch(`${ACTION_API}?${params}`);
      if (!res.ok) throw new Error(`Wikidata error ${res.status}`);
      const data = await res.json();
      for (const [qid, entity] of Object.entries(data.entities || {})) {
        _cache.set(qid, entity);
      }
    }
  }

  return Object.fromEntries(qids.map(q => [q, _cache.get(q)]));
}

function labelOf(entity) {
  if (!entity) return '—';
  return entity.labels?.es?.value || entity.labels?.en?.value || '—';
}

function claimQID(claim) {
  const dv = claim?.mainsnak?.datavalue;
  if (!dv || dv.type !== 'wikibase-entityid') return null;
  return dv.value?.id || null;
}

function claimQuantity(claim) {
  const dv = claim?.mainsnak?.datavalue;
  if (!dv || dv.type !== 'quantity') return null;
  return dv.value?.amount || null;
}

function getClaims(entity, prop) {
  return entity?.claims?.[prop] || [];
}

function rankOrder(claim) {
  return claim?.rank === 'preferred' ? 2 : claim?.rank === 'normal' ? 1 : 0;
}

// ── Lookup público ────────────────────────────────────────

/**
 * Encuentra el QID de un país en 4 capas de fallback.
 * @param {string|null} isoA2
 * @param {string|null} isoA3
 * @param {string|null} name  — nombre en inglés del GeoJSON (campo ADMIN)
 */
export async function findCountryQID(isoA2, isoA3, name) {
  if (isoA2) { const q = A2_QID[isoA2.toUpperCase()]; if (q) return q; }
  if (isoA3) { const q = A3_QID[isoA3.toUpperCase()]; if (q) return q; }
  if (name)  { const q = NAME_QID[name];               if (q) return q; }

  // SPARQL como último recurso
  if (isoA2 && isoA2.length === 2) {
    const q = await sparql(`SELECT ?c WHERE { ?c wdt:P297 "${isoA2}" ; wdt:P31 wd:Q6256 . } LIMIT 1`);
    if (q) return q;
  }
  if (isoA3 && isoA3.length === 3) {
    const q = await sparql(`SELECT ?c WHERE { ?c wdt:P298 "${isoA3}" ; wdt:P31 wd:Q6256 . } LIMIT 1`);
    if (q) return q;
  }
  return null;
}

async function sparql(query) {
  try {
    const res  = await fetch(`${SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`,
      { headers: { Accept: 'application/sparql-results+json' } });
    const data = await res.json();
    const uri  = data.results?.bindings?.[0]?.c?.value ?? '';
    return uri ? uri.split('/').pop() : null;
  } catch { return null; }
}

// ── Datos del país ────────────────────────────────────────

export async function getCountryData(qid) {
  const main = await fetchEntities([qid]);
  const item = main[qid];
  if (!item) throw new Error(`Ítem no encontrado: ${qid}`);

  const nameEs      = item.labels?.es?.value || item.labels?.en?.value || '—';
  const description = item.descriptions?.es?.value || item.descriptions?.en?.value || '';

  const headOfStateQID = claimQID(getClaims(item, PROPS.headOfState)[0]);
  const headOfGovQID   = claimQID(getClaims(item, PROPS.headOfGov)[0]);
  const govFormQIDs    = getClaims(item, PROPS.govForm).map(claimQID).filter(Boolean).slice(0, 3);
  const capitalQID     = claimQID(getClaims(item, PROPS.capital)[0]);
  const currencyQID    = claimQID(getClaims(item, PROPS.currency)[0]);
  const langQIDs       = getClaims(item, PROPS.officialLang).map(claimQID).filter(Boolean).slice(0, 3);

  const populationRaw = claimQuantity(
    getClaims(item, PROPS.population).sort((a, b) => rankOrder(b) - rankOrder(a))[0]
  );
  const areaRaw = claimQuantity(getClaims(item, PROPS.area)[0]);

  const relatedQIDs = [
    headOfStateQID, headOfGovQID,
    ...govFormQIDs, capitalQID, currencyQID, ...langQIDs,
  ].filter(Boolean);

  const related = relatedQIDs.length > 0 ? await fetchEntities(relatedQIDs) : {};

  return {
    qid,
    nameEs,
    description,
    headOfState: labelOf(related[headOfStateQID]),
    headOfGov:   labelOf(related[headOfGovQID]),
    govForms:    govFormQIDs.map(q => labelOf(related[q])).filter(v => v !== '—'),
    capital:     labelOf(related[capitalQID]),
    currency:    labelOf(related[currencyQID]),
    langs:       langQIDs.map(q => labelOf(related[q])).filter(v => v !== '—'),
    population:  formatNumber(populationRaw),
    area:        formatNumber(areaRaw, 'km²'),
    wikidataUrl: `https://www.wikidata.org/wiki/${qid}`,
  };
}

function formatNumber(raw, unit = '') {
  if (!raw) return '—';
  const n = parseFloat(String(raw).replace('+', ''));
  if (isNaN(n)) return '—';
  const s = n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  return unit ? `${s} ${unit}` : s;
}

// ── Paleta de formas de gobierno ──────────────────────────
//
// Clasificación basada en los QIDs más frecuentes de P122 en Wikidata.
// Cada tipo agrupa variantes (ej: "república presidencial" y "república" → 'republic').

export const GOV_PALETTE = {
  republic:        { color: '#3b82f6', label: 'República' },
  monarchy:        { color: '#8b5cf6', label: 'Monarquía' },
  fed_republic:    { color: '#06b6d4', label: 'Rep. Federal' },
  communist:       { color: '#ef4444', label: 'Estado comunista' },
  theocracy:       { color: '#f97316', label: 'Teocracia / Islam' },
  military:        { color: '#64748b', label: 'Régimen militar' },
  other:           { color: '#10b981', label: 'Otro' },
};

// QIDs de Wikidata para P122 (forma de gobierno) → tipo de paleta
const GOV_QID_MAP = {
  // Repúblicas presidenciales / semipresidenciales
  'Q4696269':  'republic',   // república presidencial
  'Q1178780':  'republic',   // república semipresidencial
  'Q3058957':  'republic',   // república parlamentaria
  'Q512187':   'republic',   // república constitucional
  'Q164950':   'republic',   // república
  'Q7270':     'republic',   // república (genérico)
  'Q4649152':  'republic',   // república unitaria
  // Repúblicas federales
  'Q179164':   'fed_republic', // república federal
  'Q43702':    'fed_republic', // federación
  'Q1802':     'fed_republic', // estado federal
  // Monarquías
  'Q130279':   'monarchy',   // monarquía constitucional
  'Q3550800':  'monarchy',   // monarquía parlamentaria
  'Q22979166': 'monarchy',   // monarquía absoluta
  'Q1978':     'monarchy',   // monarquía
  'Q170218':   'monarchy',   // monarquía constitucional
  // Estados comunistas / partido único
  'Q849866':   'communist',  // estado comunista
  'Q7270001':  'communist',  // república popular
  'Q1390293':  'communist',  // república socialista
  // Teocracias / estados islámicos
  'Q1310':     'theocracy',  // teocracia
  'Q3943788':  'theocracy',  // república islámica
  'Q8188228':  'theocracy',  // estado islámico
  // Regímenes militares / dictaduras
  'Q11111':    'military',   // dictadura
  'Q1049948':  'military',   // junta militar
};

export const GOV_TYPES = Object.keys(GOV_PALETTE);

/**
 * Devuelve el tipo de gobierno de un país (clave de GOV_PALETTE)
 * a partir de su QID. Usa el caché de entidades ya cargadas.
 * @param {string} qid
 * @returns {Promise<string>} tipo de gobierno (clave de GOV_PALETTE) o 'other'
 */
export async function getGovType(qid) {
  try {
    const entities = await fetchEntities([qid]);
    const item = entities[qid];
    if (!item) return 'other';

    const claims = item.claims?.['P122'] || [];
    for (const claim of claims) {
      const govQid = claimQID(claim);
      if (govQid && GOV_QID_MAP[govQid]) {
        return GOV_QID_MAP[govQid];
      }
    }
    // Si tiene al menos un claim de P122 pero no está en nuestro mapa → 'other'
    return claims.length > 0 ? 'other' : 'other';
  } catch {
    return 'other';
  }
}
