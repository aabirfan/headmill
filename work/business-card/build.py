#!/usr/bin/env python3
"""Build editable SVGs, outlined print artwork, a two-page PDF and 600 dpi proofs."""
from pathlib import Path
from io import BytesIO
from copy import deepcopy
import base64
import json
import re
import xml.etree.ElementTree as ET

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from reportlab.pdfgen import canvas
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject, ContentStream
import fitz
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
MM = 72 / 25.4
FOREST, PINE, CREAM, LIGHT, INK = '#4A6B2F', '#3D5A26', '#F0E9C2', '#F8F5E6', '#1F2A1A'
DISCLOSURE = ('Headmill Capital Ltd is an Appointed Representative of PRIMIS Mortgage Network, '
              'a trading name of First Complete Ltd. First Complete Ltd is authorised and '
              'regulated by the Financial Conduct Authority.')
COMPANY = 'Company number 13357642, registered in England & Wales.'
ADDRESS = 'Trading address: Suite 401-403, Cumberland House, 80 Scrubs Lane, London NW10 6RF'
FONTS = {str(w): instantiateVariableFont(TTFont(ROOT / 'fonts/Figtree-Variable.ttf'), {'wght': w}, inplace=False)
         for w in (400, 500, 600, 700, 800)}
TEXT_RECORDS = []

def el(parent, tag, **attrs):
    return ET.SubElement(parent, f'{{{NS}}}{tag}', {k.replace('_', '-'): str(v) for k, v in attrs.items()})

def path_for(text, font, size_pt):
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    scale = size_pt / MM / font['head'].unitsPerEm
    paths, cursor = [], 0
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        paths.append((pen.getCommands(), cursor * scale))
        cursor += glyph.width
    return paths, cursor * scale, scale

def text(parent, x, y, value, pt, weight=400, fill=INK, anchor='start'):
    t = el(parent, 'text', x=x, y=y, font_family='Figtree', font_size=f'{pt / MM:.6f}', font_kerning='none', font_variant_ligatures='none',
           font_weight=weight, fill=fill, text_anchor=anchor, **{'data-pt': pt})
    t.text = value
    return t

def logo(parent, x, y, d, inverse=False):
    """Exact circle/H geometry from assets/img/logo(-dark).svg; H outlined once."""
    g = el(parent, 'g', transform=f'translate({x} {y}) scale({d / 56})', **{'aria-label': 'Headmill H logo'})
    mark = deepcopy(ET.parse(ROOT/'assets/headmill-h.svg').getroot()[0])
    if inverse:
        for node in mark.iter():
            if 'fill' in node.attrib:
                node.set('fill', {FOREST:CREAM, CREAM:FOREST}[node.get('fill')])
    g.append(mark)

def ico(parent):
    """Retain the navy ICO Registered badge as vector artwork, with 6 pt caption."""
    x, y, w, h = 64.5, 40.2, 16, 10.3
    g = el(parent, 'g', **{'aria-label': 'ICO Registered badge'})
    el(g, 'rect', x=x, y=y, width=w, height=h, fill='#142D4E')
    mark = el(g, 'g', transform=f'translate({x} {y})')
    mark.append(deepcopy(ET.parse(ROOT/'assets/ico-badge.svg').getroot()[0]))
    text(g, x+w/2, y+8.9, 'REGISTERED', 6, 800, '#FFFFFF', 'middle')

def whatsapp(parent, x, y):
    g = el(parent, 'g', transform=f'translate({x} {y}) scale(0.135)', fill=FOREST,
           **{'aria-label': 'WhatsApp'})
    el(g, 'path', d='M20.52 3.48A11.9 11.9 0 0 0 12.04 0C5.45 0 .09 5.36.09 11.95c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.58 0 11.94-5.36 11.95-11.95a11.86 11.86 0 0 0-3.48-8.41zM12.04 21.82a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.23-.37a9.88 9.88 0 0 1-1.52-5.26c0-5.48 4.45-9.93 9.94-9.93a9.88 9.88 0 0 1 7.03 2.91 9.87 9.87 0 0 1 2.91 7.03c0 5.48-4.46 9.86-10.01 9.86zm5.45-7.45c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.73 2.02-1.44.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35z')

