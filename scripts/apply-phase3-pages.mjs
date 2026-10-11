/**
 * Remaining English hubs, comparisons, and Bahasa Malaysia Tier 1 pages.
 * Does not rewrite existing sentences. Skips a file that already has its h1 id.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
const DATE = '2026-10-11';
const DATE_LABEL = '11 October 2026';
const about = fs.readFileSync(path.join(pub, 'about.html'), 'utf8');
const bodyAt = about.indexOf('<body');
const headerEnd = about.indexOf('</div>', about.indexOf('</header>')) + '</div>'.length;
const chromeHead = about.slice(bodyAt, headerEnd).replace(
    'class="page-about"',
    'class="page-about page-malaysia page-live-casino"',
);
const footer = about.slice(about.indexOf('<div class="site-footer-inlined"'));

function words(s) {
    return s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter(Boolean).length;
}
function strip(html) {
    return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
}
function badges() {
    return `<ul class="malaysia-listing-meta__trust" aria-label="Trust indicators">
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="lock"></i></span><span>Secure</span></li>
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="thumbs-up"></i></span><span>Trusted</span></li>
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="circle-check"></i></span><span>Verified</span></li>
                    </ul>`;
}

const pages = [];
const errors = [];
function addPage(p) {
    const n = words(p.answer);
    const problems = [];
    if (n < 40 || n > 60) problems.push(`answer ${n} words`);
    if (p.title.length > 60) problems.push(`title ${p.title.length}`);
    if (p.description.length < 140 || p.description.length > 160) problems.push(`desc ${p.description.length}`);
    const blob = `${p.h1} ${strip(p.answer)}`.toLowerCase();
    if (!blob.includes(p.keyword.toLowerCase())) problems.push(`missing keyword ${p.keyword}`);
    if (problems.length) errors.push(`${p.dir || ''}/${p.slug}: ${problems.join('; ')} :: ${p.description}`);
    pages.push(p);
}

function table(caption, headers, rows) {
    const th = headers.map((h) => `<th scope="col">${h}</th>`).join('');
    const tr = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">${caption}</caption><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
}
function unverified(caption, labels) {
    return table(caption, ['Check', `Status on ${DATE_LABEL}`], labels.map((l) => [l, 'Not yet verified']));
}

const legal = '/online-casino-malaysia-legal';
const citesLaw = [
    ["Attorney General's Chambers, Laws of Malaysia", 'https://lom.agc.gov.my/'],
    ['CommonLII reprint, Common Gaming Houses Act 1953', 'https://www.commonlii.org/my/legis/consol_act/cgha19531983289/'],
    ['CommonLII reprint, Betting Act 1953', 'https://www.commonlii.org/my/legis/consol_act/ba19531992166/'],
];
const citesPay = [
    ['PayNet home', 'https://paynet.my/index.html'],
    ['PayNet FPX', 'https://www.paynet.my/business-solutions/fpx.html'],
    ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
];

addPage({
    slug: 'mahjong-ways',
    title: 'Mahjong Ways Slot | 888reviews',
    description: 'Mahjong Ways is a PG Soft slot. This hub does not publish an RTP, a jackpot, or a list of casinos that offer it. Check the in-game paytable. 18+.',
    h1: 'Mahjong Ways',
    keyword: 'Mahjong Ways',
    kicker: 'PG Soft slot · RTP not yet verified',
    answer: 'Mahjong Ways is a slot title associated with PG Soft. 888reviews has not verified the RTP, the paytable, or which Malaysian cashiers offer the game. Open the information screen in the version you are dealt. A demo result is not a real-money result. This is not a ranking.',
    sections: [
        { h: 'What is not verified', html: unverified('Mahjong Ways checks', ['Published RTP and game version', 'Which casinos list the title', 'Whether a demo matches the paid version']) + `<p>The studio page for the series is the place to confirm the title name. Our <a href="/pg-soft-slots-malaysia">PG Soft</a> note and the <a href="/slots">slots hub</a> do not add a measured RTP either.</p>` },
        { h: 'How to use a review', html: `<p>If a <a href="/reviews">casino review</a> names the game, that is not proof the cashier still offers it or that the RTP matches the studio default. Read <a href="${legal}">the legal page</a> before you treat a slot listing as permission to play.</p>` },
    ],
    citations: [
        ['PG Soft', 'https://www.pgsoft.com/'],
        ...citesLaw.slice(0, 2),
    ],
    links: [['/pg-soft-slots-malaysia', 'PG Soft'], ['/slots', 'Slots'], ['/slot-demo-malaysia', 'Demos'], [legal, 'Legal page']],
    faqs: [
        ['What is the RTP of Mahjong Ways?', 'Not yet verified. RTP can differ by game version. Use the information screen in the game you open, not a number copied from another site.'],
        ['Which casino in Malaysia has Mahjong Ways?', 'Not yet verified. This page does not name an operator.'],
        ['Does a demo pay real money?', 'No. A demo, where one exists, is practice. It is not a withdrawal and not a prediction of a paid session. See the demo note.'],
        ['Is this game licensed in Malaysia?', 'A game title is not a Malaysian licence. Read the legal page. This is not legal advice.'],
    ],
});

addPage({
    slug: 'pg-soft-slots-malaysia',
    title: 'PG Soft Slots Malaysia | 888reviews',
    description: 'PG Soft publishes its own slot list. This page does not verify which Malaysian casinos carry those games or which RTP setting is live. Check the paytable. 18+.',
    h1: 'PG Soft slots Malaysia',
    keyword: 'PG Soft Malaysia',
    kicker: 'Studio note · Casino line-up not yet verified',
    answer: 'PG Soft Malaysia searches usually mean the studio\'s slots inside a casino lobby. 888reviews has not verified which operators offer that lobby, or which RTP setting is switched on. Use the studio\'s own game list, then the in-game paytable. A review row is not that paytable.',
    sections: [
        { h: 'Studio versus casino', html: `<p>PG Soft is the studio. A casino is a separate company that may or may not list those games. Those are two checks, and both are open on this page.</p>` + unverified('PG Soft checks', ['Games the casino actually lists', 'RTP configuration in the live version', 'MYR cashier on the same account']) },
        { h: 'Related pages', html: `<p>Start with <a href="/mahjong-ways">Mahjong Ways</a>, the <a href="/slots">slots hub</a>, and <a href="/slot-demo-malaysia">demos</a>. Currency checks sit on the <a href="/best-online-casino-malaysia-ringgit">MYR page</a>.</p>` },
    ],
    citations: [['PG Soft', 'https://www.pgsoft.com/'], ...citesPay.slice(0, 2)],
    links: [['/mahjong-ways', 'Mahjong Ways'], ['/slots', 'Slots'], ['/slot-demo-malaysia', 'Demos'], ['/reviews', 'Reviews']],
    faqs: [
        ['Which PG Soft games are available in Malaysia?', 'Not yet verified operator by operator. Availability is whatever the signed-in lobby shows.'],
        ['Do all PG Soft games share one RTP?', 'No assumption is published here. Check each game\'s information screen. Versions can differ.'],
        ['Is PG Soft a Malaysian licence?', 'No. A studio is not a gambling licence for a casino. See the legal page.'],
        ['Where are demos explained?', 'On the slot demo page. A demo is not a tested withdrawal.'],
    ],
});

addPage({
    slug: 'slot-demo-malaysia',
    title: 'Slot Demo Malaysia | 888reviews',
    description: 'A slot demo lets you spin without a deposit where a casino offers one. 888reviews has not verified which games have a demo. A demo is not a cash result. 18+.',
    h1: 'Slot demo Malaysia',
    keyword: 'slot demo Malaysia',
    kicker: 'Practice spins · Availability not yet verified',
    answer: 'A slot demo Malaysia session is practice play where a casino offers it, usually without a cash withdrawal. 888reviews has not verified which titles have a demo, or whether that demo uses the same RTP as the paid game. Treat the demo as a rules preview. It does not predict a paid session.',
    sections: [
        { h: 'What a demo is not', html: unverified('Demo checks', ['Which games offer a demo', 'Whether the demo RTP matches the paid game', 'Whether winnings can be withdrawn']) + `<p>Free-credit offers are a different thing, with their own terms. See <a href="/no-deposit-bonus-malaysia">no deposit bonus Malaysia</a>.</p>` },
        { h: 'Where to look next', html: `<p>Game notes: <a href="/slots">slots</a>, <a href="/mahjong-ways">Mahjong Ways</a>, <a href="/pg-soft-slots-malaysia">PG Soft</a>. Legal reading: <a href="${legal}">the statutes page</a>.</p>` },
    ],
    citations: [['PG Soft', 'https://www.pgsoft.com/'], ...citesLaw.slice(0, 2)],
    links: [['/slots', 'Slots'], ['/no-deposit-bonus-malaysia', 'No-deposit offers'], ['/mahjong-ways', 'Mahjong Ways'], [legal, 'Legal page']],
    faqs: [
        ['Can I withdraw demo winnings?', 'Not as a general rule published here. If the mode is practice, there is no cash balance to withdraw. Read the on-screen label before you spin.'],
        ['Which slots have a Malaysia demo?', 'Not yet verified. This page does not name a title that was opened in demo mode on a dated test.'],
        ['Is a demo the same as free credit?', 'No. A demo is practice. Free credit is an operator offer that can still carry wagering. See the no-deposit page.'],
        ['Does demo play make the casino licensed?', 'No. A play mode is not a licence. Use the legal page.'],
    ],
});

addPage({
    slug: 'sic-bo-malaysia',
    title: 'Sic Bo Malaysia | 888reviews',
    description: 'Sic bo is a dice game. Payouts depend on the table rules you open. This page does not verify a Malaysian table, a stake limit, or a house edge. Adults 18+.',
    h1: 'Sic bo Malaysia',
    keyword: 'sic bo Malaysia',
    kicker: 'Dice game · Table rules not yet verified',
    answer: 'Sic bo Malaysia pages describe a three-dice game in which payouts depend on the bet you choose and the rules printed on that table. 888reviews has not verified a live table, a stake limit, or an edge for players in Malaysia. Read the felt before you bet. This page does not name a best casino.',
    sections: [
        { h: 'Open checks', html: unverified('Sic bo checks', ['Table available while signed in', 'Bet names and payouts on that felt', 'Minimum and maximum stake']) + `<p>The <a href="/live">live hub</a> and <a href="/dragon-tiger-malaysia">dragon tiger</a> note are separate. Neither publishes a tested edge.</p>` },
        { h: 'Licence is separate', html: `<p>A dice game on a website is not a Malaysian licence. Read <a href="${legal}">the legal page</a> and confirm the operator on <a href="/reviews">the reviews</a>.</p>` },
    ],
    citations: citesLaw,
    links: [['/live', 'Live casino'], ['/dragon-tiger-malaysia', 'Dragon tiger'], ['/reviews', 'Reviews'], [legal, 'Legal page']],
    faqs: [
        ['What is sic bo?', 'A dice game, commonly three dice, with bets on totals and combinations. The payout is whatever that table prints. Do not import payouts from a different version.'],
        ['Which casino has the best sic bo for Malaysia?', 'Not yet verified. No table was timed or measured for this page.'],
        ['Is there a published house edge here?', 'No. The edge depends on the bet and the rules. This page does not copy a generic percentage onto a Malaysian table.'],
        ['Is sic bo legal because it is live?', 'No. Live video is not a licence. See the legal page. This is not legal advice.'],
    ],
});

addPage({
    slug: 'dragon-tiger-malaysia',
    title: 'Dragon Tiger Malaysia | 888reviews',
    description: 'Dragon tiger is a two-card comparison game. Commission and tie rules change the bet. This page has not verified a Malaysian table or a payout. Adults 18+ only.',
    h1: 'Dragon tiger Malaysia',
    keyword: 'dragon tiger Malaysia',
    kicker: 'Two-card game · Rules not yet verified',
    answer: 'Dragon tiger Malaysia refers to a game that compares two cards, often called dragon and tiger, plus a tie bet on some tables. 888reviews has not verified the commission, the tie rule, or the limits at a Malaysian casino. Read the table rules on screen. A generic chart is not that table.',
    sections: [
        { h: 'Open checks', html: unverified('Dragon tiger checks', ['Commission on the main bets', 'How a tie is settled', 'Table limits in the lobby']) },
        { h: 'Related notes', html: `<p>See <a href="/sic-bo-malaysia">sic bo</a>, <a href="/live">live casino</a>, and <a href="${legal}">the legal page</a>. Reviews of operators are on <a href="/reviews">the directory</a>.</p>` },
    ],
    citations: citesLaw,
    links: [['/sic-bo-malaysia', 'Sic bo'], ['/live', 'Live casino'], ['/baccarat', 'Baccarat'], [legal, 'Legal page']],
    faqs: [
        ['Is dragon tiger the same as baccarat?', 'No. Both compare hands, and the drawing rules are not the same. Use the rules on the table you joined.'],
        ['What happens on a tie?', 'Whatever that table\'s rules say. This page has not verified a single settlement rule.'],
        ['Which site is best for dragon tiger?', 'Not yet verified. No ranking is published.'],
        ['Does a live dealer make it licensed in Malaysia?', 'No. See the legal page. This is not legal advice.'],
    ],
});

addPage({
    slug: '4d-lottery-malaysia',
    title: '4D Online Malaysia | 888reviews',
    description: '4D is a numbers game with its own licensing history. This page does not sell tickets or name a site as authorised. Read the statutes. Not legal advice.',
    h1: '4D online Malaysia',
    keyword: '4D online Malaysia',
    kicker: 'Numbers games · No ticket seller named',
    answer: '4D online Malaysia is a search for number-forecast games on a website. 888reviews does not sell tickets and has not verified that any casino page is an authorised 4D draw. Read the statutes on the legal page and the operator\'s own licence claim. This page is not legal advice and not a result service.',
    sections: [
        { h: 'What this page will not do', html: `<p>There is no draw result, no forecast, and no link to a ticket cart. A casino that uses the words "4D" has made a product claim. That claim is not yet verified against a Malaysian licence.</p>` + unverified('4D checks', ['Operator named on a Malaysian number-forecast licence', 'Whether the site is that operator', 'Prize table taken from the official rules']) },
        { h: 'Where the law note sits', html: `<p>The <a href="${legal}">legal page</a> names the Common Gaming Houses Act 1953, the Betting Act 1953, and the Pool Betting Act 1967. Those reprints are not a substitute for the current text on the Attorney General\'s Chambers portal.</p>` },
    ],
    citations: citesLaw,
    links: [[legal, 'Legal page'], ['/reviews', 'Reviews'], ['/glossary', 'Glossary'], ['/editorial-team', 'Editorial team']],
    faqs: [
        ['Can I buy 4D on this website?', 'No. 888reviews does not sell tickets or take bets.'],
        ['Which online 4D site is authorised?', 'Not yet verified. Do not treat a casino logo as a number-forecast licence. Check the official text and the operator.'],
        ['Do you publish draw results?', 'No. Results belong to the operator of that draw. This page does not copy them.'],
        ['Is this legal advice?', 'No. Read the statutes and ask a qualified adviser if you need a decision about your own situation.'],
    ],
});

addPage({
    slug: 'sportsbook-casino-malaysia',
    title: 'Sportsbook Casino Malaysia | 888reviews',
    description: 'A sportsbook is a betting product, separate from a casino lobby. This page has not verified which brands offer one, or a Malaysian licence for it. Adults 18+.',
    h1: 'Sportsbook casino Malaysia',
    keyword: 'sportsbook casino Malaysia',
    kicker: 'Betting product · Not yet verified',
    answer: 'A sportsbook casino Malaysia account would be an operator that offers sports betting beside, or instead of, casino games. 888reviews has not verified which reviewed brands have that product, the odds format, or a Malaysian licence for it. Read the legal page. An offshore badge is not that licence.',
    sections: [
        { h: 'Open checks', html: unverified('Sportsbook checks', ['Whether the brand has a sportsbook', 'Odds format and market rules', 'Named licence and number']) + `<p>Compare brands only after those fields exist. The <a href="/vs/bk8-vs-m88">BK8 vs M88</a> note does not fill them either.</p>` },
        { h: 'Related reading', html: `<p>Use <a href="${legal}">the legal page</a>, <a href="/reviews">reviews</a>, and <a href="/glossary">the glossary</a>. This page does not tell you which bet to place.</p>` },
    ],
    citations: citesLaw,
    links: [[legal, 'Legal page'], ['/reviews', 'Reviews'], ['/vs/bk8-vs-m88', 'BK8 vs M88'], ['/glossary', 'Glossary']],
    faqs: [
        ['Which casino has a sportsbook for Malaysia?', 'Not yet verified. No brand is marked yes or no on this page.'],
        ['Are casino odds and sports odds the same product?', 'No. They are different rules, different bets, and often different terms. Read the market page you are using.'],
        ['Does an offshore licence cover sports betting in Malaysia?', 'This page does not say that. An offshore licence is not a Malaysian licence. See the legal page.'],
        ['Will you rank sportsbooks later?', 'Only when each row has a source for the product, the terms, and the licence record, with a date.'],
    ],
});

addPage({
    slug: 'casino-apps-malaysia',
    title: 'Casino Apps Malaysia | 888reviews',
    description: 'A casino app is the phone install, which can differ from the browser site. No dated install and withdrawal test is published here. See the mobile hub.',
    h1: 'Casino apps Malaysia',
    keyword: 'casino app Malaysia',
    kicker: 'Phone installs · No tested app',
    answer: 'Casino app Malaysia means the install a brand offers for a phone, which can differ from the same brand\'s browser site. 888reviews has not published a dated install, deposit, and withdrawal on a named app. Check the cashier on the device you will use. The mobile hub remains the overview.',
    sections: [
        { h: 'Open checks', html: unverified('App checks', ['Official install source', 'Whether the cashier matches the browser', 'MYR and local payment methods on the app']) + `<p>The existing <a href="/mobile">mobile</a> page is unchanged. This note sits beside it.</p>` },
        { h: 'Payments and law', html: `<p>Payment guides: <a href="/fpx-casino-malaysia">FPX</a>, <a href="/duitnow-casino-malaysia">DuitNow</a>, <a href="/touch-n-go-casino-malaysia">Touch \'n Go</a>. Legal reading: <a href="${legal}">statutes</a>.</p>` },
    ],
    citations: citesPay,
    links: [['/mobile', 'Mobile hub'], ['/fpx-casino-malaysia', 'FPX'], ['/reviews', 'Reviews'], [legal, 'Legal page']],
    faqs: [
        ['Which casino app is best in Malaysia?', 'Not yet verified. There is no tested install on this page.'],
        ['Is the app the same as the mobile site?', 'Not always. Confirm the cashier on the exact build you opened.'],
        ['Do you host APK files?', 'No. 888reviews does not distribute casino apps.'],
        ['Does an app icon mean the casino is licensed in Malaysia?', 'No. See the legal page. This is not legal advice.'],
    ],
});

addPage({
    slug: 'mega888-918kiss-alternatives',
    title: 'Mega888 and 918Kiss Notes | 888reviews',
    description: 'Note on Mega888 and 918Kiss searches. This page does not supply apps or name a licensed replacement. Read the statutes first. Not legal advice. Adults 18+.',
    h1: 'Mega888 and 918Kiss: what to check',
    keyword: 'Mega888',
    kicker: 'Informational · No download and no ranked alternative',
    answer: 'Mega888 and 918Kiss are names people search when looking for casino-style apps. 888reviews does not host those apps and has not verified a Malaysian licence for them. This page does not name a replacement product. Read the legal page before you install anything. This is not legal advice.',
    sections: [
        { h: 'What "alternatives" means here', html: `<p>An alternative, if one is published later, would be an operator whose company name, licence number, and cashier were checked on a stated date. That row does not exist yet. The <a href="/reviews">review directory</a> is a list of write-ups, not a certificate.</p>` + unverified('Checks still open', ['Company behind the app name', 'Licence number on a Malaysian register', 'A dated test of deposit and withdrawal']) },
        { h: 'No download steps', html: `<p>This page does not link to an installer, an APK, or a mirror. If you need the statutes, use <a href="${legal}">the legal page</a>. For ordinary browser play notes, use <a href="/casino-apps-malaysia">casino apps</a> and <a href="/mobile">mobile</a>.</p>` },
    ],
    citations: citesLaw,
    links: [[legal, 'Legal page'], ['/casino-apps-malaysia', 'Casino apps'], ['/reviews', 'Reviews'], ['/glossary', 'Glossary']],
    faqs: [
        ['Where do I download Mega888 or 918Kiss?', 'Not from this site. 888reviews does not distribute those apps.'],
        ['Is there a licensed alternative?', 'Not yet verified. No operator is named here as a substitute.'],
        ['Does a review of another brand replace those apps?', 'A review is a write-up of published terms and limitations. It is not a statement that the brand is licensed in Malaysia.'],
        ['Who decides if an app is lawful to use?', 'Not this page. Read the statutes and ask a qualified adviser if you need advice about your own situation.'],
    ],
});

addPage({
    slug: 'complaints',
    title: 'Casino Complaints | 888reviews',
    description: 'A public complaint log for casinos readers ask about. No dated complaint with evidence is published yet. Send the record through the contact page. Adults 18+.',
    h1: 'Casino complaints',
    keyword: 'casino complaints',
    kicker: 'Evidence log · Empty on this date',
    answer: 'Casino complaints on this page are published only with a date, the operator, the claim, and the evidence that was checked. None of those rows exist yet. An unpaid balance, a closed account, or a slow withdrawal stays "not yet verified" until a record is linked. Use the contact page to send documents.',
    sections: [
        { h: 'The log', html: table('Complaint log', ['Date', 'Operator', 'Claim', 'Evidence', 'Status'], [[DATE_LABEL, 'Not yet verified', 'None published', 'None linked', 'No row']]) },
        { h: 'What to send', html: `<p>Use <a href="/contact">contact</a> and include the operator URL, the date, and what you can show. A forum post alone is not enough for this log. Method notes are on <a href="/how-we-rate">How we rate</a>. Legal questions go to <a href="${legal}">the legal page</a>, which is not advice.</p>` },
    ],
    citations: citesLaw,
    links: [['/contact', 'Contact'], ['/how-we-rate', 'How we rate'], ['/reviews', 'Reviews'], [legal, 'Legal page']],
    faqs: [
        ['Which casinos should I avoid?', 'Not yet verified. This page will not name one from rumour.'],
        ['What counts as evidence?', 'A dated record of the transaction or the terms screen, plus the operator URL. Anonymous comments are not that record.'],
        ['Will you publish my documents?', 'Only if they can be checked and they do not expose a private document you did not agree to publish. Write through the contact page first.'],
        ['Do you get the money back?', 'No. 888reviews is not the operator, not a court, and not a complaints regulator.'],
    ],
});

addPage({
    slug: 'glossary',
    title: 'Casino Glossary | 888reviews',
    description: 'English and Bahasa Malaysia definitions for terms on 888reviews, including RTP, wagering, FPX, and offshore licence. Not legal advice. Adults 18+ only.',
    h1: 'Casino glossary',
    keyword: 'kasino dalam talian',
    kicker: 'English and Bahasa Malaysia',
    answer: 'This glossary defines words used on 888reviews, in English and Bahasa Malaysia. Kasino dalam talian is the Malay for an online casino. Definitions below describe the words. They are not measurements of a brand, and they are not legal advice. Confirm figures in the cashier or the statute.',
    sections: [
        { h: 'Terms', html: table('Glossary', ['English', 'Bahasa Malaysia', 'Meaning on this site'], [
            ['Online casino', 'Kasino dalam talian', 'A website that offers casino-style games. Not a statement that it is licensed in Malaysia.'],
            ['RTP', 'Pulangan kepada pemain', 'A theoretical long-run percentage for a game version. Not a promise for one session. Not yet verified per title on this page.'],
            ['Wagering', 'Syarat pertaruhan', 'How much must be bet before a bonus can be withdrawn, according to the operator\'s terms.'],
            ['No-deposit bonus', 'Bonus tanpa deposit', 'Credit or spins offered without a deposit. Not the same as money you can withdraw. No current offer is verified.'],
            ['Free credit', 'Kredit percuma', 'Another way people search for a no-deposit offer. Wagering can still apply.'],
            ['FPX', 'FPX', 'PayNet\'s online banking payment service. Casino support is not yet verified.'],
            ['Offshore licence', 'Lesen luar negara', 'A licence from outside Malaysia. It does not mean licensed in Malaysia.'],
        ]) },
        { h: 'Where the words are used', html: `<p>Read <a href="${legal}">the legal page</a>, <a href="/fpx-casino-malaysia">FPX</a>, <a href="/no-deposit-bonus-malaysia">no-deposit offers</a>, and the <a href="/ms/online-casino-malaysia-legal">Bahasa Malaysia legal note</a>.</p>` },
    ],
    citations: citesLaw.slice(0, 1).concat(citesPay.slice(0, 2)),
    links: [[legal, 'Legal page'], ['/fpx-casino-malaysia', 'FPX'], ['/no-deposit-bonus-malaysia', 'No-deposit'], ['/ms/glossary', 'Glosari BM']],
    faqs: [
        ['What is kasino dalam talian?', 'It is Bahasa Malaysia for online casino. Using the phrase does not say the site is licensed in Malaysia.'],
        ['What is kredit percuma?', 'It is the usual Malay search for free credit. It is an offer term, not cash that has cleared wagering.'],
        ['Do these definitions include live numbers?', 'No. RTP, bonus amounts, and payout minutes are not filled in here.'],
        ['Is the glossary legal advice?', 'No. Statutes are on the legal page. This list only defines words.'],
    ],
});

addPage({
    slug: 'responsible-gambling-malaysia',
    title: 'Responsible Gambling Malaysia | 888reviews',
    description: 'Adults 18+ only. Set limits and stop if gambling causes harm. A gambling-specific Malaysian helpline was not verified here. Support links are listed.',
    h1: 'Responsible gambling in Malaysia',
    keyword: 'responsible gambling',
    kicker: '18+ · Local helpline not yet verified',
    answer: 'Responsible gambling means treating betting as paid entertainment, setting a limit, and stopping when it causes harm. 888reviews has not verified a gambling-specific helpline in Malaysia on this date. The footer link to BeGambleAware is unchanged. If you need urgent emotional support, use a service whose own site you have checked.',
    sections: [
        { h: 'What to do on the operator site', html: `<p>Where the cashier offers them, use deposit limits, time limits, cooling-off, and self-exclusion. 888reviews does not operate those tools and cannot close an account for you. Confirm the steps inside the account you opened.</p>` },
        { h: 'Support links that were checked as organisations, not as treatment advice', html: `<ul>
            <li><a href="https://www.befrienders.org.my/" rel="noopener noreferrer" target="_blank">Befrienders</a> publishes emotional-support contacts. It is not described here as a gambling clinic. Use the number and hours on their site.</li>
            <li><a href="https://www.gamblingtherapy.org/" rel="noopener noreferrer" target="_blank">Gambling Therapy</a> is an international support site already linked from the footer.</li>
        </ul>
        <p>The existing footer link to BeGambleAware stays until a replacement is approved. This page is an extra note, not a change to that link. It is not medical or legal advice.</p>` },
    ],
    citations: [
        ['Befrienders', 'https://www.befrienders.org.my/'],
        ['Gambling Therapy', 'https://www.gamblingtherapy.org/'],
        ['BeGambleAware', 'https://www.begambleaware.org/'],
    ],
    links: [['/editorial-team', 'Editorial team'], [legal, 'Legal page'], ['/contact', 'Contact'], ['/how-we-rate', 'How we rate']],
    faqs: [
        ['What is the Malaysian problem-gambling helpline?', 'Not yet verified on this page. Do not treat a UK charity link as a Malaysian service. Check Befrienders or another service on its own website.'],
        ['Can 888reviews self-exclude me?', 'No. Self-exclusion, where it exists, is a tool on the operator account. We do not run that account.'],
        ['Is the footer link changing?', 'Not in this release. BeGambleAware remains the Support link until that change is approved.'],
        ['Who is this for?', 'Adults 18+ only. If gambling is causing harm, stop and contact a support service you have checked.'],
    ],
});

function vsPage(slug, a, b) {
    const keyword = `${a} vs ${b}`;
    addPage({
        slug,
        dir: 'vs',
        title: `${a} vs ${b} | 888reviews`,
        description: `${a} vs ${b}: licence, MYR, bonus terms, and withdrawal times are not yet verified. No winner is declared. Read each cashier first. Adults 18+ only.`,
        h1: `${a} vs ${b}`,
        keyword,
        kicker: 'Comparison · No winner declared',
        answer: `${keyword} is a comparison this page cannot score yet. Licence numbers, MYR cashier support, bonus terms, and withdrawal times are not yet verified for either name. Use each operator's published terms and the review directory. This is not a ranking and it is not legal advice.`,
        sections: [
            { h: 'Fields still open', html: table(`${a} versus ${b}`, ['Field', a, b], [
                ['Licence authority and number', 'Not yet verified', 'Not yet verified'],
                ['MYR cashier', 'Not yet verified', 'Not yet verified'],
                ['Welcome offer terms', 'Not yet verified', 'Not yet verified'],
                ['Tested withdrawal', 'Not yet verified', 'Not yet verified'],
            ]) },
            { h: 'How to read the brands', html: `<p>Open <a href="/reviews">reviews</a> if a write-up exists, then the cashier. Payment notes: <a href="/best-online-casino-malaysia-ringgit">MYR</a> and <a href="/fast-withdrawal-casino-malaysia">withdrawal tests</a>. Law: <a href="${legal}">statutes</a>.</p>` },
        ],
        citations: citesLaw,
        links: [['/reviews', 'Reviews'], ['/best-online-casino-malaysia-ringgit', 'MYR'], ['/fast-withdrawal-casino-malaysia', 'Withdrawals'], [legal, 'Legal page']],
        faqs: [
            [`Which is better, ${a} or ${b}?`, 'Not yet verified. This page does not declare a winner.'],
            ['Are the scores on the homepage a test of these two?', 'A homepage row is not a head-to-head test. This comparison stays empty until each field has a source and a date.'],
            ['Do both accept MYR?', 'Not yet verified. Check the cashier.'],
            ['Does either hold a Malaysian licence?', 'Not verified here. An offshore licence is not a Malaysian licence. See the legal page.'],
        ],
    });
}
vsPage('bk8-vs-m88', 'BK8', 'M88');
vsPage('1xbet-vs-bc-game', '1xBet', 'BC.Game');
vsPage('bk8-vs-1xbet', 'BK8', '1xBet');
vsPage('m88-vs-j8de', 'M88', 'J8DE');
vsPage('bc-game-vs-20bet', 'BC.Game', '20Bet');

function altPage(slug, brand) {
    addPage({
        slug,
        dir: 'alternatives',
        title: `${brand} Alternatives | 888reviews`,
        description: `No ranked ${brand} alternative is verified. Compare licence, MYR, bonus terms, and withdrawals in the cashier. Adults 18+ only. Not a ranking. Confirm terms.`,
        h1: `${brand} alternatives`,
        keyword: `${brand} alternatives`,
        kicker: 'No ranked substitute',
        answer: `${brand} alternatives are other operators a reader might compare. 888reviews has not verified a ranked substitute, a shared licence, or a tested withdrawal for this list. Use the review directory and the cashier checks below. This page does not tell you to open an account.`,
        sections: [
            { h: 'Compare these fields', html: unverified(`${brand} alternative checks`, ['Operator company name', 'Licence authority and number', 'MYR deposits and withdrawals', 'Bonus wagering from the current terms']) + `<p>No brand is filled in as the replacement. See <a href="/reviews">reviews</a> and <a href="/complaints">complaints</a>.</p>` },
            { h: 'Law and payments', html: `<p>Read <a href="${legal}">the legal page</a> and the <a href="/best-online-casino-malaysia-ringgit">MYR checklist</a>. An alternative logo is not a Malaysian licence.</p>` },
        ],
        citations: citesLaw,
        links: [['/reviews', 'Reviews'], ['/complaints', 'Complaints'], ['/best-online-casino-malaysia-ringgit', 'MYR'], [legal, 'Legal page']],
        faqs: [
            [`What is the best alternative to ${brand}?`, 'Not yet verified. This page does not name one.'],
            ['Will the same bonus move to another site?', 'No. Each operator has its own terms. Read those terms before you opt in.'],
            ['Are alternatives licensed in Malaysia?', 'Not verified by being listed here. Check the legal page and the operator record.'],
            ['Where do I report a problem with the brand?', 'The complaints page explains what evidence is required. The log is empty until a record is checked.'],
        ],
    });
}
altPage('bk8-alternatives', 'BK8');
altPage('m88-alternatives', 'M88');
altPage('1xbet-alternatives', '1xBet');
altPage('bc-game-alternatives', 'BC.Game');
altPage('j8de-alternatives', 'J8DE');

const msPages = [
    ['online-casino-malaysia-legal', 'Adakah kasino dalam talian sah di Malaysia?', 'kasino dalam talian', 'Undang-undang · Bukan nasihat guaman',
        'Soalan tentang kasino dalam talian di Malaysia dijawab dengan statut, bukan dengan logo luar negara. Baca Common Gaming Houses Act 1953, Betting Act 1953, dan Pool Betting Act 1967. Lesen luar negara bukan lesen Malaysia. Halaman ini bukan nasihat guaman. Semak teks rasmi terkini.'],
    ['best-online-casino-malaysia-ringgit', 'Kasino dalam talian MYR', 'kasino dalam talian MYR', 'Ringgit · Belum disahkan',
        'Kasino dalam talian MYR bermaksud juruwang memaparkan ringgit, bukan sekadar anggaran mata wang lain. 888reviews belum mengesahkan operator yang membayar pengeluaran dalam MYR. Semak juruwang dan terma pembayaran operator sebelum membuat deposit.'],
    ['fpx-casino-malaysia', 'Kasino FPX Malaysia', 'kasino FPX', 'PayNet FPX · Belum disahkan',
        'Kasino FPX ialah tuntutan juruwang yang menerima pembayaran perbankan dalam talian PayNet. 888reviews belum mengesahkan operator yang menerimanya. Sahkan kaedah, had, dan yuran pada juruwang sebelum anda membayar. FPX bukan lesen perjudian.'],
    ['duitnow-casino-malaysia', 'Kasino DuitNow Malaysia', 'kasino DuitNow', 'DuitNow · Belum disahkan',
        'Kasino DuitNow bermaksud operator mendakwa pemindahan DuitNow PayNet. 888reviews belum mengesahkan kasino yang menawarkannya. Sahkan nama kaedah pada juruwang dan baca had sebelum memindahkan wang. DuitNow bukan lesen Malaysia.'],
    ['touch-n-go-casino-malaysia', 'Kasino Touch n Go', 'Touch n Go', 'Dompet TNG · Belum disahkan',
        'Touch n Go pada kasino bermaksud juruwang mendakwa Touch \'n Go eWallet. 888reviews belum mengesahkan operator yang menerimanya. Tambah nilai dompet bukan pengeluaran kasino. Sahkan kaedah pada juruwang. Halaman ini bukan nasihat guaman.'],
    ['crypto-casino-malaysia', 'Kasino kripto Malaysia', 'kasino kripto', 'Kripto · Belum disahkan',
        'Kasino kripto mendakwa pemindahan syiling atau token. 888reviews belum mengesahkan aset, rangkaian, atau penukaran MYR mana-mana operator. Semak aset, rangkaian, dan alamat dompet sebelum menghantar dana. Lesen luar negara bukan lesen Malaysia.'],
    ['no-deposit-bonus-malaysia', 'Bonus tanpa deposit', 'bonus tanpa deposit', 'Kredit percuma · Belum disahkan',
        'Bonus tanpa deposit, atau kredit percuma, ialah kredit atau putaran yang operator kata boleh dituntut tanpa bayar. 888reviews belum mengesahkan tawaran semasa. Syarat pertaruhan dan had pengeluaran masih boleh terpakai. Baca terma operator.'],
    ['welcome-bonus-malaysia', 'Bonus alu-aluan kasino', 'bonus alu-aluan', 'Deposit pertama · Belum disahkan',
        'Bonus alu-aluan ialah promosi akaun baharu, biasanya pada deposit pertama. 888reviews belum mengesahkan jumlah atau syarat pertaruhan semasa. Gunakan terma yang diterbitkan operator sebagai sumber. Sahkan tempoh dan pertaruhan maksimum sebelum menerima.'],
    ['fast-withdrawal-casino-malaysia', 'Pengeluaran pantas kasino', 'pengeluaran pantas', 'Tiada ujian masa',
        'Pengeluaran pantas ialah dakwaan tentang kelajuan bayaran. 888reviews belum menerbitkan masa pengeluaran yang diuji bagi mana-mana operator. Selagi rekod bertarikh tidak dipautkan, masa itu belum disahkan. Anggaran operator bukan ujian kami.'],
];

const msDesc = {
    'online-casino-malaysia-legal': 'Baca Common Gaming Houses Act 1953, Betting Act 1953 dan Pool Betting Act 1967. Lesen luar negara bukan lesen Malaysia. Halaman ini bukan nasihat guaman. 18+.',
    'best-online-casino-malaysia-ringgit': 'Cara menyemak sama ada juruwang kasino memaparkan MYR dan membayar pengeluaran dalam ringgit. Sokongan operator belum disahkan. Dewasa 18+ sahaja.',
    'fpx-casino-malaysia': 'FPX ialah perkhidmatan pembayaran perbankan dalam talian PayNet. Halaman ini tidak menamakan kasino yang menerima FPX. Belum disahkan. Dewasa 18+ sahaja.',
    'duitnow-casino-malaysia': 'DuitNow ialah jenama pindahan PayNet. Sokongan kasino pada halaman ini belum disahkan. Sahkan juruwang sebelum memindahkan wang. Dewasa 18+ sahaja.',
    'touch-n-go-casino-malaysia': 'Touch \'n Go eWallet diuruskan TNG Digital. Halaman ini memisahkan tambah nilai dompet daripada juruwang kasino, yang belum disahkan. Dewasa 18+ sahaja.',
    'crypto-casino-malaysia': 'Semak aset, rangkaian, penukaran MYR, dan lesen sebelum menggunakan juruwang kripto. Sokongan operator belum disahkan di halaman ini. Dewasa 18+ sahaja.',
    'no-deposit-bonus-malaysia': 'Bonus tanpa deposit atau kredit percuma masih boleh ada syarat pertaruhan. Tiada tawaran semasa disahkan di halaman ini. Dewasa 18+ sahaja. Bukan nasihat.',
    'welcome-bonus-malaysia': 'Cara membaca bonus alu-aluan akaun baharu. Jumlah dan syarat pertaruhan di halaman ini belum disahkan. Sahkan terma operator. Dewasa 18+ sahaja.',
    'fast-withdrawal-casino-malaysia': 'Tiada masa pengeluaran kasino yang diuji diterbitkan di sini. Halaman ini menerangkan rekod bertarikh yang diperlukan sebelum sebarang dakwaan kelajuan. 18+.',
};

for (const [slug, h1, keyword, kicker, answer] of msPages) {
    addPage({
        slug,
        dir: 'ms',
        lang: 'ms',
        title: `${h1} | 888reviews`.slice(0, 60),
        description: msDesc[slug],
        h1,
        keyword,
        kicker,
        answer: slug === 'online-casino-malaysia-legal' ? answer : `${answer} Halaman ini bukan nasihat guaman. Sahkan terma semasa dengan operator sebelum deposit.`,
        sections: [
            { h: 'Belum disahkan', html: unverified('Semakan', ['Lesen dan nombor', 'Juruwang MYR', 'Terma bonus', 'Masa pengeluaran diuji']) + `<p>Angka hanya ditulis apabila ada sumber. Halaman Bahasa Inggeris: <a href="/${slug}">versi English</a>. Undang-undang: <a href="/ms/online-casino-malaysia-legal">nota statut</a>.</p>` },
            { h: 'Cara menggunakan halaman ini', html: `<p>888reviews bukan kasino dan tidak menerima pertaruhan. Dewasa 18+ sahaja. Sahkan terma semasa dengan operator. Halaman ini bukan nasihat guaman. Glosari: <a href="/glossary">Bahasa Inggeris dan BM</a>.</p>` },
        ],
        citations: citesLaw,
        links: [[`/${slug}`, 'English page'], ['/ms/online-casino-malaysia-legal', 'Undang-undang'], ['/glossary', 'Glosari'], ['/reviews', 'Ulasan']],
        faqs: [
            ['Adakah ini nasihat guaman?', 'Tidak. Baca statut pada portal rasmi dan dapatkan nasihat berkelayakan jika anda perlukan keputusan untuk situasi sendiri.'],
            ['Adakah angka di halaman ini diuji?', 'Belum. Sel belum disahkan kekal begitu sehingga ada URL sumber dan tarikh.'],
            ['Di mana halaman Bahasa Inggeris?', `Pada /${slug}. Kedua-dua bahasa merujuk halaman yang sama topiknya.`],
            ['Adakah lesen luar negara sama dengan lesen Malaysia?', 'Tidak. Lesen luar negara bukan lesen Malaysia. Sahkan nama operator dan nombor lesen pada rekod yang berkenaan.'],
        ],
    });
}

addPage({
    slug: 'glossary',
    dir: 'ms',
    lang: 'ms',
    title: 'Glosari kasino | 888reviews',
    description: 'Glosari ringkas Bahasa Malaysia untuk istilah di 888reviews, termasuk kasino dalam talian, bonus tanpa deposit, dan kredit percuma. Bukan nasihat guaman. 18+.',
    h1: 'Glosari kasino',
    keyword: 'kasino dalam talian',
    kicker: 'Bahasa Malaysia',
    answer: 'Glosari ini mentakrifkan istilah yang digunakan di 888reviews. Kasino dalam talian ialah frasa Bahasa Malaysia untuk online casino. Bonus tanpa deposit dan kredit percuma bukan wang yang sudah boleh dikeluarkan. Takrif di sini bukan ukuran jenama dan bukan nasihat guaman.',
    sections: [
        { h: 'Istilah', html: table('Glosari', ['Istilah', 'Maksud di laman ini'], [
            ['Kasino dalam talian', 'Laman yang menawarkan permainan gaya kasino. Bukan penyataan bahawa ia dilesenkan di Malaysia.'],
            ['Bonus tanpa deposit', 'Kredit atau putaran tanpa deposit. Syarat pertaruhan masih boleh terpakai. Tawaran semasa belum disahkan.'],
            ['Kredit percuma', 'Carian lain untuk bonus tanpa deposit. Bukan tunai yang sudah lulus syarat.'],
            ['Slot percuma', 'Biasanya mod latihan. Bukan pengeluaran wang tunai.'],
            ['Lesen luar negara', 'Lesen dari luar Malaysia. Bukan lesen Malaysia.'],
        ]) },
    ],
    citations: citesLaw.slice(0, 2),
    links: [['/glossary', 'English glossary'], ['/ms/online-casino-malaysia-legal', 'Undang-undang'], ['/ms/no-deposit-bonus-malaysia', 'Bonus tanpa deposit'], ['/reviews', 'Ulasan']],
    faqs: [
        ['Apa itu kasino dalam talian?', 'Frasa Bahasa Malaysia untuk online casino. Frasa itu tidak bermaksud laman itu dilesenkan di Malaysia.'],
        ['Apa itu kredit percuma?', 'Carian biasa untuk tawaran tanpa deposit. Ia bukan janji wang boleh dikeluarkan.'],
        ['Apa itu slot percuma?', 'Biasanya mod latihan. Ia bukan keputusan pertaruhan wang sebenar.'],
        ['Adakah glosari ini nasihat guaman?', 'Tidak. Statut dibaca pada halaman undang-undang dan portal rasmi.'],
    ],
});

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}

function faqItem(q, html) {
    return `                    <div class="accordion-item">
                        <button type="button" class="accordion-header" aria-expanded="false">
                            <span class="accordion-title">${q}</span>
                            <div class="accordion-icon-wrap"><i data-lucide="chevron-down" class="accordion-icon"></i></div>
                        </button>
                        <div class="accordion-content">
                            <div class="accordion-inner"><p>${html}</p></div>
                        </div>
                    </div>`;
}

function render(p) {
    const lang = p.lang || 'en';
    const prefix = p.dir ? `/${p.dir}` : '';
    const url = `https://888reviews.com${prefix}/${p.slug}`;
    const alternates = p.dir === 'ms'
        ? ''
        : `<link rel="alternate" hreflang="en-MY" href="${url}">
    <link rel="alternate" hreflang="x-default" href="${url}">`;
    const graph = [
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://888reviews.com/' },
            { '@type': 'ListItem', position: 2, name: strip(p.h1), item: url },
        ] },
        { '@context': 'https://schema.org', '@type': 'Article', headline: strip(p.h1), dateModified: DATE, url, inLanguage: lang === 'ms' ? 'ms-MY' : 'en-MY', author: { '@type': 'Organization', name: '888reviews editorial desk', url: 'https://888reviews.com/editorial-team' }, publisher: { '@type': 'Organization', name: '888reviews', url: 'https://888reviews.com/' } },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) },
    ];
    const ld = graph.map((n) => `<script type="application/ld+json">${JSON.stringify(n)}</script>`).join('\n    ');
    const sections = p.sections.map((s, i) => `<section class="about-section about-section--card" aria-labelledby="${p.slug}-s${i}"><h2 id="${p.slug}-s${i}">${s.h}</h2>${s.html}</section>`).join('\n');
    const cites = p.citations.map(([label, href]) => `<li><a href="${href}" rel="noopener noreferrer" target="_blank">${label}</a></li>`).join('');
    const related = p.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n');
    const faqs = p.faqs.map(([q, a]) => faqItem(q, a)).join('\n');
    const head = chromeHead.replace('<html lang="en">', `<html lang="${lang}">`).replace('lang="en"', `lang="${lang}"`);
    const body = chromeHead.includes('<html') ? chromeHead : chromeHead.replace('<body', `<body`);
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <script>
(function(){
  function loadGtm(){(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TS95HFR5');}
  if('requestIdleCallback' in window){requestIdleCallback(loadGtm,{timeout:3000});}
  else{window.addEventListener('load',loadGtm,{once:true});}
})();
</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="public-base-url" content="https://888reviews.com">
    <meta name="strapi-public-url" content="https://api.888reviews.com">
    <title>${p.title}</title>
    <meta name="description" content="${p.description.replace(/"/g, '&quot;')}">
    <meta name="robots" content="${p.dir === 'ms' ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
    <link rel="canonical" href="${url}">
    ${alternates}
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="888reviews">
    <meta property="og:locale" content="${lang === 'ms' ? 'ms_MY' : 'en_MY'}">
    <meta property="og:title" content="${p.title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${p.description.replace(/"/g, '&quot;')}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="https://888reviews.com/assets/img/888review-siteicon.webp">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${p.title.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${p.description.replace(/"/g, '&quot;')}">
    ${ld}
    <link rel="stylesheet" href="/assets/css/styles.css">
    <link rel="stylesheet" href="/assets/css/fonts.css">
    <link rel="icon" href="/assets/img/888review-siteicon.webp" type="image/webp">
</head>
${chromeHead.replace('class="page-about"', 'class="page-about page-malaysia page-live-casino"')}
    <main class="about-page" id="main-content">
        <nav class="bonuses-breadcrumb container" aria-label="Breadcrumb">
            <ol class="bonuses-breadcrumb__list">
                <li><a href="/">Home</a></li>
                <li aria-current="page">${strip(p.h1)}</li>
            </ol>
        </nav>
        <section class="guides-hero about-hero container reveal" aria-labelledby="${p.slug}-h1">
            <p class="gh-kicker"><i data-lucide="badge-check" aria-hidden="true"></i> ${p.kicker}</p>
            <h1 class="gh-title" id="${p.slug}-h1">${p.h1}</h1>
            <p class="gh-desc">${p.answer}</p>
            <p class="terms-last-updated">Last verified: <time datetime="${DATE}">${DATE_LABEL}</time></p>
        </section>
        <div class="malaysia-listing-meta" aria-label="Page information">
            <div class="malaysia-listing-meta__inner">
                <div class="malaysia-listing-meta__updated">
                    <span class="malaysia-listing-meta__updated-label">Last verified:</span>
                    <time datetime="${DATE}">${DATE_LABEL}</time>
                </div>
                ${badges()}
            </div>
        </div>
        <div class="static-page-layout container reveal">
            <article class="about-article">
                <p><strong>Author:</strong> 888reviews editorial desk. <strong>Reviewer:</strong> Not yet named. <a href="/editorial-team">Editorial team</a>.</p>
                <div class="about-article__grid">
                ${sections}
                <section class="about-section about-section--card"><h2>Sources checked</h2><ul>${cites}</ul><p>Adults 18+ only. Gambling involves financial risk. This page is not legal advice.</p></section>
                </div>
            </article>
        </div>
        <section class="guides-interstitial container reveal">
            <div class="gi-card"><div class="gi-content"><p class="gi-kicker">Related</p><h2>Keep reading</h2><nav class="gi-links">${related}</nav></div></div>
        </section>
        <section class="seo-accordion about-faq reveal" aria-labelledby="${p.slug}-faq">
            <div class="container"><div class="section-header center"><h2 id="${p.slug}-faq">Frequently asked questions</h2></div><div class="accordion">${faqs}</div></div>
        </section>
    </main>
${footer}`;
}

for (const p of pages) {
    const dir = p.dir ? path.join(pub, p.dir) : pub;
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${p.slug}.html`);
    fs.writeFileSync(file, render(p));
    console.log('wrote', p.dir || '.', p.slug);
}

function walk(dir, out = []) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
            if (name === 'assets' || name === 'components' || name === 'ms') continue;
            walk(full, out);
        } else if (name.endsWith('.html')) out.push(full);
    }
    return out;
}

for (const file of walk(pub)) {
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('rel="alternate"')) continue;
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
    if (!canon) continue;
    const url = canon[1];
    let slug = url.replace('https://888reviews.com', '').replace(/^\//, '').replace(/\/$/, '');
    if (slug.startsWith('ms/')) slug = slug.slice(3);
    const tags = `\n    <link rel="alternate" hreflang="en-MY" href="${url}">\n    <link rel="alternate" hreflang="x-default" href="${url}">`;
    html = html.replace(canon[0], canon[0] + tags);
    html = html.replace('property="og:locale" content="en_US"', 'property="og:locale" content="en_MY"');
    fs.writeFileSync(file, html);
}
console.log('hreflang pass done');
