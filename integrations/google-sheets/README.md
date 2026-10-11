# Website inquiries → Google Sheets

**Target sheet:** [IDT inquiries Customer Sheet](https://docs.google.com/spreadsheets/d/1PFcFnG6O4vjopl6LTH36UqiVED-HMLm7V9Mge56J9HM/edit) (Google account `pharosline.agency@gmail.com`, tab "Inquiries", Cairo time zone, Status drop-down: New / Contacted / Quoted / Won / Lost).

Do the Apps Script steps below while signed in as **pharosline.agency@gmail.com**.

## One-time setup (about 3 minutes)

1. Open the sheet, then go to **Extensions → Apps Script**.
2. Delete the sample code, paste the contents of `inquiries.gs`, then **Save**.
3. Optional: set `NOTIFY_EMAIL` at the top of the script to also get an e-mail for every inquiry.
4. Go to **Deploy → New deployment → Select type: Web app** and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**, then **Authorize access**. Choose the account. On the "Google hasn't verified this app" screen, click **Advanced → Go to … (unsafe)**. It is your own script.
6. Copy the **Web app URL** (it ends in `/exec`).
7. Paste the URL into `js/services/inquiry.js`:

```js
export const INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/…/exec';
```

To check the deployment, open the URL in a browser. You should see `{"ok":true,"service":"IDT inquiries"}`.

## Reviews (moderated)

- **Submission:** visitors use **Write a review** on the home page or a product page. Each review lands in the **Reviews** tab with Status **Pending**.
- **Approval:** set Status to **Approved** (the drop-down highlights it in gold). The review appears on the site, newest first.
  - On the home page: all approved reviews.
  - On product pages: only reviews for that product.
- **Delay:** visitors' browsers cache the list for 5 minutes, so an approval can take up to 5 minutes to show.
- **Rejected:** **Rejected**, or deleting the row, keeps a review hidden.
- **Privacy:** the e-mail column and the hidden Product ID column are never shown publicly.

## Behaviour

- **Each submission** appends a row: date/time, status `New`, products, name, company, e-mail, phone, country, timeline, message, and the page the form was sent from.
- **First row:** the header is formatted in IDT black and gold and frozen on the first inquiry.
- **Spam guard:** a hidden `website` field catches basic bots, and those submissions are silently ignored.
- **If sending fails** (no URL set, offline, or script error), the visitor is offered **Send by email**, **Send on WhatsApp** and **Copy summary**. Nothing is lost.
- **After editing `inquiries.gs`:** go to **Deploy → Manage deployments → Edit → Version: New version**. The URL stays the same.
