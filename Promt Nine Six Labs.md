You are a senior full-stack engineer. Build a production-ready web
application with clean architecture, strict business logic, and modern
UI.

PROJECT:

Supplement Inventory & Sales Management System (Local-first, scalable)

TECH STACK:

\- Frontend: Next.js (App Router) + TailwindCSS

\- Backend: Node.js (API routes or server actions)

\- Database: PostgreSQL (use Prisma ORM)

\- State: Server-first (avoid unnecessary client state)

\- UI Style: Dark mode + neon accents (green/red)

DESIGN SYSTEM:

\- Background: #0B0B0B

\- Cards: #111111

\- Positive (profit): Neon Green (#39FF14)

\- Negative (debt/alerts): Neon Red (#FF3131)

\- Accent: Electric Blue (#00E5FF)

\- Layout: Sidebar + Dashboard

\- Style: Minimal, high-contrast, modern SaaS

CORE BUSINESS RULES (STRICT):

\- Inventory uses FIFO (first-in-first-out)

\- Products are uniquely defined as:

brand + name + flavor + size

\- Sales CANNOT proceed if stock is insufficient

\- Credit sales REQUIRE minimum 50% upfront payment

\- Remaining balance must be paid within 15 days

\- System must BLOCK invalid credit conditions

\- All currency is USD (no conversion logic)

\-\--

\# DATA MODELS (PRISMA)

Create schema:

\- Product

\- Lot

\- Import

\- ImportItem

\- Sale

\- SaleItem

\- Customer

\- Payment

RELATIONSHIPS:

\- Product has many Lots

\- Lot belongs to Product

\- Import has many ImportItems

\- ImportItem creates Lots

\- Sale has many SaleItems

\- Sale belongs to Customer

\- Payments reduce Sale debt

\-\--

\# IMPORT SYSTEM (CRITICAL LOGIC)

Implement JSON import:

INPUT:

\- freight_total_usd

\- items:

\- product info

\- quantity

\- cost_usa_unit

\- dimensions (L, W, H)

\- expiration_date

\- margin_percent

CALCULATIONS:

1\. volume_unit = (L \* W \* H) / 1728

2\. total_volume = sum(volume_unit \* quantity)

3\. freight_unit = (volume_item / total_volume) \* freight_total

4\. landed_cost = cost_usa_unit + freight_unit

5\. price_sale = landed_cost \* (1 + margin_percent/100)

OUTPUT:

\- Create Lot per item

\- Store all computed values

Add validation + preview before confirming import

\-\--

\# INVENTORY MODULE

TABLE VIEW:

\- Product

\- Lot ID

\- Stock available

\- Cost USA

\- Freight unit

\- Landed cost

\- Sale price

\- Profit (\$ and %)

\- Expiration date

RULES:

\- FIFO consumption

\- No negative stock

\- Allow editing:

\- sale price

\- expiration date

EXPIRATION ALERT:

\- \<90 days → RED

\- 90--150 → YELLOW

\- \>150 → GREEN

\-\--

\# SALES MODULE (POS)

FLOW:

1\. Select customer (required)

2\. Add products

3\. System auto-assigns lots (FIFO)

4\. Calculate total

PAYMENT TYPES:

\- Full payment

\- Credit

CREDIT RULES:

\- Minimum 50% upfront required

\- System blocks if \<50%

\- Remaining = 1 payment

\- Due in 15 days

STORE:

\- lead source (Instagram, TikTok, etc.)

\-\--

\# ACCOUNTS RECEIVABLE

\- List customers with debt

\- Show breakdown per sale

\- Button: \"Register Payment\"

\- Allow partial or full payments

ALERT:

\- If \>15 days overdue:

\- highlight RED

\- label: \"COBRO PENDIENTE\"

\-\--

\# DASHBOARD

MAIN KPIs:

\- Net profit (monthly)

\- Accounts receivable total

\- Critical alerts count

SECONDARY:

\- Total inventory value

\- Average ROI per lot

CHARTS:

\- Monthly profit (bar chart)

\- Inventory distribution

\-\--

\# AUTOMATIONS

\- Auto FIFO deduction

\- Auto profit calculation

\- Auto ROI calculation per lot

\- Auto alerts:

\- low stock

\- expiration

\- overdue debt

\-\--

\# EXPORT

\- Export to Excel:

\- inventory

\- sales

\- customers

\- reports

\-\--

\# ALERT SYSTEM

\- Dashboard alerts

\- Browser notifications

\-\--

\# SECURITY (MINIMAL)

\- Single user login

\- Confirmation dialogs:

\- delete lot

\- delete records

\-\--

\# UX REQUIREMENTS

\- Fast, no lag

\- Keyboard-friendly POS

\- Clean spacing

\- Large KPI cards

\- Smooth transitions

\-\--

\# NON-NEGOTIABLES

\- No overengineering

\- No unnecessary libraries

\- No mock data in final version

\- All calculations must be deterministic and accurate

\-\--

\# OUTPUT EXPECTED

\- Full project structure

\- Prisma schema

\- API routes

\- UI pages:

\- Dashboard

\- Imports

\- Inventory

\- Sales

\- Customers

\- Receivables

\- Reusable components

\- Seed example (optional but useful)

Build this as a clean, scalable base ready for future multi-store and
e-commerce expansion.
