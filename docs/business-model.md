# Construction Materials Marketplace (Khujand): Business Model

An asset-light, supplier-fulfilled marketplace. Suppliers hold the stock, set their prices and deliver. The platform owns demand, the trust layer and the transaction flow.

**Scope:** Multiple suppliers · homeowners and contractors · retail and wholesale · Khujand · Tajik, Russian, English

---

## 1. Core model

**The platform does:**
- Platform (app, admin, supplier dashboard)
- Supplier onboarding and verification
- Customer acquisition and support
- Dispute mediation
- Commission collection

**Suppliers do:**
- Stock and listing their products
- Pricing, including wholesale tiers
- Delivery, with their own trucks or a courier they choose
- Returns under their own policy

**The platform does not do (at least at first):**
- Warehousing
- A delivery fleet
- Buying or reselling goods
- Product data entry for suppliers

---

## 2. Two buying flows

1. **Retail (homeowners):** Standard browse, cart and checkout, with a fixed price per unit.
2. **Wholesale (contractors):** A request-for-quote (RFQ) flow. The contractor posts a materials list (for example, "200 bags of cement, 5 tons of rebar, delivery to site X by Friday") and several suppliers reply with prices. This matches how bulk construction buying works, since prices are negotiated and stock varies. It is the strongest differentiator against ordinary online shops.

---

## 3. Revenue model

| Stream | How it works | When |
|---|---|---|
| Supplier subscription | Monthly fee for a listing and dashboard, with a free trial period | Launch |
| Commission | A percentage on confirmed, delivered orders | Launch (low) |
| Featured listings | Suppliers pay for top placement in a category | After traffic grows |
| RFQ lead fee | Small fee when a supplier wins a quote | Phase 2 |
| Payment or financing fees | Escrow-like payments, contractor credit via a partner | Phase 3 |

Material margins for suppliers tend to be thin, so keep commission low and rely more on subscriptions and lead fees early. Check actual margins with suppliers before fixing numbers.

---

## 4. The hardest problem: commission leakage

If cash is paid to the supplier on delivery, a buyer and supplier can simply trade directly the second time. Ways to handle it:

- **Charge on confirmed orders only**, with the customer confirming receipt in the app. This also triggers the review request.
- **Invoice suppliers weekly or monthly** for commission, with a prepaid balance or deposit for new suppliers.
- **Give people reasons to stay on the platform:** verified suppliers, ratings, price comparison, order history, dispute protection, and later buyer credit.
- **Lean on subscriptions early**, since they don't depend on tracking every order.

---

## 5. Payments roadmap

1. **Launch:** Cash on delivery and bank transfer paid directly to the supplier.
2. **Next:** Wallet or card payments through a local provider such as Alif, so funds can be held until delivery is confirmed. Alif's ecosystem includes a mobile wallet, an online payments platform and instalment-based financing products, so it is worth a conversation about merchant terms and marketplace support.
3. **Later:** Credit or instalments for contractors through a partner, rather than lending directly.

---

## 6. Solving the chicken-and-egg problem

- **Supply first.** Sign 10–15 suppliers in Khujand covering the essentials: cement, rebar, bricks and blocks, tiles, paint, plumbing, electrical, timber and tools. Offer free listing for the first few months and help them upload products.
- **Then demand.** Reach contractors and foremen directly (building sites, hardware markets, Telegram and Instagram groups), then homeowners.
- **Concierge test before building much.** Run the RFQ flow manually through a Telegram bot or group plus a spreadsheet for a few weeks. If contractors and suppliers keep using it, there is proof before the full app is built.

---

## 7. Languages without extra operations

- Suppliers write listings in whichever language they use (likely Russian or Tajik).
- The platform provides translated categories, units and attributes (cement grade, tile size) so search and filters work in all three languages.
- Customers can see the supplier's original text; machine translation of listings can be added later.

---

## 8. Legal and trust items to settle early

- Platform terms: who is the seller of record, who handles defects and returns, and the platform's liability.
- Business registration and tax treatment of commissions and subscriptions in Tajikistan.
- A supplier verification process, such as business license, shop visit and sample orders.

*Confirm these with a local lawyer or accountant before launch.*

---

## 9. Suggested phases

| Phase | Duration | Focus |
|---|---|---|
| 1. Validate | 4–6 weeks | Interview about 10 suppliers and 20 contractors, run the concierge RFQ test, agree commission or subscription terms in principle |
| 2. MVP | 8–10 weeks | Supplier dashboard, catalog, retail checkout, RFQ, COD and bank transfer, order tracking, ratings |
| 3. Growth | Ongoing | Wallet payments, featured listings, more cities, delivery partners, contractor credit |

---

## 10. Metrics to track

- Active suppliers
- RFQs posted
- Quote response time
- Orders completed
- Repeat-buyer rate
- Share of orders confirmed in the app

---

## 11. Suggested tech stack

- **Mobile:** React Native with Expo and TypeScript, React Navigation, TanStack Query, Zustand, i18next
- **Backend:** Node.js with Express and PostgreSQL, or Supabase for faster MVP development
- **Admin and supplier dashboard:** Next.js with Tailwind CSS
- **Other services:** Firebase Cloud Messaging for push notifications, SMS OTP for phone login, Sentry for crash reporting, EAS for builds
