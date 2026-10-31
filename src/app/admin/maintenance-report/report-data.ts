// Content for the one-off maintenance report (/admin/maintenance-report).
// Written for the business owner: plain language, business impact first.
// Delete this folder once the report has been presented.

export const REPORT_DATE = "31 October 2026";

export type Severity = "critical" | "high" | "medium" | "low";

export interface Finding {
  title: string;
  before: string;
  after: string;
  severity: Severity; // how serious it was BEFORE the fix
  /** Set when the problem was found in the code but not yet confirmed on the live site. */
  unconfirmed?: boolean;
}

export interface Area {
  id: string;
  title: string;
  why: string;
  findings: Finding[];
}

export const AREAS: Area[] = [
  {
    id: "security",
    title: "Protecting your business information",
    why: "Your client list, negotiated prices and orders are commercially sensitive. These were the most serious problems.",
    findings: [
      {
        severity: "critical",
        title: "Client price lists and private ordering links were readable by anyone",
        before:
          "Anyone with basic technical knowledge could download every client's private ordering link and every negotiated price, without logging in. A competitor could have seen your full pricing.",
        after:
          "Only the website's own server can read price lists. Each client's link stays private to that client.",
      },
      {
        severity: "critical",
        title: "Anyone could have made themselves an administrator",
        before:
          "The admin area only checked whether a person was signed in, and new accounts could be created freely. A stranger could have taken full control of clients, orders and prices.",
        after:
          "Only two named accounts have admin rights. Everyone else is refused, both by the website and by the database itself.",
      },
      {
        severity: "high",
        title: "Orders could be submitted with made-up prices",
        before:
          "Someone could send an order at $0.01 a fish against a real client's name, and the system would email out an invoice showing those prices.",
        after:
          "Every price is looked up from your own price list on the server. Prices sent by a browser are ignored.",
      },
      {
        severity: "high",
        title: "Orders could be written straight into the database, skipping all checks",
        before:
          "The database accepted new orders from anyone, bypassing the order form's checks, spam protection and limits.",
        after:
          "Orders can only be created through the website, after every check has passed.",
      },
      {
        severity: "high",
        title: "The website software had a known critical security flaw",
        before:
          "The website framework (Next.js) and the email software were outdated versions with publicly known security problems.",
        after: "Both updated to the current fixed versions.",
      },
      {
        severity: "medium",
        title: "The order form could be abused to send email in your name",
        before:
          "The spam limits on the order form were easy to get around, so it could be used to send many \"order\" emails from INÁ to any address, harming your email reputation.",
        after:
          "Two layers of limits: the server blocks floods before they reach the website, and the website caps orders per visitor and per email address.",
      },
      {
        severity: "medium",
        title: "Blog posts could carry harmful code",
        before:
          "Malicious code hidden in a blog post could have run in your visitors' browsers.",
        after: "Blog content is now cleaned by a well-tested, widely used safety library.",
      },
      {
        severity: "medium",
        title: "Private client details were sent to the client's browser",
        before:
          "The private order page also sent your internal notes about the client, their address and the link's secret key to the browser, hidden from view but there to read.",
        after: "Only the details needed to fill in the order form are sent.",
      },
      {
        severity: "medium",
        title: "The admin sign-in page could forward people to a fake site",
        before:
          "A specially crafted sign-in link could send an admin to an outside website straight after they logged in, a common phishing trick.",
        after: "After sign-in, people can only be sent to pages on your own site.",
      },
      {
        severity: "low",
        title: "Uploaded files weren't checked",
        before: "Images and spreadsheets of any size or type could be uploaded in the admin area.",
        after: "Uploads are limited to 10 MB, and images are checked to be genuine pictures.",
      },
    ],
  },
  {
    id: "orders",
    title: "Making sure every order reaches you",
    why: "An order that silently fails is a lost sale, and the customer may not try again.",
    findings: [
      {
        severity: "high",
        unconfirmed: true,
        title: "Customers who weren't logged in may not have been able to order",
        before:
          "Our review of the code found that the database blocked a step the order form relies on for ordinary (not signed-in) visitors. They would have seen \"We couldn't submit your order\". Staff testing while signed in wouldn't notice.",
        after:
          "Orders are now saved by the server itself, so this can't happen. We recommend placing one test order after go-live to confirm.",
      },
      {
        severity: "medium",
        title: "Failed order emails went unnoticed",
        before:
          "If the email service had a problem, neither you nor the customer got the order email, and nothing recorded that it had failed.",
        after: "Every failed email is now recorded in the server's log so it can be spotted and fixed.",
      },
      {
        severity: "medium",
        title: "A double-click could create the same order twice",
        before: "Clicking submit twice, or a slow connection retrying, could create duplicate orders and duplicate emails.",
        after: "Repeat submissions are recognised and the original order reference is returned.",
      },
      {
        severity: "medium",
        title: "Out-of-stock fish could still be ordered",
        before: "Fish marked unavailable could still be added to an order and submitted.",
        after: "Unavailable fish are greyed out, and the server refuses them with a clear message.",
      },
      {
        severity: "low",
        title: "Customers were told their order was \"Confirmed\" too early",
        before: "The automatic email said \"Order Confirmed\" before your team had reviewed it.",
        after: "It now says \"Order Received\". Your team confirms the order separately.",
      },
    ],
  },
  {
    id: "data",
    title: "Keeping your data complete and accurate",
    why: "Wrong or missing data leads to wrong quotes, missed orders and wasted staff time.",
    findings: [
      {
        severity: "high",
        title: "Lists silently stopped at 1,000 rows (the issue you reported)",
        before:
          "The database sends at most 1,000 rows at a time, and the website never asked for more. This is why price auto-fill dropped species. The same thing affected the order list, dashboard totals, exports and imports: anything past 1,000 rows simply went missing.",
        after: "Everything is now fetched in full, however large it grows.",
      },
      {
        severity: "high",
        title: "Re-importing the species spreadsheet could wipe information",
        before:
          "Importing a sheet with only a few columns reset everything else (categories, sizes, descriptions, featured fish) and changed \"In Stock\" fish to \"On Request\".",
        after:
          "An import only changes what the sheet actually contains. Blank cells keep the current value.",
      },
      {
        severity: "high",
        title: "A failed price upload could delete a region's prices",
        before:
          "Uploading regional prices deleted the old prices first. If the upload then failed, that region was left with no prices at all.",
        after: "An upload either fully succeeds or changes nothing. The old prices stay until the new ones are safely saved.",
      },
      {
        severity: "medium",
        title: "The orders spreadsheet export was broken",
        before: "The exported file opened in Excel with columns jumbled, and stopped at 1,000 orders.",
        after: "It opens correctly and includes every order.",
      },
      {
        severity: "medium",
        title: "Price lists expired a day early and ignored start dates",
        before:
          "A list \"valid until 31 October\" stopped working in the early hours of 31 October, and lists set to start in the future worked immediately.",
        after: "Lists work for the whole of their last day and only from their start date.",
      },
      {
        severity: "medium",
        title: "Two price lists couldn't share a title",
        before: "Creating a second list called, say, \"2026 Price List\" for another client failed with a technical error.",
        after: "Any number of lists can share a title.",
      },
      {
        severity: "medium",
        title: "Sample fish appeared when the database had a problem",
        before:
          "If the database was briefly unavailable, the catalogue quietly showed built-in sample fish, which weren't your real stock. Customers could add those to orders.",
        after: "Visitors now see a clear \"please try again\" message instead of fake stock.",
      },
      {
        severity: "low",
        title: "Price auto-fill could pick the wrong size",
        before: "For fish sold in several sizes, auto-fill took whichever size came first alphabetically (\"Large\" before \"Small\").",
        after: "It follows the size order set for each fish.",
      },
      {
        severity: "low",
        title: "The dashboard counted late-night orders on the wrong day",
        before: "Orders placed between midnight and 1 a.m. Lagos time were counted on the previous day.",
        after: "The daily chart now uses Lagos time.",
      },
    ],
  },
  {
    id: "experience",
    title: "Customer experience and reputation",
    why: "How the site looks, behaves and treats visitors' privacy reflects directly on the brand.",
    findings: [
      {
        severity: "medium",
        title: "Visitors' privacy and EU cookie rules",
        before:
          "Google Analytics ran on every page, including private client price-list links and the admin area, without asking visitors for permission, which is a concern for EU buyers under GDPR.",
        after:
          "Analytics only starts after a visitor agrees in a cookie banner, and never runs on private or admin pages.",
      },
      {
        severity: "medium",
        title: "Errors showed a bare technical screen",
        before: "Any unexpected problem showed a plain, unbranded error page.",
        after: "Branded error pages with a \"Try again\" button.",
      },
      {
        severity: "medium",
        title: "Hard to use without a mouse or with a screen reader",
        before: "The product details window, several buttons and form fields couldn't be used by keyboard or weren't described to screen readers.",
        after: "These now work by keyboard and are properly labelled.",
      },
      {
        severity: "medium",
        title: "Server load and page speed",
        before:
          "Fish photos were re-processed by the server far more often than needed, and every visitor downloaded unused code.",
        after:
          "Processed photos are kept for 30 days, static files are served without touching the website software, and the unused code was removed.",
      },
      {
        severity: "low",
        title: "Search engines and social sharing",
        before: "Search engines weren't told about the blog, and every page shared on social media showed the homepage preview.",
        after: "The blog is listed for search engines, and each page has its own share preview.",
      },
    ],
  },
  {
    id: "operations",
    title: "Running the website safely day to day",
    why: "These don't change what visitors see, but they make every future change safer, faster and cheaper.",
    findings: [
      {
        severity: "medium",
        title: "No automatic checks before changes go live",
        before:
          "Updates were put live by hand, with no automatic testing and no quick way to undo a bad update.",
        after:
          "Every change is now automatically checked (86 tests plus code and security checks) before it can go live. Updates are deployed automatically, and roll back on their own if the site doesn't come up healthy.",
      },
      {
        severity: "low",
        title: "Setup knowledge lived only in people's heads",
        before: "There was no complete list of settings or step-by-step release instructions.",
        after: "A full settings checklist, release checklist and updated technical guide are now in place.",
      },
    ],
  },
];

