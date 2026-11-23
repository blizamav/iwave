"""Auditoría estática SEO-028 sin dependencias, red ni acceso a .env."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser
import json, struct, hashlib, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[2]
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Audit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.errors=[]; self.ids=[]; self.links=[]; self.refs=[]; self.images=[]; self.headings=[]; self.meta=[]; self.html={}; self.jsonld=[]; self.in_json=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag not in VOID: self.stack.append(tag)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='html': self.html=a
        if tag=='a': self.links.append(a.get('href',''))
        if tag=='meta': self.meta.append(a)
        if tag=='img': self.images.append(a)
        if tag in ['h1','h2','h3','h4','h5','h6']: self.headings.append(tag)
        for field in ['src','href']:
            if field in a and tag!='a': self.refs.append((tag,a[field]))
        if tag=='script' and a.get('type')=='application/ld+json': self.in_json=True
    def handle_endtag(self,tag):
        if tag in VOID:return
        if tag=='script':self.in_json=False
        if not self.stack or self.stack[-1]!=tag:self.errors.append('Cierre inesperado '+tag)
        else:self.stack.pop()
    def handle_data(self,data):
        if self.in_json:self.jsonld.append(data)
source=(ROOT/'index.html').read_text(); a=Audit(); a.feed(source)
assert not a.errors and not a.stack, (a.errors,a.stack)
assert a.html['lang']=='es-CL' and a.headings.count('h1')==1
assert len(a.ids)==len(set(a.ids)), 'IDs duplicados'
for href in a.links:
    if href.startswith('#') and len(href)>1:assert href[1:] in a.ids, href
    if href.startswith('http'):assert urlsplit(href).scheme in ['https','http'] and urlsplit(href).netloc
for image in a.images:
    assert 'alt' in image and image['width'].isdigit() and image['height'].isdigit(),image
for tag,ref in a.refs:
    if ref.startswith(('http:','https:','#','data:')):continue
    assert (ROOT/urlsplit(ref).path.lstrip('/')).is_file(),ref
names=Counter(x.get('name') for x in a.meta if x.get('name'))
props=Counter(x.get('property') for x in a.meta if x.get('property'))
assert all(n==1 for n in names.values()) and all(n==1 for n in props.values())
assert names['description']==names['robots']==names['viewport']==1
ld=json.loads(''.join(a.jsonld));assert ld['@context']=='https://schema.org';graph=ld['@graph']
assert Counter(n['@type'] for n in graph)=={'Organization':1,'WebSite':1,'Service':4}
assert len({n['@id'] for n in graph})==6
org=next(n for n in graph if n['@type']=='Organization');assert org['name']=='iWave' and org['url']=='https://iwave.cl/'
assert not any(k in org for k in ['sameAs','address','aggregateRating','review'])
for service in (n for n in graph if n['@type']=='Service'):assert service['provider']['@id']==org['@id']
sitemap=ET.parse(ROOT/'sitemap.xml'); urls=[n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')];assert urls==['https://iwave.cl/']
rp=RobotFileParser();rp.parse((ROOT/'robots.txt').read_text().splitlines())
for bot in ['Googlebot','Bingbot']:
    for url in ['/','/styles.css','/script.js','/img/logo/favicon-48x48.png','/img/experience/vendor/three.module.min.js']:assert rp.can_fetch(bot,'https://iwave.cl'+url)
    for url in ['/api/contact','/healthz','/.env','/docs/contact-form/QA.md']:assert not rp.can_fetch(bot,'https://iwave.cl'+url)
icon=(ROOT/'favicon.ico').read_bytes();assert struct.unpack_from('<HHH',icon)==(0,1,3)
assert [icon[6+i*16] for i in range(3)]==[16,32,48]
def dimensions(file):
    b=file.read_bytes()
    if b[:8]==b'\x89PNG\r\n\x1a\n':return list(struct.unpack_from('>II',b,16))
    if b[:2]==b'\xff\xd8':
        p=2
        while p<len(b)-8:
            if b[p]!=255:p+=1;continue
            marker=b[p+1];p+=2
            if marker in [0xD8,0xD9]:continue
            length=struct.unpack_from('>H',b,p)[0]
            if marker in [0xC0,0xC1,0xC2,0xC3]:
                h,w=struct.unpack_from('>HH',b,p+3);return [w,h]
            p+=length
    if file.suffix=='.svg':
        element=ET.fromstring(b);return element.attrib.get('viewBox')
    return None
images=[]
for file in sorted((ROOT/'img').rglob('*')):
    if file.suffix.lower() not in ['.jpg','.jpeg','.png','.svg','.webp','.avif','.ico']:continue
    rel=file.relative_to(ROOT).as_posix(); images.append({'path':rel,'bytes':file.stat().st_size,'dimensions':dimensions(file),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
report={'htmlBalanced':True,'lang':'es-CL','headings':dict(Counter(a.headings)),'imageElements':len(a.images),'allImagesHaveAltAndDimensions':True,'internalLinksValid':True,'linkedLocalResourcesExist':True,'structuredDataTypes':dict(Counter(n['@type'] for n in graph)),'sitemapURLs':urls,'googleAndBingAllowed':True,'icoFrames':[16,32,48],'images':images,'externalLinks':sorted(set(h for h in a.links if h.startswith('http')))}
(ROOT/'docs/seo028/audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['images','externalLinks']},ensure_ascii=False))