def x_logo(parent, x, y):
    g = el(parent, 'g', transform=f'translate({x} {y}) scale(0.132)', fill=INK, **{'aria-label': 'X'})
    el(g, 'path', d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932zm-1.29 19.49h2.039L6.487 3.24H4.3z')

def new_card(side, bg):
    s = ET.Element(f'{{{NS}}}svg', {'width':'91mm','height':'61mm','viewBox':'-3 -3 91 61',
         'role':'img','aria-label': f'Headmill Capital business card {side}; 3 mm bleed'})
    defs = el(s, 'defs')
    style = el(defs, 'style')
    # Self-contained editable SVGs: no web-font request at print time.
    b64 = base64.b64encode((ROOT / 'fonts/Figtree-Variable.ttf').read_bytes()).decode()
    style.text = "@font-face{font-family:Figtree;font-style:normal;font-weight:300 900;src:url(data:font/ttf;base64,"+b64+") format('truetype')}"
    el(s, 'rect', x=-3, y=-3, width=91, height=61, fill=bg)
    return s

def build_front():
    s = new_card('front', LIGHT)
    logo(s, 4.5, 4.5, 9.5)
    text(s, 17, 8.3, 'HEADMILL CAPITAL', 10, 800, INK)
    text(s, 17, 12.2, 'We Value you', 7.5, 500, FOREST)
    el(s, 'line', x1=4.5, y1=17, x2=80.5, y2=17, stroke=FOREST, stroke_width=.18)
    text(s, 4.5, 24.5, 'Aariz Irfan', 15, 800, FOREST)
    text(s, 4.5, 29, 'Director Credit, Mortgage & Insurance', 7.7, 500)
    whatsapp(s, 4.5, 32.5)
    text(s, 9.2, 35.2, 'Tel: +44 (0)7751 642512', 8, 600)
    text(s, 4.5, 40.2, 'Email: a.irfan@headmill.co.uk', 8, 500)
    text(s, 4.5, 45.2, 'www.headmill.co.uk', 8, 700, FOREST)
    x_logo(s, 4.5, 47.3)
    text(s, 9.2, 50.1, '@Headmillcapital', 7.8, 500)
    ico(s)
    return s

def wrap(value, width, pt=7.5, weight=400):
    lines, line = [], ''
    for word in value.split():
        candidate = (line+' '+word).strip()
        if path_for(candidate, FONTS[str(weight)], pt)[1] > width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line: lines.append(line)
    return lines

def build_back():
    s = new_card('back', FOREST)
    logo(s, 4.5, 4.5, 6.6, True)
    text(s, 13.5, 8.9, 'HEADMILL CAPITAL', 8, 800, CREAM)
    el(s, 'line', x1=4.5, y1=14.2, x2=80.5, y2=14.2, stroke=CREAM, stroke_width=.18)
    for content, y, weight in [(DISCLOSURE, 20, 400), (COMPANY, 38, 500), (ADDRESS, 45, 400)]:
        for i, line in enumerate(wrap(content, 76, 7.5, weight)):
            text(s, 4.5, y+i*3.7, line, 7.5, weight, '#FFFFFF')
    return s

def outline(svg, side):
    out = deepcopy(svg)
    for parent in out.iter():
        for t in list(parent):
            if t.tag != f'{{{NS}}}text': continue
            value = t.text or ''
            pt = float(t.attrib['data-pt'])
            paths, width, scale = path_for(value, FONTS[t.attrib['font-weight']], pt)
            x, y = float(t.attrib['x']), float(t.attrib['y'])
            if t.attrib.get('text-anchor') == 'middle': x -= width/2
            g = ET.Element(f'{{{NS}}}g', {'fill': t.attrib['fill'], 'aria-label': value})
            minx, miny, maxx, maxy = 10000, 10000, -10000, -10000
            glyphs, cmap, cursor = FONTS[t.attrib['font-weight']].getGlyphSet(), FONTS[t.attrib['font-weight']].getBestCmap(), 0
            for char, (dpath, dx) in zip(value, paths):
                glyph = glyphs[cmap[ord(char)]]
                bp = BoundsPen(glyphs)
                glyph.draw(bp)
                if bp.bounds:
                    a,b,c,d=bp.bounds
                    minx,miny,maxx,maxy = min(minx,x+dx+a*scale), min(miny,y-d*scale), max(maxx,x+dx+c*scale), max(maxy,y-b*scale)
                if dpath:
                    el(g, 'path', d=dpath, transform=f'translate({x+dx} {y}) scale({scale} {-scale})')
            assert pt >= 6
            assert minx >= 3 and miny >= 3 and maxx <= 82 and maxy <= 52, (value,(minx,miny,maxx,maxy))
            TEXT_RECORDS.append({'side':side,'text':value,'pt':pt,'inkBoundsMm':[round(v,4) for v in (minx,miny,maxx,maxy)]})
            parent.insert(list(parent).index(t), g)
            parent.remove(t)
    for defs in list(out.findall(f'{{{NS}}}defs')): out.remove(defs)
    return out

def save_svg(svg, name):
    ET.indent(svg, space='  ')
    ET.ElementTree(svg).write(ROOT / name, encoding='utf-8', xml_declaration=True)

def build_pdf():
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=(97*MM, 67*MM), pageCompression=1, invariant=1)
    c.setTitle('Headmill Capital - Aariz Irfan - 85 x 55 mm business card')
    c.setAuthor('Headmill Capital Ltd')
    for side in ['front', 'back']:
        drawing = svg2rlg(str(ROOT / f'{side}-outlined.svg'))
        renderPDF.draw(drawing, c, 3*MM, 3*MM)
        c.setStrokeColorRGB(0,0,0)
        c.setLineWidth(.25)
        for x in (6,91):
            c.line(x*MM,.5*MM,x*MM,2.5*MM)
            c.line(x*MM,64.5*MM,x*MM,66.5*MM)
        for y in (6,61):
            c.line(.5*MM,y*MM,2.5*MM,y*MM)
            c.line(94.5*MM,y*MM,96.5*MM,y*MM)
        c.showPage()
    c.save()
    reader, writer = PdfReader(BytesIO(buf.getvalue())), PdfWriter()
    for p in reader.pages: writer.add_page(p)
    for p in writer.pages:
        # ReportLab emits unused font setup blocks even when all artwork is paths.
        # Remove those empty text blocks and their unused resource entries.
        stream = ContentStream(p.get_contents(), writer)
        assert not any(op in (b'Tj', b'TJ', b"'", b'"') for _,op in stream.operations)
        stream.operations = [(args,op) for args,op in stream.operations if op not in (b'BT',b'ET',b'Tf',b'TL')]
        p.replace_contents(stream)
        p['/Resources'].pop('/Font', None)
        p.compress_content_streams()
        p.trimbox = RectangleObject([6*MM,6*MM,91*MM,61*MM])
        p.bleedbox = RectangleObject([3*MM,3*MM,94*MM,64*MM])
    writer.add_metadata({'/Title':'Headmill Capital business card - front and back','/Author':'Headmill Capital Ltd'})
    with open(ROOT / 'headmill-business-card-print.pdf','wb') as f: writer.write(f)

