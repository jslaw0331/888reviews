/**
 * Additive SEO blocks for 11 Oct 2026. Inserts new sections and pages.
 * Does not rewrite existing sentences. Safe to run once; skips marked blocks.
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
let chromeHead = about.slice(bodyAt, headerEnd).replace(
    'class="page-about"',
    'class="page-about page-malaysia page-live-casino"',
);
const footer = about.slice(about.indexOf('<div class="site-footer-inlined"'));

function words(s) {
    return s
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z#0-9]+;/gi, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
}

function strip(html) {
    return html
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&rsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function faqItem(q, html) {
    return `                    <div class="accordion-item">
                        <button type="button" class="accordion-header" aria-expanded="false">
                            <span class="accordion-title">${q}</span>
                            <div class="accordion-icon-wrap"><i data-lucide="chevron-down" class="accordion-icon"></i></div>
                        </button>
                        <div class="accordion-content">
                            <div class="accordion-inner">
                                <p>${html}</p>
                            </div>
                        </div>
                    </div>`;
}

function badges() {
    return `<ul class="malaysia-listing-meta__trust" aria-label="Trust indicators">
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="lock"></i></span><span>Secure</span></li>
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="thumbs-up"></i></span><span>Trusted</span></li>
                        <li class="malaysia-listing-meta__badge"><span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="circle-check"></i></span><span>Verified</span></li>
                    </ul>`;
}

const pages = [];

function addPage(p) {
    const n = words(p.answer);
    if (n < 40 || n > 60) {
        throw new Error(`${p.slug} answer is ${n} words`);
    }
    if (p.title.length > 60) throw new Error(`${p.slug} title ${p.title.length}: ${p.title}`);
    if (p.description.length < 140 || p.description.length > 160) {
        throw new Error(`${p.slug} description ${p.description.length}: ${p.description}`);
    }
    const blob = `${p.h1} ${strip(p.answer)}`.toLowerCase();
    if (!blob.includes(p.keyword.toLowerCase())) {
        throw new Error(`${p.slug} missing keyword ${p.keyword}`);
    }
    pages.push(p);
}

addPage({
    slug: 'online-casino-malaysia-legal',
    title: 'Is Online Casino Legal in Malaysia | 888reviews',
    description:
        'Read the Common Gaming Houses Act 1953, Betting Act 1953 and Pool Betting Act 1967. An offshore licence is not a Malaysian licence. Not legal advice.',
    h1: 'Is online casino legal in Malaysia?',
    keyword: 'online casino Malaysia legal',
    kicker: 'Statutes to read · Not legal advice',
    answer:
        'People asking about online casino Malaysia legal status need the statutes, not an offshore logo. Read the Common Gaming Houses Act 1953, the Betting Act 1953, and the Pool Betting Act 1967. An offshore licence is not a Malaysian licence. This page is not legal advice. Check the current official text before you act.',
    sections: [
        {
            h: 'What this page can and cannot tell you',
            html: `<p>888reviews does not give legal advice, and this page does not tell you that a particular site or a particular player is inside or outside the law. Territory, the type of game, and whether a licence was issued under a Malaysian statute all matter. The homepage already says an offshore licence does not mean an online casino is licensed in Malaysia. That limit applies here too.</p>`,
        },
        {
            h: 'Statutes named in the reprints we checked',
            html: `<p>On ${DATE_LABEL} we checked public reprints, not a private legal opinion. The controlling text is the current version published by the Attorney General's Chambers. Reprints can lag amendments.</p>
            <ul>
                <li>Common Gaming Houses Act 1953 (Act 289). The reprint's long title is an Act relating to the suppression of common gaming houses, public gaming, and public lotteries.</li>
                <li>Betting Act 1953 (Act 495). The reprint's long title is an Act to suppress betting houses and betting in public places.</li>
                <li>Pool Betting Act 1967 (Act 384). The reprint's long title is an Act to provide for the issue of a licence or the establishment of a Board for the operation or promotion of pool betting and for matters incidental thereto.</li>
            </ul>
            <p>The Act 289 reprint also contains a section under which the Minister of Finance may license a company to promote gaming on the terms written in that licence. Whether that section is still in force, and whether it covers a website run from outside Malaysia, has to be read from the current official text. This page does not treat an offshore casino seal as that licence.</p>`,
        },
        {
            h: 'What to do before you use a site',
            html: `<p>Read the current Acts on the official portal, then read the operator's own terms. Compare that with our <a href="/reviews">casino reviews</a> and the <a href="/best-online-casino-malaysia-ringgit">ringgit checklist</a>. Gambling is for adults 18+ and involves financial risk.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['CommonLII reprint, Common Gaming Houses Act 1953 (Act 289)', 'https://www.commonlii.org/my/legis/consol_act/cgha19531983289/'],
        ['CommonLII reprint, Betting Act 1953 (Act 495)', 'https://www.commonlii.org/my/legis/consol_act/ba19531992166/'],
    ],
    links: [
        ['/reviews', 'Casino reviews'],
        ['/how-we-rate', 'How we rate'],
        ['/best-online-casino-malaysia-ringgit', 'Ringgit checklist'],
        ['/editorial-team', 'Editorial team'],
    ],
    faqs: [
        ['Does an offshore licence make an online casino licensed in Malaysia?', 'No. An offshore licence does not mean that an online casino is licensed in Malaysia. Check the operator name and licence number against the authority that issued it, and read the Malaysian statutes on the official portal. This is not legal advice.'],
        ['Which statutes does this page point to?', 'This page points to the Common Gaming Houses Act 1953, the Betting Act 1953, and the Pool Betting Act 1967. Read the current text from the Attorney General\'s Chambers. A reprint is a reading copy, not a substitute for the official version.'],
        ['Can 888reviews tell me if I am allowed to play?', 'No. Nothing on 888reviews is legal advice. If you need a decision about your own situation, ask a qualified adviser and check the official sources named on this page.'],
        ['Where are operator reviews?', 'Operator write-ups sit on the casino reviews directory. A review records published terms and limitations. It is not a statement that the operator is licensed in Malaysia.'],
    ],
});

addPage({
    slug: 'best-online-casino-malaysia-ringgit',
    title: 'Online Casino MYR Checklist | 888reviews',
    description:
        'How to check whether an online casino shows MYR in the cashier and pays withdrawals in ringgit. Operator support is not yet verified. 18+ only.',
    h1: 'Online casino MYR: what to check',
    keyword: 'online casino MYR',
    kicker: 'Ringgit checklist · Figures not yet verified',
    answer:
        'Online casino MYR means the cashier shows Malaysian ringgit, not only a converted foreign balance. 888reviews has not yet verified which operators pay withdrawals in MYR. Use the checks below, then confirm the cashier and the operator\'s payment terms before you deposit.',
    sections: [
        {
            h: 'Checks that are still open',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Ringgit checks not yet verified</caption><thead><tr><th scope="col">Check</th><th scope="col">Status on ${DATE_LABEL}</th><th scope="col">Where to look</th></tr></thead><tbody>
            <tr><td>Cashier currency shows MYR</td><td>Not yet verified</td><td>Operator cashier, while signed in</td></tr>
            <tr><td>Withdrawal paid in MYR</td><td>Not yet verified</td><td>Operator payment terms</td></tr>
            <tr><td>FPX, DuitNow, or Touch 'n Go listed</td><td>Not yet verified</td><td>Our payment guides, then the cashier</td></tr>
            </tbody></table></div>
            <p>A row stays "Not yet verified" until we can point to the operator's published terms or a dated test. We are not filling this table with estimates.</p>`,
        },
        {
            h: 'How to use the review directory',
            html: `<p>Open a write-up from <a href="/reviews">casino reviews</a>, then check the cashier yourself. Payment method explainers: <a href="/fpx-casino-malaysia">FPX</a>, <a href="/duitnow-casino-malaysia">DuitNow</a>, and <a href="/touch-n-go-casino-malaysia">Touch 'n Go</a>. Legal reading sits on the <a href="/online-casino-malaysia-legal">legal page</a>.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['PayNet, Malaysia\'s payment network', 'https://paynet.my/index.html'],
        ['PayNet, FPX for businesses', 'https://www.paynet.my/business-solutions/fpx.html'],
    ],
    links: [
        ['/reviews', 'Casino reviews'],
        ['/ewallet', 'E-wallet hub'],
        ['/fpx-casino-malaysia', 'FPX'],
        ['/online-casino-malaysia-legal', 'Legal page'],
    ],
    faqs: [
        ['Does a review that mentions Malaysia prove MYR withdrawals?', 'No. A review is not proof that the cashier shows ringgit or that a withdrawal is paid in MYR. Confirm both in the operator\'s cashier and payment terms.'],
        ['What if the balance is shown in another currency?', 'Then it is not an online casino MYR cashier, even if a converter estimates the ringgit value. Ask the operator which currency they will send.'],
        ['Have you tested a ringgit deposit?', 'Not yet. No dated deposit or withdrawal record is published on this page. Until one is linked, the result is not yet verified.'],
        ['Where do local payment methods sit?', 'Start with the e-wallet hub, then the FPX, DuitNow, and Touch \'n Go pages. Those pages explain the payment brands. They do not claim a casino has switched them on.'],
    ],
});

addPage({
    slug: 'fpx-casino-malaysia',
    title: 'FPX Casino Malaysia | 888reviews',
    description:
        'FPX is PayNet\'s online banking payment service. This page explains the check, and does not claim which casinos accept FPX. Not yet verified. 18+.',
    h1: 'FPX casino Malaysia',
    keyword: 'FPX casino Malaysia',
    kicker: 'PayNet FPX · Casino support not yet verified',
    answer:
        'FPX casino Malaysia describes a cashier that claims PayNet\'s FPX online banking payment. FPX is a PayNet service for paying through internet banking. 888reviews has not yet verified which operators accept it. Confirm the method, the limits, and the fees in the cashier before you pay.',
    sections: [
        {
            h: 'What PayNet says FPX is',
            html: `<p>PayNet describes FPX as an online payment option that lets a business receive a payment through internet banking, with payment alerts. That description is about the payment network. It is not a list of casinos, and it is not a gambling licence.</p>
            <div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">FPX casino checks</caption><thead><tr><th scope="col">Check</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Operator cashier lists FPX</td><td>Not yet verified</td></tr>
            <tr><td>Minimum and maximum FPX deposit</td><td>Not yet verified</td></tr>
            <tr><td>Whether FPX withdrawals exist</td><td>Not yet verified</td></tr>
            </tbody></table></div>`,
        },
        {
            h: 'Related payment pages',
            html: `<p>Read <a href="/duitnow-casino-malaysia">DuitNow</a> and <a href="/touch-n-go-casino-malaysia">Touch 'n Go</a> next. The <a href="/ewallet">e-wallet hub</a> stays the overview. Ringgit currency checks are on the <a href="/best-online-casino-malaysia-ringgit">MYR page</a>.</p>`,
        },
    ],
    citations: [
        ['PayNet, FPX business solution', 'https://www.paynet.my/business-solutions/fpx.html'],
        ['PayNet home', 'https://paynet.my/index.html'],
        ['PayNet personal solutions, including DuitNow', 'https://www.paynet.my/personal-solutions.html'],
    ],
    links: [
        ['/ewallet', 'E-wallet hub'],
        ['/duitnow-casino-malaysia', 'DuitNow'],
        ['/best-online-casino-malaysia-ringgit', 'MYR checklist'],
        ['/reviews', 'Casino reviews'],
    ],
    faqs: [
        ['Is FPX a casino licence?', 'No. FPX is a PayNet online banking payment service. A casino that displays an FPX logo is making a payment claim, which you should confirm in the cashier.'],
        ['Which casinos accept FPX?', 'Not yet verified on this page. We will add an operator only when the cashier or the operator\'s published terms show FPX, with a date.'],
        ['Does FPX mean the withdrawal is instant?', 'No. PayNet\'s description of FPX is about paying in. It is not a tested casino withdrawal time. See the fast-withdrawal page for what we have and have not timed.'],
        ['Where is the e-wallet overview?', 'The e-wallet hub remains the overview. This page is an extra note under that topic. It does not replace the hub.'],
    ],
});

addPage({
    slug: 'duitnow-casino-malaysia',
    title: 'DuitNow Casino Malaysia | 888reviews',
    description:
        'DuitNow is PayNet\'s transfer brand across banks and e-wallets. Casino support on this page is not yet verified. Confirm the cashier. 18+ only.',
    h1: 'DuitNow casino Malaysia',
    keyword: 'DuitNow casino',
    kicker: 'PayNet DuitNow · Casino support not yet verified',
    answer:
        'A DuitNow casino option means the operator claims PayNet\'s DuitNow transfer brand, which moves money across participating banks and e-wallets. 888reviews has not yet verified which casinos offer it. Confirm that the cashier lists DuitNow, and read the limits, before you transfer any money.',
    sections: [
        {
            h: 'What we can source today',
            html: `<p>PayNet's personal-solutions page describes sending or requesting money with a DuitNow ID from a bank account or an e-wallet. That is the payment brand. It does not name a casino.</p>
            <div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">DuitNow casino checks</caption><thead><tr><th scope="col">Check</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Cashier lists DuitNow</td><td>Not yet verified</td></tr>
            <tr><td>Deposit limit in MYR</td><td>Not yet verified</td></tr>
            <tr><td>Withdrawal time</td><td>Not yet verified</td></tr>
            </tbody></table></div>`,
        },
        {
            h: 'Do not treat the hub wording as a test',
            html: `<p>The <a href="/ewallet">e-wallet hub</a> is a separate page. This note does not rewrite it. If you need a tested time, use <a href="/fast-withdrawal-casino-malaysia">fast withdrawal</a>, where no operator time is published yet. FPX is explained on <a href="/fpx-casino-malaysia">its own page</a>.</p>`,
        },
    ],
    citations: [
        ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
        ['PayNet home', 'https://paynet.my/index.html'],
        ['PayNet FPX', 'https://www.paynet.my/business-solutions/fpx.html'],
    ],
    links: [
        ['/ewallet', 'E-wallet hub'],
        ['/fpx-casino-malaysia', 'FPX'],
        ['/touch-n-go-casino-malaysia', 'Touch \'n Go'],
        ['/fast-withdrawal-casino-malaysia', 'Withdrawal times'],
    ],
    faqs: [
        ['Is DuitNow the same as FPX?', 'No. PayNet presents them as different services. FPX is described for online payments through internet banking. DuitNow is described for transfers using a DuitNow ID across banks and e-wallets.'],
        ['Which casinos pay withdrawals by DuitNow?', 'Not yet verified. No operator, limit, or timed withdrawal is listed here.'],
        ['Does DuitNow make a casino licensed in Malaysia?', 'No. A payment method is not a gambling licence. Read the legal page before you treat a logo as permission.'],
        ['Where should I compare e-wallets?', 'Use the e-wallet hub for the overview, then this page, FPX, and Touch \'n Go for the separate checks.'],
    ],
});

addPage({
    slug: 'touch-n-go-casino-malaysia',
    title: 'Touch n Go Casino Malaysia | 888reviews',
    description:
        'Touch \'n Go eWallet is a TNG Digital wallet. This page separates wallet reload from a casino cashier, which is not yet verified. Adults 18+ only.',
    h1: 'Touch n Go casino Malaysia',
    keyword: 'Touch n Go casino',
    kicker: 'TNG Digital wallet · Casino cashier not yet verified',
    answer:
        'Touch n Go casino means a cashier that claims Touch \'n Go eWallet, a wallet run by TNG Digital. 888reviews has not yet verified which operators accept it. Confirm the method in the cashier. Reloading the wallet itself is not the same thing as a casino withdrawal.',
    sections: [
        {
            h: 'Wallet reload is a different step',
            html: `<p>On 1 August 2023, TNG Digital said it had upgraded Touch 'n Go eWallet online-banking reloads from FPX to DuitNow Transfer, effective 31 July 2023. That announcement is about moving money into the wallet. It does not say that any casino accepts the wallet, and it does not state a casino withdrawal time.</p>
            <div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Touch n Go casino checks</caption><thead><tr><th scope="col">Check</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Casino cashier lists Touch 'n Go eWallet</td><td>Not yet verified</td></tr>
            <tr><td>Deposit minimum</td><td>Not yet verified</td></tr>
            <tr><td>Withdrawal back to the wallet</td><td>Not yet verified</td></tr>
            </tbody></table></div>`,
        },
        {
            h: 'Where this sits on the site',
            html: `<p>The existing <a href="/ewallet">e-wallet</a> page stays the hub. Short addresses that used to point at a Touch 'n Go path still redirect there. This longer page is the new note. Also see <a href="/duitnow-casino-malaysia">DuitNow</a> and <a href="/fpx-casino-malaysia">FPX</a>.</p>`,
        },
    ],
    citations: [
        ['TNG Digital, 1 August 2023 reload announcement', 'https://www.touchngo.com.my/news/touch-n-go-ewallet-upgrades-its-online-banking-reload-function-from-fpx-to-duitnow-transfer'],
        ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
        ['PayNet home', 'https://paynet.my/index.html'],
    ],
    links: [
        ['/ewallet', 'E-wallet hub'],
        ['/duitnow-casino-malaysia', 'DuitNow'],
        ['/fpx-casino-malaysia', 'FPX'],
        ['/reviews', 'Casino reviews'],
    ],
    faqs: [
        ['Does Touch \'n Go eWallet still reload by FPX?', 'TNG Digital\'s 1 August 2023 announcement said online-banking reloads moved from FPX to DuitNow Transfer, effective 31 July 2023. Check the wallet app for the current reload steps. That change is about the wallet, not a casino.'],
        ['Which casinos accept Touch \'n Go?', 'Not yet verified. This page will name an operator only when the cashier or the published terms show the wallet, with a date.'],
        ['Is a wallet reload a casino withdrawal?', 'No. Putting ringgit into Touch \'n Go eWallet is a step with TNG Digital or your bank. A casino withdrawal is a separate instruction inside the operator\'s cashier.'],
        ['Why is there still an e-wallet hub?', 'The hub is the existing overview. This page adds a Touch \'n Go note and links back to it. The hub\'s wording is unchanged.'],
    ],
});

addPage({
    slug: 'crypto-casino-malaysia',
    title: 'Crypto Casino Malaysia | 888reviews',
    description:
        'What to check before using a crypto casino cashier in Malaysia: asset, network, MYR conversion, and licence. Operator support is not yet verified. 18+.',
    h1: 'Crypto casino Malaysia',
    keyword: 'crypto casino Malaysia',
    kicker: 'Cashier checks · Coins and times not yet verified',
    answer:
        'A crypto casino Malaysia cashier claims transfers in a coin or token. 888reviews has not yet verified which assets, networks, or MYR conversions any operator supports. Check the asset, the network, the wallet address, and the licence record before you send funds.',
    sections: [
        {
            h: 'Checks with no published result yet',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Crypto casino checks</caption><thead><tr><th scope="col">Check</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Asset and network the cashier names</td><td>Not yet verified</td></tr>
            <tr><td>Whether a ringgit value is shown</td><td>Not yet verified</td></tr>
            <tr><td>Withdrawal time</td><td>Not yet verified</td></tr>
            <tr><td>Named operator and licence number</td><td>Not yet verified</td></tr>
            </tbody></table></div>
            <p>A crypto transfer can go to the wrong network and be unrecoverable. The operator's cashier has to name the network. We have not timed a transfer.</p>`,
        },
        {
            h: 'Licence is a separate question',
            html: `<p>Paying in a token does not change the <a href="/online-casino-malaysia-legal">legal reading</a>. An offshore licence is not a Malaysian licence. For ringgit cashiers, use the <a href="/best-online-casino-malaysia-ringgit">MYR checklist</a> and the <a href="/reviews">reviews</a>.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['PayNet home, for comparison with ringgit rails', 'https://paynet.my/index.html'],
        ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
    ],
    links: [
        ['/online-casino-malaysia-legal', 'Legal page'],
        ['/best-online-casino-malaysia-ringgit', 'MYR checklist'],
        ['/reviews', 'Casino reviews'],
        ['/fast-withdrawal-casino-malaysia', 'Withdrawal times'],
    ],
    faqs: [
        ['Which coins do Malaysian casino cashiers accept?', 'Not yet verified. This page does not name a coin, a network, or an operator.'],
        ['Is crypto faster than FPX?', 'Not yet verified. We have not published a timed crypto withdrawal or a timed FPX deposit.'],
        ['Does crypto avoid Malaysian law?', 'This page does not say that. Read the statutes linked from the legal page. This is not legal advice.'],
        ['Where are ringgit payment methods explained?', 'See the MYR checklist, FPX, DuitNow, and Touch \'n Go pages. Those are separate from a token cashier.'],
    ],
});

addPage({
    slug: 'no-deposit-bonus-malaysia',
    title: 'No Deposit Bonus Malaysia | 888reviews',
    description:
        'A no-deposit or free-credit casino offer still has wagering and withdrawal rules. No current Malaysia offer is verified on this page. 18+ only.',
    h1: 'No deposit bonus Malaysia',
    keyword: 'no deposit bonus Malaysia',
    kicker: 'Free credit · No current offer verified',
    answer:
        'A no deposit bonus Malaysia offer, sometimes searched as free credit casino Malaysia, is credit or spins the operator says you can claim without paying in. 888reviews has not verified a current offer. Wagering, game limits, and a withdrawal cap can still apply. Read the operator\'s terms.',
    sections: [
        {
            h: 'Nothing in the offer table is verified',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">No-deposit offers not yet verified</caption><thead><tr><th scope="col">Item</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Operator and offer name</td><td>Not yet verified</td></tr>
            <tr><td>Credit or spin amount</td><td>Not yet verified</td></tr>
            <tr><td>Wagering requirement</td><td>Not yet verified</td></tr>
            <tr><td>Maximum withdrawal</td><td>Not yet verified</td></tr>
            </tbody></table></div>
            <p>The <a href="/bonus">bonus hub</a> is unchanged. This page does not copy headline amounts into the empty play-style table.</p>`,
        },
        {
            h: 'How an offer should be read',
            html: `<p>According to a typical operator terms page, you need the wagering base (bonus only, or deposit plus bonus), the games that count, the maximum bet, the expiry, and the withdrawal cap. We will show that maths only when the terms URL and the figures are in front of us. See also <a href="/welcome-bonus-malaysia">welcome bonuses</a> and <a href="/how-we-rate">how we rate</a>.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['PayNet home', 'https://paynet.my/index.html'],
        ['PayNet FPX', 'https://www.paynet.my/business-solutions/fpx.html'],
    ],
    links: [
        ['/bonus', 'Bonus hub'],
        ['/welcome-bonus-malaysia', 'Welcome bonuses'],
        ['/how-we-rate', 'How we rate'],
        ['/reviews', 'Casino reviews'],
    ],
    faqs: [
        ['What is free credit casino Malaysia?', 'It is another way people search for a no-deposit offer: credit the operator says is free to claim. The words do not mean the offer has no wagering or no withdrawal cap. No current offer is verified here.'],
        ['Do you have a tested no-deposit code?', 'No. We are not publishing a code, an amount, or a wagering multiple without the operator\'s current terms.'],
        ['Why not fill the bonus hub table?', 'That table is already on the bonus hub. This page does not edit it. Sourced rows can be added later, underneath, when each figure has a URL and a date.'],
        ['Is a no-deposit offer legal in Malaysia?', 'This page does not answer that. Use the legal page and the official statutes. This is not legal advice.'],
    ],
});

addPage({
    slug: 'welcome-bonus-malaysia',
    title: 'Welcome Bonus Casino Malaysia | 888reviews',
    description:
        'How to read a welcome bonus for a new casino account in Malaysia. Amounts and wagering on this page are not yet verified. Confirm the operator. 18+.',
    h1: 'Welcome bonus casino Malaysia',
    keyword: 'welcome bonus casino Malaysia',
    kicker: 'First-deposit offers · Amounts not yet verified',
    answer:
        'A welcome bonus casino Malaysia offer is a promotion for a new account, usually tied to a first deposit. 888reviews has not verified current amounts or wagering. Use the operator\'s published terms as the source. Confirm eligibility, expiry, and the maximum bet before you opt in.',
    sections: [
        {
            h: 'Terms to collect before any comparison',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Welcome bonus fields not yet verified</caption><thead><tr><th scope="col">Term</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Match percentage and maximum</td><td>Not yet verified</td></tr>
            <tr><td>Wagering base and multiple</td><td>Not yet verified</td></tr>
            <tr><td>Game contribution</td><td>Not yet verified</td></tr>
            <tr><td>Expiry and maximum bet</td><td>Not yet verified</td></tr>
            </tbody></table></div>`,
        },
        {
            h: 'Where the existing bonus page fits',
            html: `<p>Compare the approach on the <a href="/bonus">bonus hub</a>, then open <a href="/reviews">the operator review</a>. No-deposit offers are separate: <a href="/no-deposit-bonus-malaysia">no deposit bonus Malaysia</a>. Payment method can change eligibility, so check <a href="/ewallet">e-wallet</a> terms as well.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['PayNet FPX', 'https://www.paynet.my/business-solutions/fpx.html'],
        ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
    ],
    links: [
        ['/bonus', 'Bonus hub'],
        ['/no-deposit-bonus-malaysia', 'No-deposit offers'],
        ['/reviews', 'Casino reviews'],
        ['/how-we-rate', 'How we rate'],
    ],
    faqs: [
        ['What is a welcome bonus?', 'It is an offer for a new account, often a match on the first deposit or a bundle of spins. The headline is not the amount you can withdraw. The operator\'s terms are.'],
        ['Which welcome bonus is best in Malaysia?', 'Not yet verified. We are not ranking amounts until each row has a terms URL, a wagering figure, and a date.'],
        ['Do you calculate expected value?', 'Only when the terms are sourced. This page does not publish a worked example with invented inputs.'],
        ['Can the payment method void the bonus?', 'It can, if the operator\'s terms say so. Read the excluded-methods line in those terms, and check the cashier before you deposit.'],
    ],
});

addPage({
    slug: 'fast-withdrawal-casino-malaysia',
    title: 'Fast Withdrawal Casino Malaysia | 888reviews',
    description:
        'No tested casino withdrawal time is published yet. This page explains what a dated test must include before any speed claim. Adults 18+ only.',
    h1: 'Fast withdrawal casino Malaysia',
    keyword: 'fast withdrawal casino Malaysia',
    kicker: 'No timed withdrawal published',
    answer:
        'Fast withdrawal casino Malaysia is a claim about payout speed. 888reviews has not published a tested withdrawal time for any operator. Until a dated record is linked, the time is not yet verified. A figure on an operator\'s website is their statement, not our test.',
    sections: [
        {
            h: 'The test log is empty',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Withdrawal tests</caption><thead><tr><th scope="col">Date</th><th scope="col">Operator</th><th scope="col">Method</th><th scope="col">Result</th><th scope="col">Evidence</th></tr></thead><tbody>
            <tr><td>${DATE_LABEL}</td><td>Not yet verified</td><td>Not yet verified</td><td>No test published</td><td>None linked</td></tr>
            </tbody></table></div>
            <p>A future row needs the clock times, the payment method, the amount, and a record we can keep. Until then we will not call a cashier "instant".</p>`,
        },
        {
            h: 'What an operator estimate is',
            html: `<p>If a site says a payout takes a number of minutes, that sentence is theirs. Our reviews can quote it as "according to the operator's published terms" once we have the URL. It still is not a tested time. See <a href="/ewallet">e-wallet</a>, <a href="/duitnow-casino-malaysia">DuitNow</a>, and <a href="/how-we-rate">how we rate</a>.</p>`,
        },
    ],
    citations: [
        ['PayNet personal solutions', 'https://www.paynet.my/personal-solutions.html'],
        ['PayNet FPX', 'https://www.paynet.my/business-solutions/fpx.html'],
        ['TNG Digital reload announcement, 1 August 2023', 'https://www.touchngo.com.my/news/touch-n-go-ewallet-upgrades-its-online-banking-reload-function-from-fpx-to-duitnow-transfer'],
    ],
    links: [
        ['/ewallet', 'E-wallet hub'],
        ['/duitnow-casino-malaysia', 'DuitNow'],
        ['/how-we-rate', 'How we rate'],
        ['/reviews', 'Casino reviews'],
    ],
    faqs: [
        ['Which casino pays out fastest in Malaysia?', 'Not yet verified. There is no tested ranking on this page.'],
        ['Why do other pages mention speed?', 'Some existing pages were already published with their own wording. This page does not edit them. It states that we have not published a timed test.'],
        ['What would a valid test include?', 'A date, the operator, the method, the amount, the request time, the arrival time, and a record of the transaction. A marketing line is not that record.'],
        ['Are PayNet transfers the same as a casino payout?', 'No. PayNet describes transfers between accounts that support its services. A casino still has its own approval step before it releases a withdrawal.'],
    ],
});

addPage({
    slug: 'editorial-team',
    title: 'Editorial Team | 888reviews',
    description:
        'Named 888reviews biographies are not published yet. Reviews follow the How we rate method. Use the contact page to reach the desk. Adults 18+ only.',
    h1: 'Editorial team',
    keyword: 'editorial team',
    kicker: 'Bios not yet published',
    answer:
        'This editorial team page is where named 888reviews biographies and credentials will sit. None are published yet, so this page does not invent reviewers. The method is on How we rate. The contact page is how you reach the desk. Commercial links do not set the score.',
    sections: [
        {
            h: 'What is published today',
            html: `<div class="live-casino-table-wrap"><table class="live-casino-data-table"><caption class="sr-only">Editorial team status</caption><thead><tr><th scope="col">Item</th><th scope="col">Status on ${DATE_LABEL}</th></tr></thead><tbody>
            <tr><td>Named author biography</td><td>Not yet published</td></tr>
            <tr><td>Credentials and relevant experience</td><td>Not yet published</td></tr>
            <tr><td>Named reviewer, separate from the author</td><td>Not yet named</td></tr>
            </tbody></table></div>
            <p>Until a real biography is supplied, bylines should say "888reviews editorial desk" and link here. Do not treat a missing name as a person.</p>`,
        },
        {
            h: 'How the desk works in the meantime',
            html: `<p>Scoring pillars already published on <a href="/how-we-rate">How we rate</a> stay the method. A <a href="/how-we-rate#sample-test-log">sample test log</a> records that no dated cash test is published yet. The <a href="/about">about page</a> explains the editorial purpose. Write to the desk through <a href="/contact">contact</a>.</p>
            <p>888reviews may receive a commission from some outbound links, at no additional cost to the reader. That relationship does not replace the editorial topics used in reviews.</p>`,
        },
    ],
    citations: [
        ['Attorney General\'s Chambers, Laws of Malaysia', 'https://lom.agc.gov.my/'],
        ['PayNet home', 'https://paynet.my/index.html'],
        ['BeGambleAware', 'https://www.begambleaware.org/'],
    ],
    links: [
        ['/about', 'About'],
        ['/how-we-rate', 'How we rate'],
        ['/contact', 'Contact'],
        ['/online-casino-malaysia-legal', 'Legal page'],
    ],
    faqs: [
        ['Who writes the reviews?', 'The editorial desk. Individual names, photos, and credentials are not published on this page yet.'],
        ['Does a commercial link change a score?', 'The published method says commercial relationships do not replace the editorial topics. A score still has to follow How we rate, and unverified fields stay unverified.'],
        ['How do I correct a page?', 'Use the contact page and point to the URL, the sentence, and the source you want checked. We do not take corrections inside the review template\'s rating fields without a source.'],
        ['Where is the legal reading?', 'On the online casino Malaysia legal page, which cites the statutes and says it is not legal advice.'],
    ],
});

function jsonLd(p) {
    const url = `https://888reviews.com/${p.slug}`;
    const graph = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://888reviews.com/' },
                { '@type': 'ListItem', position: 2, name: strip(p.h1), item: url },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: strip(p.h1),
            dateModified: DATE,
            url,
            inLanguage: 'en-US',
            author: {
                '@type': 'Organization',
                name: '888reviews editorial desk',
                url: 'https://888reviews.com/editorial-team',
            },
            publisher: { '@type': 'Organization', name: '888reviews', url: 'https://888reviews.com/' },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: p.faqs.map(([q, a]) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: strip(a) },
            })),
        },
    ];
    return graph.map((node) => `<script type="application/ld+json">${JSON.stringify(node)}</script>`).join('\n    ');
}

function renderPage(p) {
    const url = `https://888reviews.com/${p.slug}`;
    const sections = p.sections
        .map(
            (s, i) => `<section class="about-section about-section--card" aria-labelledby="${p.slug}-s${i}">
                    <h2 id="${p.slug}-s${i}">${s.h}</h2>
                    ${s.html}
                </section>`,
        )
        .join('\n');
    const cites = p.citations
        .map(
            ([label, href]) =>
                `<li><a href="${href}" rel="noopener noreferrer" target="_blank">${label}</a></li>`,
        )
        .join('\n');
    const related = p.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n                        ');
    const faqs = p.faqs.map(([q, a]) => faqItem(q, a)).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
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
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="888reviews">
    <meta property="og:locale" content="en_US">
    <meta property="og:title" content="${p.title.replace(/"/g, '&quot;')}">
    <meta property="og:description" content="${p.description.replace(/"/g, '&quot;')}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="https://888reviews.com/assets/img/888review-siteicon.webp">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${p.title.replace(/"/g, '&quot;')}">
    <meta name="twitter:description" content="${p.description.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="https://888reviews.com/assets/img/888review-siteicon.webp">
    ${jsonLd(p)}
    <link rel="dns-prefetch" href="https://www.googletagmanager.com">
    <link rel="stylesheet" href="/assets/css/styles.css">
    <link rel="stylesheet" href="/assets/css/fonts.css">
    <link rel="icon" href="/assets/img/888review-siteicon.webp" type="image/webp">
    <link rel="apple-touch-icon" href="/assets/img/888review-siteicon.webp">
</head>
${chromeHead}
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
                    <time class="malaysia-listing-meta__updated-date" datetime="${DATE}">${DATE_LABEL}</time>
                </div>
                ${badges()}
            </div>
        </div>
        <div class="static-page-layout container reveal">
            <article class="about-article" aria-labelledby="${p.slug}-h1">
                <p><strong>Author:</strong> 888reviews editorial desk. <strong>Reviewer:</strong> Not yet named. <a href="/editorial-team">Editorial team</a>.</p>
                <div class="about-article__grid">
                ${sections}
                </div>
                <section class="about-section about-section--card" aria-labelledby="${p.slug}-sources">
                    <h2 id="${p.slug}-sources">Sources checked</h2>
                    <ul>${cites}</ul>
                    <p>Adults 18+ only. Gambling involves financial risk. Confirm current terms with the operator. This page is not legal advice.</p>
                </section>
            </article>
        </div>
        <section class="guides-interstitial container reveal" aria-label="Related pages">
            <div class="gi-card">
                <div class="gi-content">
                    <p class="gi-kicker">Related</p>
                    <h2>Keep reading</h2>
                    <nav class="gi-links" aria-label="Related guides">
                        ${related}
                    </nav>
                </div>
            </div>
        </section>
        <section class="seo-accordion about-faq reveal" aria-labelledby="${p.slug}-faq">
            <div class="container">
                <div class="section-header center">
                    <h2 id="${p.slug}-faq">Frequently asked questions</h2>
                </div>
                <div class="accordion">
${faqs}
                </div>
            </div>
        </section>
    </main>
${footer}`;
}

for (const p of pages) {
    const file = path.join(pub, `${p.slug}.html`);
    fs.writeFileSync(file, renderPage(p));
    console.log('wrote', p.slug, 'title', p.title.length, 'desc', p.description.length, 'words', words(p.answer));
}

function patchFooter(file) {
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('href="/editorial-team"')) return;
    const re = /^([ \t]*)<li><a href="\/how-we-rate">How we rate<\/a><\/li>$/m;
    if (!re.test(html)) return;
    html = html.replace(re, (line, indent) => {
        return (
            line +
            `\n${indent}<li><a href="/editorial-team">Editorial team</a></li>` +
            `\n${indent}<li><a href="/online-casino-malaysia-legal">Casino law in Malaysia</a></li>`
        );
    });
    fs.writeFileSync(file, html);
}

for (const name of fs.readdirSync(pub)) {
    if (name.endsWith('.html')) patchFooter(path.join(pub, name));
}
patchFooter(path.join(pub, 'components', 'footer.html'));

function insertBefore(html, marker, block, guard) {
    if (html.includes(guard)) return html;
    const at = html.indexOf(marker);
    if (at < 0) throw new Error('missing marker ' + marker.slice(0, 70));
    const sectionAt = html.lastIndexOf('<section', at);
    const cut = sectionAt >= 0 ? sectionAt : at;
    return html.slice(0, cut) + withFileNewlines(html, block) + html.slice(cut);
}

function withFileNewlines(html, block) {
    if (html.includes('\r\n')) return block.replace(/\r?\n/g, '\r\n');
    return block.replace(/\r\n/g, '\n');
}

function appendFaqs(html, marker, items) {
    const at = html.indexOf(marker);
    if (at < 0) throw new Error('faq marker missing ' + marker);
    const re = /\r?\n                <\/div>\r?\n            <\/div>\r?\n        <\/section>/;
    const match = re.exec(html.slice(at));
    if (!match) throw new Error('faq close missing after ' + marker);
    const close = at + match.index;
    if (html.slice(at, close).includes(items[0].q)) return html;
    const nl = html.includes('\r\n') ? '\r\n' : '\n';
    const block = items.map(({ q, a }) => faqItem(q, a)).join(nl);
    return html.slice(0, close) + nl + withFileNewlines(html, block) + html.slice(close);
}

function appendFaqSchema(html, items) {
    return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
        if (!body.includes('"FAQPage"') && !body.includes('"@type": "FAQPage"')) return full;
        let data;
        try {
            data = JSON.parse(body.trim());
        } catch {
            return full;
        }
        if (!data || data['@type'] !== 'FAQPage' || !Array.isArray(data.mainEntity)) return full;
        const have = new Set(data.mainEntity.map((q) => q && q.name));
        const add = items.filter((item) => !have.has(item.q));
        if (!add.length) return full;
        const trimmed = body.trim();
        if (!trimmed.endsWith('}')) return full;
        const idx = trimmed.lastIndexOf(']');
        if (idx < 0) return full;
        const extra = add
            .map((item) =>
                JSON.stringify({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: strip(item.a) },
                }),
            )
            .join(',');
        const joiner = data.mainEntity.length ? ',' : '';
        const next = trimmed.slice(0, idx) + joiner + extra + trimmed.slice(idx);
        return `<script${attrs}>${next}</script>`;
    });
}

const hubs = [
    {
        file: 'index.html',
        marker: 'id="malaysia-faq-h2"',
        notes: '',
        faqs: [
            {
                q: 'Is online casino legal in Malaysia?',
                a: 'Online gambling laws and access rules vary by location and may change. An offshore licence does not mean that an online casino is licensed in Malaysia. Read the statutes named on the <a href="/online-casino-malaysia-legal">legal page</a>. This is not legal advice.',
            },
            {
                q: 'What should I check before using a casino reviewed here?',
                a: 'Check whether the cashier shows MYR, which payment methods are offered, the operator name, and the licence details the site displays. Withdrawal times on 888reviews are not yet verified unless a dated test is linked. Confirm the operator\'s current terms before you deposit.',
            },
        ],
    },
    {
        file: 'reviews.html',
        marker: 'id="reviews-faq"',
        notes: `<section class="casinos-seo container reveal" id="reviews-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="reviews-notes-h2">
            <h2 id="reviews-notes-h2">How to use this page</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. A row in the directory above is not proof that the operator accepts Malaysian players or pays in ringgit. Open the review, then confirm the cashier. Legal reading is on the <a href="/online-casino-malaysia-legal">legal page</a>. Currency checks are on the <a href="/best-online-casino-malaysia-ringgit">MYR page</a>. The people behind the method are on the <a href="/editorial-team">editorial team</a> page.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Does a listed review mean the casino is licensed in Malaysia?',
                a: 'No. An offshore licence does not mean that an online casino is licensed in Malaysia. Use the <a href="/online-casino-malaysia-legal">legal page</a> for the statutes. This is not legal advice.',
            },
            {
                q: 'How do I check MYR support?',
                a: 'Use the <a href="/best-online-casino-malaysia-ringgit">ringgit checklist</a>, then the operator cashier. A review row is not a verified MYR withdrawal.',
            },
            {
                q: 'What if the review is still short?',
                a: 'Leave it. A short review stays up until sourced fields exist. We do not fill gaps with estimates. The method is on <a href="/how-we-rate">How we rate</a>.',
            },
        ],
    },
    {
        file: 'bonus-hub.html',
        marker: 'id="bonus-faq"',
        notes: `<section class="casinos-seo container reveal" id="bonus-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="bonus-notes-h2">
            <h2 id="bonus-notes-h2">How to use this page</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. Offers change. A headline on this page is not a verified amount unless a terms URL is attached. Read <a href="/welcome-bonus-malaysia">welcome bonuses</a> and <a href="/no-deposit-bonus-malaysia">no-deposit offers</a>. The play-style table above is unchanged. We have not added estimated rows.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Has a welcome bonus amount been verified here?',
                a: 'Not on the new welcome-bonus page. Amounts stay not yet verified until the operator\'s terms are cited. Start at <a href="/welcome-bonus-malaysia">welcome bonus casino Malaysia</a>.',
            },
            {
                q: 'What is a no-deposit offer?',
                a: 'Credit or spins an operator says you can claim without paying in. Wagering can still apply. No current offer is verified on the <a href="/no-deposit-bonus-malaysia">no-deposit page</a>.',
            },
            {
                q: 'Why are some bonus tables without rows?',
                a: 'Those tables were already published that way. This note does not fill them. A sourced table can be added later, underneath, with a date.',
            },
        ],
    },
    {
        file: 'slots.html',
        marker: 'id="slot-faq"',
        notes: `<section class="casinos-seo container reveal" id="slots-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="slots-notes-h2">
            <h2 id="slots-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. The RTP column above tells you to check the active game version. That cell is not a measured RTP. We are not publishing a second table of invented percentages. Jackpot amounts elsewhere on the site are not treated as live figures on this note. Read <a href="/how-we-rate">how RTP is scored</a> and confirm the in-game information screen.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Why does the RTP column say to check the game version?',
                a: 'Because a published RTP can differ by version. The column is not a tested percentage. Check the information screen in the game you open.',
            },
            {
                q: 'Is there a verified RTP table underneath?',
                a: 'Not yet. A verified table will be added only when each figure has a provider source and the game version that was checked.',
            },
            {
                q: 'Do homepage jackpot figures update live?',
                a: 'Do not treat them as a live feed. The homepage already says jackpot values move. This note does not replace those cards.',
            },
        ],
    },
    {
        file: 'malaysia-ewallet.html',
        marker: 'id="e-wallet-faq"',
        notes: `<section class="casinos-seo container reveal" id="ewallet-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="ewallet-notes-h2">
            <h2 id="ewallet-notes-h2">How to use this page</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. The comparison tables above have no sourced rows yet, and this note does not invent limits or times. Separate checks: <a href="/fpx-casino-malaysia">FPX</a>, <a href="/duitnow-casino-malaysia">DuitNow</a>, <a href="/touch-n-go-casino-malaysia">Touch 'n Go</a>, and <a href="/fast-withdrawal-casino-malaysia">withdrawal tests</a>. No timed withdrawal is published.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Have e-wallet withdrawal times been tested?',
                a: 'Not yet. The <a href="/fast-withdrawal-casino-malaysia">fast-withdrawal page</a> has an empty test log. Operator wording is not our clock.',
            },
            {
                q: 'What is FPX?',
                a: 'PayNet\'s online banking payment service. Which casinos accept it is <a href="/fpx-casino-malaysia">not yet verified</a>.',
            },
            {
                q: 'What is DuitNow?',
                a: 'PayNet\'s transfer brand across banks and e-wallets. Casino support is <a href="/duitnow-casino-malaysia">not yet verified</a>.',
            },
            {
                q: 'Is Touch \'n Go eWallet reload the same as FPX?',
                a: 'TNG Digital said on 1 August 2023 that online-banking reloads moved from FPX to DuitNow Transfer. That is the wallet reload, not a casino payout. See <a href="/touch-n-go-casino-malaysia">Touch n Go casino</a>.',
            },
        ],
    },
    {
        file: 'live-casino.html',
        marker: 'id="live-casino-faq"',
        notes: `<section class="casinos-seo container reveal" id="live-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="live-notes-h2">
            <h2 id="live-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. A live table listing is not a Malaysian licence and not a tested payout time. Read <a href="/online-casino-malaysia-legal">the legal page</a>, then the game notes for <a href="/baccarat">baccarat</a>, <a href="/blackjack">blackjack</a>, and <a href="/roulette">roulette</a>. Confirm table limits inside the lobby while signed in.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Does a live casino listing mean the studio is licensed in Malaysia?',
                a: 'No. An offshore licence does not mean licensed in Malaysia. See the <a href="/online-casino-malaysia-legal">legal page</a>. This is not legal advice.',
            },
            {
                q: 'Are table limits for Malaysian players verified?',
                a: 'Not on this note. Limits can change by table. Read the limit shown in the lobby before you sit.',
            },
            {
                q: 'Where are the table-game pages?',
                a: 'Use <a href="/baccarat">baccarat</a>, <a href="/blackjack">blackjack</a>, and <a href="/roulette">roulette</a>. Each has its own Malaysia note under the existing copy.',
            },
        ],
    },
    {
        file: 'mobile.html',
        marker: 'id="mobile-faq"',
        notes: `<section class="casinos-seo container reveal" id="mobile-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="mobile-notes-h2">
            <h2 id="mobile-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. This note does not name a tested casino app. A phone browser and an installed app can differ. Check MYR and payments in the cashier on the device you will use. See the <a href="/best-online-casino-malaysia-ringgit">ringgit checklist</a> and <a href="/ewallet">e-wallet hub</a>.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Is there a tested casino app for Malaysia on this site?',
                a: 'Not yet verified. We have not published a dated install, deposit, and withdrawal on a named app.',
            },
            {
                q: 'Is the mobile site the same as an app?',
                a: 'Not always. Confirm whether you are in a browser or an installed app, and whether the cashier shows the same methods.',
            },
            {
                q: 'Which payments should I check on a phone?',
                a: 'Whichever the cashier lists. FPX, DuitNow, and Touch \'n Go each have a guide, and none of those guides claim a tested app payout.',
            },
        ],
    },
    {
        file: 'games-baccarat.html',
        marker: 'id="baccarat-faq"',
        notes: `<section class="casinos-seo container reveal" id="baccarat-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="baccarat-notes-h2">
            <h2 id="baccarat-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. House-edge figures depend on the rules of the version you open, including commission. This note does not replace the sections above and does not add a new edge. An offshore licence is not a Malaysian licence. See the <a href="/online-casino-malaysia-legal">legal page</a> and the <a href="/live">live casino hub</a>.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Is online baccarat licensed in Malaysia because a site lists it?',
                a: 'No. Game availability is not a Malaysian licence. Read the <a href="/online-casino-malaysia-legal">legal page</a>. This is not legal advice.',
            },
            {
                q: 'Which baccarat version did you measure?',
                a: 'None on this note. Check the commission and the side-bet rules inside the game you join.',
            },
            {
                q: 'Where is the live dealer overview?',
                a: 'On the <a href="/live">live casino</a> page. This baccarat page keeps its existing copy, with this note added underneath.',
            },
        ],
    },
    {
        file: 'games-blackjack.html',
        marker: 'aria-labelledby="blackjack-faq-h2"',
        notes: `<section class="casinos-seo container reveal" id="blackjack-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="blackjack-notes-h2">
            <h2 id="blackjack-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. Blackjack return depends on the rules of the table you sit at, including decks and whether the dealer stands or hits on soft 17. This note does not publish a new house edge. Legal questions go to the <a href="/online-casino-malaysia-legal">legal page</a>, not to a strategy chart.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Does this page decide if blackjack is legal in Malaysia?',
                a: 'No. Use the <a href="/online-casino-malaysia-legal">legal page</a> and the official statutes. This is not legal advice. The sections above are unchanged.',
            },
            {
                q: 'Have you verified a house edge for Malaysian tables?',
                a: 'Not yet. Read the rules displayed on the table before you play. A general chart is not that table.',
            },
            {
                q: 'Where do I check the operator?',
                a: 'On the <a href="/reviews">casino reviews</a> and in the cashier. A game page is not a payout test.',
            },
        ],
    },
    {
        file: 'games-roulette.html',
        marker: 'id="roulette-faq"',
        notes: `<section class="casinos-seo container reveal" id="roulette-malaysia-notes" data-seo-add="hub-notes" aria-labelledby="roulette-notes-h2">
            <h2 id="roulette-notes-h2">Malaysia notes</h2>
            <p>Last verified: <time datetime="${DATE}">${DATE_LABEL}</time>. European and American wheels are different games. This note does not name a best casino and does not add a measured edge. Confirm the wheel in the lobby. Legal reading is on the <a href="/online-casino-malaysia-legal">legal page</a>. The live overview is <a href="/live">here</a>.</p>
        </section>
        `,
        faqs: [
            {
                q: 'Is online roulette licensed in Malaysia if the page lists casinos?',
                a: 'No. A list is not a licence. See the <a href="/online-casino-malaysia-legal">legal page</a>. This is not legal advice.',
            },
            {
                q: 'Which wheel should I check?',
                a: 'The wheel shown in the game, including how many zeros it has. Do not assume the version from a general article.',
            },
            {
                q: 'Have withdrawal times for roulette sites been tested?',
                a: 'Not yet. The <a href="/fast-withdrawal-casino-malaysia">fast-withdrawal page</a> has no timed result.',
            },
        ],
    },
];

for (const hub of hubs) {
    const file = path.join(pub, hub.file);
    let html = fs.readFileSync(file, 'utf8');
    if (hub.notes) html = insertBefore(html, hub.marker, hub.notes, 'data-seo-add="hub-notes"');
    html = appendFaqs(html, hub.marker, hub.faqs);
    html = appendFaqSchema(html, hub.faqs);
    fs.writeFileSync(file, html);
    console.log('hub', hub.file);
}

let index = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
if (!index.includes('id="malaysia-glance"')) {
    const block = `        <section class="malaysia-section container reveal" id="malaysia-glance" aria-labelledby="malaysia-glance-h2">
            <h2 id="malaysia-glance-h2">Online casino Malaysia at a glance</h2>
            <p>An online casino Malaysia search usually means a site that accepts Malaysian players, shows MYR or a conversion, and lists local payment options. 888reviews compares published licence details, bonus terms, and withdrawal conditions. Figures are included only when sourced. This is not legal advice. Confirm the operator's current terms before you deposit.</p>
            <p class="terms-last-updated"><span class="malaysia-listing-meta__updated-label">Last verified:</span> <time datetime="${DATE}">${DATE_LABEL}</time></p>
            <p>Start with <a href="/online-casino-malaysia-legal">online casino Malaysia legal</a>, <a href="/best-online-casino-malaysia-ringgit">online casino MYR</a>, <a href="/fpx-casino-malaysia">FPX</a>, <a href="/duitnow-casino-malaysia">DuitNow</a>, <a href="/touch-n-go-casino-malaysia">Touch n Go</a>, <a href="/crypto-casino-malaysia">crypto</a>, <a href="/welcome-bonus-malaysia">welcome bonuses</a>, <a href="/no-deposit-bonus-malaysia">no-deposit offers</a>, and <a href="/fast-withdrawal-casino-malaysia">withdrawal times</a>.</p>
        </section>

        <section class="malaysia-section container reveal" id="malaysia-trust" aria-labelledby="malaysia-trust-h2">
            <h2 id="malaysia-trust-h2">Why trust 888reviews</h2>
            <p>888reviews does not operate a casino or accept bets. Rankings follow the criteria on <a href="/how-we-rate">How we rate</a>. Named biographies are listed on the <a href="/editorial-team">editorial team</a> page when they have been supplied. None are published there yet. Commercial links are disclosed in the page footer and do not replace those criteria.</p>
            <div class="malaysia-listing-meta" aria-label="Trust indicators">
                <div class="malaysia-listing-meta__inner">
                    ${badges()}
                </div>
            </div>
        </section>

`;
    const marker = '        <!-- 2. Top casino comparison -->';
    const at = index.indexOf(marker);
    if (at < 0) throw new Error('homepage marker missing');
    index = index.slice(0, at) + withFileNewlines(index, block) + index.slice(at);
    fs.writeFileSync(path.join(pub, 'index.html'), index);
    console.log('homepage blocks');
}

let aboutHtml = fs.readFileSync(path.join(pub, 'about.html'), 'utf8');
if (!aboutHtml.includes('id="about-how-run"')) {
    const block = `        <div class="static-page-layout container reveal" id="about-how-run">
            <article class="about-article" aria-labelledby="about-how-run-h2">
                <header class="about-article__intro">
                    <h2 id="about-how-run-h2">How this site is run</h2>
                    <p>Added <time datetime="${DATE}">${DATE_LABEL}</time>. Contact, the team page, revenue, and the review method are set out here.</p>
                </header>
                <div class="about-article__grid">
                    <section class="about-section about-section--card" aria-labelledby="about-contact-method">
                        <h2 id="about-contact-method">Contact</h2>
                        <p>Use the <a href="/contact">contact page</a>. A separate legal entity name is not published on this site yet.</p>
                    </section>
                    <section class="about-section about-section--card" aria-labelledby="about-team-link">
                        <h2 id="about-team-link">Team</h2>
                        <p>The <a href="/editorial-team">editorial team</a> page will hold named biographies. None are published yet.</p>
                    </section>
                    <section class="about-section about-section--card" aria-labelledby="about-revenue">
                        <h2 id="about-revenue">How revenue works</h2>
                        <p>888reviews may receive a commission from some outbound links, at no additional cost to the reader. Commercial relationships do not replace the editorial topics used in our reviews.</p>
                    </section>
                    <section class="about-section about-section--card" aria-labelledby="about-process">
                        <h2 id="about-process">Editorial process</h2>
                        <p>The scoring method is <a href="/how-we-rate">How we rate</a>. The <a href="/how-we-rate#sample-test-log">sample test log</a> shows that no dated cash test is published yet.</p>
                    </section>
                </div>
            </article>
        </div>

`;
    aboutHtml = insertBefore(aboutHtml, 'id="about-faq-heading"', block, 'id="about-how-run"');
    fs.writeFileSync(path.join(pub, 'about.html'), aboutHtml);
    console.log('about section');
}

let hwr = fs.readFileSync(path.join(pub, 'how-we-rate.html'), 'utf8');
if (!hwr.includes('id="sample-test-log"')) {
    const block = `            <section class="how-we-rate-section hwr-section container" id="sample-test-log" aria-labelledby="sample-test-log-heading">
                <div class="hwr-section-head">
                    <p class="hwr-section-head__kicker"><i data-lucide="clipboard-list" aria-hidden="true"></i> Added ${DATE_LABEL}</p>
                    <h2 id="sample-test-log-heading">Sample test log</h2>
                    <p class="hwr-section-head__dek">The weights in Casino Review Methodology above are the published weights. This log does not add a second set of percentages.</p>
                </div>
                <div class="hwr-table-wrap">
                    <table class="hwr-data-table">
                        <caption class="sr-only">Sample test log</caption>
                        <thead>
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Operator</th>
                                <th scope="col">Action</th>
                                <th scope="col">Result</th>
                                <th scope="col">Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${DATE_LABEL}</td>
                                <td>Not yet verified</td>
                                <td>Deposit and withdrawal</td>
                                <td>No dated test published</td>
                                <td>None linked</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>A later row needs a date, an operator, a method, an amount, clock times, and a record. Until then, payout lines stay "according to the operator's published terms" or "Not yet verified".</p>
            </section>

`;
    const marker = '        <div class="hwr-trust-strip container"';
    const at = hwr.indexOf(marker);
    if (at < 0) throw new Error('hwr marker missing');
    hwr = hwr.slice(0, at) + withFileNewlines(hwr, block) + hwr.slice(at);
    fs.writeFileSync(path.join(pub, 'how-we-rate.html'), hwr);
    console.log('how we rate log');
}

const llms = `# 888reviews

Independent editorial site about online casinos for readers in Malaysia. English. 888reviews does not operate a casino. Pages are not legal advice.

## Prefer these URLs
- https://888reviews.com/
- https://888reviews.com/online-casino-malaysia-legal
- https://888reviews.com/best-online-casino-malaysia-ringgit
- https://888reviews.com/fpx-casino-malaysia
- https://888reviews.com/duitnow-casino-malaysia
- https://888reviews.com/touch-n-go-casino-malaysia
- https://888reviews.com/crypto-casino-malaysia
- https://888reviews.com/no-deposit-bonus-malaysia
- https://888reviews.com/welcome-bonus-malaysia
- https://888reviews.com/fast-withdrawal-casino-malaysia
- https://888reviews.com/editorial-team
- https://888reviews.com/how-we-rate
- https://888reviews.com/reviews

## Accuracy
Quote a figure only when the page states a source or says it is not yet verified. An offshore licence is not described as a Malaysian licence. Last verified dates are written on the page.
`;
fs.writeFileSync(path.join(pub, 'llms.txt'), llms);
console.log('llms.txt');