export const OWNER_ACTIONS: { title: string; detail: string }[] = [
  {
    title: "Confirm who should have admin access",
    detail:
      "Admin rights are set for inaornamental@gmail.com and aeben.adebanjo@gmail.com. Tell us if anyone should be added or removed.",
  },
  {
    title: "Approve go-live",
    detail:
      "The fixes are finished and tested but take effect at the next update of the live site, which includes a short database update. Plan a quiet time of day; visitors won't notice.",
  },
  {
    title: "Add a Privacy Policy page",
    detail:
      "The new cookie banner should link to a privacy policy explaining what data is collected. We recommend adding one; we can draft it for your review.",
  },
  {
    title: "Check the figures on the homepage",
    detail:
      "The site states 22+ years, 160+ species, 30+ countries and 500+ clients. Please confirm these are still accurate.",
  },
  {
    title: "Decide whether the brochure PDF should be public",
    detail:
      "The company brochure (INA.pdf) can be downloaded by anyone who knows its web address. Tell us if that's intended.",
  },
  {
    title: "Place one test order after go-live",
    detail:
      "Open a client's price-list link in a private browser window (not signed in) and place a small order, to confirm orders and emails flow end to end.",
  },
];

export const NEXT_STEPS: { title: string; detail: string }[] = [
  {
    title: "Turn on the full browser security policy",
    detail:
      "A stricter security policy is running in \"watch only\" mode, recording anything it would have blocked. After one to two weeks with no problems, it can be switched to full protection.",
  },
  {
    title: "One-time setup for automatic deployments",
    detail:
      "The automatic update pipeline is ready. It needs about an hour of one-time setup on the server and in GitHub before first use.",
  },
  {
    title: "Contact details in one place",
    detail:
      "Your WhatsApp number and email appear in seven places in the site's code. Moving them into the admin Settings page would let staff update them without a developer.",
  },
  {
    title: "Third-party software warnings",
    detail:
      "The spreadsheet tool the site uses has some moderate warnings in its own components, with no safe update available yet. They are watched by weekly automatic update checks.",
  },
];