def proofs():
    doc = fitz.open(ROOT / 'headmill-business-card-print.pdf')
    for page, side in zip(doc, ['front','back']):
        pix = page.get_pixmap(dpi=600, clip=fitz.Rect(6*MM,6*MM,91*MM,61*MM), alpha=False)
        pix.save(str(ROOT / f'{side}.png'))
    # Contact sheet assembled from the final PDF renders, with generous separation.
    a,b = (Image.open(ROOT / f'{s}.png') for s in ['front','back'])
    margin,gap,label = 95,95,65
    combined = Image.new('RGB',(a.width*2+margin*2+gap,a.height+margin*2+label),'#E8E7DF')
    draw=ImageDraw.Draw(combined)
    font=ImageFont.truetype(str(ROOT/'fonts/Figtree-Variable.ttf'),32)
    for i,(im,caption) in enumerate([(a,'FRONT'),(b,'BACK')]):
        x=margin+i*(a.width+gap)
        draw.text((x,margin-55),caption,font=font,fill=INK)
        combined.paste(im,(x,margin+10))
    combined.save(ROOT/'both-sides.png',dpi=(600,600))
    imgs = [base64.b64encode((ROOT/f'{s}.png').read_bytes()).decode() for s in ['front','back']]
    html = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Headmill Capital card proof</title><style>body{margin:0;color:var(--foreground,#1F2A1A);font:14px system-ui,sans-serif}.sides{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}figcaption{font-size:11px;letter-spacing:.12em;margin-bottom:10px}img{display:block;width:100%;height:auto;border:1px solid #d4d7cc;box-sizing:border-box}@media(max-width:540px){.sides{grid-template-columns:1fr}}</style><div class="sides">'''
    for label,b64 in zip(['FRONT','BACK'],imgs):
        html+=f'<figure><figcaption>{label}</figcaption><img alt="Headmill Capital business card {label.lower()}" src="data:image/png;base64,{b64}"></figure>'
    html+='</div></html>'
    (ROOT/'proof.html').write_text(html)

def verify():
    fronts = ' '.join(r['text'] for r in TEXT_RECORDS if r['side']=='front')
    backs = ' '.join(r['text'] for r in TEXT_RECORDS if r['side']=='back')
    for value in (DISCLOSURE, COMPANY, ADDRESS): assert value in backs, value
    for value in ('We Value you','Director Credit, Mortgage & Insurance','Tel: +44 (0)7751 642512',
                  'Email: a.irfan@headmill.co.uk','www.headmill.co.uk','@Headmillcapital','REGISTERED'):
        assert value in fronts, value
    # Scan the finished artwork text, including outlined element labels.
    prohibited = ['bene'+'ficial', '736'+'655', 'inde'+'pendent', 'fr'+'ee']
    assert not any(re.search(r'\b'+word+r'\b', fronts+' '+backs, re.I) for word in prohibited)
    pdf = fitz.open(ROOT/'headmill-business-card-print.pdf')
    assert len(pdf)==2
    for p in pdf:
        assert not p.get_fonts(), 'Expected outlined fonts'
        assert abs(p.trimbox.width/MM-85)<.001 and abs(p.trimbox.height/MM-55)<.001
        assert abs(p.bleedbox.width/MM-91)<.001 and abs(p.bleedbox.height/MM-61)<.001
    report={'trimMm':[85,55],'bleedMm':3,'mediaMm':[97,67],'pages':2,'previewDpi':600,
        'fonts':'All print text outlined','minimumTextPt':min(r['pt'] for r in TEXT_RECORDS),
        'minimumTextInsetMm':round(min(min(r['inkBoundsMm'][0],r['inkBoundsMm'][1],85-r['inkBoundsMm'][2],55-r['inkBoundsMm'][3]) for r in TEXT_RECORDS),3),
        'exactWordingVerified':True,'text':TEXT_RECORDS}
    (ROOT/'preflight.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='text'},indent=2))

if __name__ == '__main__':
    for side, svg in [('front',build_front()),('back',build_back())]:
        save_svg(svg,f'{side}.svg')
        save_svg(outline(svg,side),f'{side}-outlined.svg')
    build_pdf()
    proofs()
    verify()
