// Builds .docx files (Word) for the CV and the cover letter, entirely in the
// browser: WordprocessingML parts packed into a ZIP written by hand, so no
// library or network access is needed. The layout is a single column that
// stays fully editable in Word; colours and fonts follow the chosen template.
window.CVDocx = (() => {
  'use strict';

  // ---------- ZIP (stored, no compression) ----------

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const DOS_DATE = 0x21; // 1980-01-01; the timestamp carries no meaning here

  function zip(files) {
    const enc = new TextEncoder();
    const parts = [];
    const central = [];
    let offset = 0;
    files.forEach((f) => {
      const name = enc.encode(f.name);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true); // UTF-8 names
      local.setUint16(12, DOS_DATE, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      parts.push(new Uint8Array(local.buffer), name, data);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(14, DOS_DATE, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, data.length, true);
      cen.setUint32(24, data.length, true);
      cen.setUint16(28, name.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const centralSize = central.reduce((n, b) => n + b.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  // ---------- WordprocessingML helpers ----------

  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    + 'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    + 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    + 'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

  // A4 with 2 cm margins, in twentieths of a point.
  const PAGE_W = 11906;
  const PAGE_H = 16838;
  const MARGIN = 1134;
  const TEXT_W = PAGE_W - 2 * MARGIN;

  const LANG_TAG = { pl: 'pl-PL', uk: 'uk-UA', en: 'en-GB' };
  const GREY = '64748B';

  // Escapes text and drops characters XML 1.0 does not allow.
  const x = (s) => String(s ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // One run; `o` can set b, i, caps, color, sz (half-points), font.
  function run(text, o = {}) {
    const props = [
      o.font && `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>`,
      o.b && '<w:b/>',
      o.i && '<w:i/>',
      o.caps && '<w:caps/>',
      o.color && `<w:color w:val="${o.color}"/>`,
      o.sz && `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`,
    ].filter(Boolean).join('');
    const rPr = props ? `<w:rPr>${props}</w:rPr>` : '';
    return String(text).split('\n').map((line, i) => {
      const pieces = line.split('\t').map((seg, j) => `${j ? '<w:tab/>' : ''}${seg ? `<w:t xml:space="preserve">${x(seg)}</w:t>` : ''}`);
      return `<w:r>${rPr}${i ? '<w:br/>' : ''}${pieces.join('')}</w:r>`;
    }).join('');
  }

  // One paragraph; `o` can set style, align, after/before (spacing), keepNext,
  // rightTab (a right-aligned tab stop at the text edge), shade, indent.
  function para(runs, o = {}) {
    const props = [
      o.style && `<w:pStyle w:val="${o.style}"/>`,
      o.keepNext && '<w:keepNext/>',
      o.shade && `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`,
      o.rightTab && `<w:tabs><w:tab w:val="right" w:pos="${o.rightTab}"/></w:tabs>`,
      (o.after != null || o.before != null) && `<w:spacing${o.before != null ? ` w:before="${o.before}"` : ''}${o.after != null ? ` w:after="${o.after}"` : ''}/>`,
      o.indent && `<w:ind w:left="${o.indent}" w:right="${o.indent}"/>`,
      o.align && `<w:jc w:val="${o.align}"/>`,
    ].filter(Boolean).join('');
    return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ''}${Array.isArray(runs) ? runs.join('') : runs}</w:p>`;
  }

  // Square photo, shown round, inline in its own paragraph.
  function photoRun(size) {
    const emu = Math.round(size * 12700); // points -> EMU
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
      + `<wp:extent cx="${emu}" cy="${emu}"/><wp:docPr id="1" name="Photo"/>`
      + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
      + '<pic:nvPicPr><pic:cNvPr id="1" name="photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr>'
      + '<pic:blipFill><a:blip r:embed="rIdPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu}" cy="${emu}"/></a:xfrm>`
      + '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom></pic:spPr>'
      + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }

  // Borderless table holding the header: text on the left, optional photo on
  // the right. With `shade` the cells form a coloured band with inner padding.
  function headerTable(leftXml, { shade, photo }) {
    const photoW = photo ? 2000 : 0;
    const leftW = TEXT_W - photoW;
    const pad = shade ? 280 : 0;
    const cell = (w, inner) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ''}<w:vAlign w:val="center"/></w:tcPr>${inner}</w:tc>`;
    return '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblLayout w:type="fixed"/>'
      + `<w:tblCellMar><w:top w:w="${pad}" w:type="dxa"/><w:left w:w="${pad}" w:type="dxa"/>`
      + `<w:bottom w:w="${pad}" w:type="dxa"/><w:right w:w="${pad}" w:type="dxa"/></w:tblCellMar></w:tblPr>`
      + `<w:tblGrid><w:gridCol w:w="${leftW}"/>${photo ? `<w:gridCol w:w="${photoW}"/>` : ''}</w:tblGrid><w:tr>`
      + cell(leftW, leftXml)
      + (photo ? cell(photoW, para(photoRun(78), { align: 'right', after: 0 })) : '')
      + '</w:tr></w:tbl>';
  }

  function styles(font, accent, lang, nameColor) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/><w:color w:val="1E293B"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="${lang}"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:b/><w:color w:val="${nameColor}"/><w:sz w:val="52"/><w:szCs w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:color w:val="${accent}"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="120"/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="${accent}"/></w:pBdr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="${accent}"/><w:spacing w:val="20"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr><w:spacing w:after="20"/></w:pPr></w:style>
</w:styles>`;
  }

  const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

  function packageDocx(bodyXml, { font, accent, lang, nameColor, photo }) {
    const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="${PAGE_W}" w:h="${PAGE_H}"/><w:pgMar w:top="${MARGIN}" w:right="${MARGIN}" w:bottom="${MARGIN}" w:left="${MARGIN}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const files = [
      {
        name: '[Content_Types].xml',
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`,
      },
      {
        name: '_rels/.rels',
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
      },
      {
        name: 'word/_rels/document.xml.rels',
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${photo ? '<Relationship Id="rIdPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/photo.jpeg"/>' : ''}</Relationships>`,
      },
      { name: 'word/document.xml', data: document },
      { name: 'word/styles.xml', data: styles(font, accent, lang, nameColor) },
      { name: 'word/numbering.xml', data: NUMBERING },
    ];
    if (photo) files.push({ name: 'word/media/photo.jpeg', data: photo });
    return zip(files);
  }

  // ---------- Content ----------

  function look(state) {
    const accent = state.accent.replace('#', '').toUpperCase();
    return {
      accent,
      font: state.template === 'classic' ? 'Cambria' : 'Calibri',
      // "Bold" puts the header on a coloured band, so the name turns white.
      band: state.template === 'bold' ? accent : null,
      nameColor: state.template === 'bold' ? 'FFFFFF' : state.template === 'minimal' ? '1E293B' : accent,
      lang: LANG_TAG[state.docLang] || 'pl-PL',
    };
  }

  // Name, title and contact line; on a colour band for the "bold" template.
  function header(state, L, photo) {
    const white = L.band ? 'FFFFFF' : null;
    const contact = [state.email, state.phone, state.location, state.website].map((s) => s.trim()).filter(Boolean).join('  ·  ');
    const inner = [
      para(run(state.fullName.trim() || ' ', white ? { color: white } : {}), { style: 'Title' }),
      state.title.trim() && para(run(state.title.trim(), white ? { color: white } : {}), { style: 'Subtitle' }),
      contact && para(run(contact, { color: white || GREY, sz: 18 }), { after: L.band ? 0 : 120 }),
    ].filter(Boolean).join('');
    if (!photo && !L.band) return inner;
    // Word needs a paragraph between a table and whatever follows it.
    return headerTable(inner, { shade: L.band, photo }) + para('', { after: 0 });
  }

  function buildCv(state, { doc, filled, photo }) {
    const L = look(state);
    const out = [header(state, L, photo)];
    const heading = (t) => para(run(t), { style: 'Heading1' });
    const datesOf = (e) => [e.start, e.end].map((s) => (s || '').trim()).filter(Boolean).join(' – ');
    const entryHead = (title, date) => para(
      [run(title, { b: true }), date ? run(`\t${date}`, { color: GREY, sz: 19 }) : ''],
      { rightTab: TEXT_W, keepNext: true, after: 0 },
    );

    if (state.summary.trim()) out.push(heading(doc.profile), para(run(state.summary.trim())));

    const jobs = filled(state.experience, ['role', 'company']);
    if (jobs.length) {
      out.push(heading(doc.experience));
      jobs.forEach((e) => {
        out.push(entryHead(e.role.trim() || e.company.trim(), datesOf(e)));
        if (e.role.trim() && e.company.trim()) out.push(para(run(e.company.trim(), { color: '475569' }), { after: 40, keepNext: true }));
        (e.description || '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
          .forEach((b) => out.push(para(run(b), { style: 'ListBullet' })));
        out.push(para('', { after: 60 }));
      });
    }

    const schools = filled(state.education, ['school', 'degree']);
    if (schools.length) {
      out.push(heading(doc.education));
      schools.forEach((e) => {
        out.push(entryHead(e.school.trim() || e.degree.trim(), datesOf(e)));
        if (e.school.trim() && e.degree.trim()) out.push(para(run(e.degree.trim(), { color: '475569' }), { after: 120 }));
      });
    }

    const certs = filled(state.certificates, ['name', 'issuer']);
    if (certs.length) {
      const { heading: title, label } = window.CVI18N.certSection(certs, doc);
      out.push(heading(title));
      certs.forEach((c) => {
        out.push(entryHead(c.name.trim() || c.issuer.trim(), (c.date || '').trim()));
        const sub = [label(c), c.name.trim() ? c.issuer.trim() : ''].filter(Boolean).join(' · ');
        if (sub) out.push(para(run(sub, { color: '475569' }), { after: 120 }));
      });
    }

    const skills = filled(state.skills, ['name']);
    if (skills.length) {
      out.push(heading(doc.skills));
      if (state.skillBars) {
        skills.forEach((s) => {
          const level = Math.min(5, Math.max(1, Number(s.level) || 3));
          out.push(para([
            run(s.name.trim()),
            run(`\t${'●'.repeat(level)}`, { color: L.accent }),
            run('●'.repeat(5 - level), { color: 'CBD5E1' }),
          ], { rightTab: 4800, after: 20 }));
        });
      } else {
        out.push(para(run(skills.map((s) => s.name.trim()).join(', '))));
      }
    }

    const langs = filled(state.languages, ['name']);
    if (langs.length) {
      out.push(heading(doc.languages));
      langs.forEach((l) => {
        out.push(para([run(l.name.trim()), run(`\t${l.level === 'ojczysty' ? doc.native : l.level}`, { color: GREY })], { rightTab: 4800, after: 20 }));
      });
    }

    const interests = state.interests.split(',').map((s) => s.trim()).filter(Boolean);
    if (interests.length) out.push(heading(doc.interests), para(run(interests.join(', '))));

    if (state.consentEnabled && state.consent.trim()) {
      out.push(para(run(state.consent.trim(), { color: GREY, sz: 15 }), { before: 360 }));
    }
    return packageDocx(out.join(''), { ...L, photo });
  }

  function buildLetter(state, { doc, dateLine }) {
    const L = look(state);
    const S = state.letter;
    const out = [header(state, L, null)];
    if (!L.band) {
      out.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="'
        + `${L.accent}"/></w:pBdr><w:spacing w:after="240"/></w:pPr></w:p>`);
    } else {
      out.push(para('', { after: 240 }));
    }
    out.push(para(run(S.date.trim() || dateLine), { align: 'right', after: 360 }));

    const to = [
      S.recipient.trim() && run(S.recipient.trim(), { b: true }),
      S.company.trim() && run(S.company.trim(), { b: true }),
      S.address.trim() && run(S.address.trim()),
    ].filter(Boolean);
    if (to.length) out.push(para(to.map((r, i) => (i ? `<w:r><w:br/></w:r>${r}` : r)), { after: 360 }));

    if (S.position.trim()) out.push(para(run(doc.subject(S.position.trim()), { b: true }), { after: 240 }));
    if (S.greeting.trim()) out.push(para(run(S.greeting.trim()), { after: 160 }));
    S.body.trim().split(/\n\s*\n/).forEach((p) => out.push(para(run(p.trim()), { align: 'both', after: 160 })));
    if (S.closing.trim()) out.push(para(run(S.closing.trim()), { before: 200, after: 480 }));
    out.push(para(run(state.fullName.trim(), { b: true })));

    if (S.consentEnabled && state.consent.trim()) {
      out.push(para(run(state.consent.trim(), { color: GREY, sz: 15 }), { before: 720 }));
    }
    return packageDocx(out.join(''), { ...L, photo: null });
  }

  return { buildCv, buildLetter, crc32 };
})();
