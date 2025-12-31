This is the Frontend Developer Playbook for Mirathi.

It bridges the gap between the complex Domain-Driven Design on the backend and the user experience on the client side.

🎨 MIRATHI: Frontend Developer Guide

Building the Digital Succession Copilot

1. System Architecture (Frontend View)

As a frontend developer, you do not talk to family-service or estate-service directly. You interact exclusively with the API Gateway.

🔌 The API Layer

Base URL: `https://api.mirathi.com/ (The "Digital Lawyer" rejecting bad data).

DEVELOPMENT VITE_API_BASE_URL=http://localhost:3000/api

The "Smart Document" Pattern (Critical)

When a`

Authentication: Bearer Token (JWT) in Headers.

Protocol: REST (Standard calls user uploads a file (e.g., Death Certificate):

Component: <SmartUploader /> calls `POST https) + Server-Sent Events (SSE) for real-time updates (like "Readiness Score updated").

🏗://docs.mirathi.ke/upload`.

Response: Returns `{ documentId: "uuid️ Recommended Tech Stack

Framework: Next.js (React) - for SSR performance and SEO.

**State", extractedData: { ... } }`.

Action: Frontend fills the form form using extractedData. Management:** TanStack Query (React Query). *Crucial because our backend is Event-Driven. Data changes

Save: Frontend sends only the documentId to the main API (e.g., `/ asynchronously.*

Forms: React Hook Form + Zod. (Zod schemas should match Backend DTOs).

**estate/assets`).

3. Core User Scenarios & Implementation Guides
🟢 Scenario A: The "UI Library:** Tailwind CSS + ShadcnUI (Clean, accessible components).
2. Authentication & OnGolden Entry" (Registration & Onboarding)

Actor: A new user (Potential Administrator or Planner).
Goal: Determine if they are planning for the future or handling a death.

Step 1: Authentication

**Screenboarding Workflows

🔐 Scenario A: New User Registration

Goal: Verify identity and determine the user's intent.

Step 1: Sign Up

UI: Email, Phone Number, Password.

API: Login / Register.

Logic: Standard Email/Password + OTP Verification.

API: POST /auth/register, POST /auth/verify-otp.

Step 2: The "Golden Question" (On:** POST /auth/register

Response: { userId: "uuid", status: "PENDING_VERIFICATION" }

Step 2: Verification (OTP)

UI: "Enter theboarding Wizard)

Screen: Full-screen modal. "How can we help you today?"

**Option 6-digit code sent to your phone."

API: POST /auth/verify-otp
A:** "I want to protect my legacy." (Planning) -> Redirect to /dashboard/planning.

Option B:* Action: System issues accessToken and refreshToken.

**Step 3: The "Golden Question" (On "A loved one has passed away." (Admin) -> Triggers The Intake Flow.

Step 3: The Deceased Intake (If Option B selected)

Component: DeceasedIntakeStepper

Input 1boarding)

UI: A beautiful 2-card selection screen.

": Deceased Name, Date of Death.

Input 2: National ID (Triggers lookup).Plan My Legacy"** (I am alive). -> Sets context to Estate Planning.
2. "Manage an Estate" (Someone died). -> Sets context to Succession Administration.

3. Core

Input 3: "Was there a Will?" (Yes/No/I Don't Know).

Feature Integration Guide

👨‍👩‍👧‍👦 Feature 1: The Family Tree (Family Service)

API Action:
javascript POST /estate/initiate-succession Body: { deceasedName, dateOfDeath, hasWill: boolean }

Backend Magic: Creates Estate (FrozenContext: Used to identify Heirs, Beneficiaries, and Guardians.

Component: <FamilyMemberForm),ReadinessAssessment, andExecutorRoadmap`.

Redirect: To /dashboard/succession/{estateId}.

🔵 Scenario B: The "Executor GPS" (Succession Workflow)

Actor: The />`

Input: Name, DOB, Relationship.

Smart Feature (The Digital Twin):

Add Executor.
Goal: Move the ReadinessScore from 0% to 100% and file. a field: "Upload ID / Birth Cert".

Behavior: When user drops a file, the frontend uploads to DocumentService first.

Response: `{ documentId: "xyz", extractedData: { name

Component: ExecutorDashboard

This is the main view. It has three key widgets:

1. The Readiness Scorecard: "John Doe", id: "123456" } }`.
* **Action

Visual: A Circular Progress Bar (0-100%).

Data Source: GET /succession/readiness/{estateId}.

Behavior:

If score < 50% (Red): Show:** Frontend auto-fills the form inputs with extractedData.

Submission: The form sends the documentId (not the file) to POST /family/members.

🏡 Feature 2: "Blocking Issues".
code
Code
download
content_copy
expand_less
*   If score > 80% (Green): Enable "Generate Forms" button. Estate Inventory (Estate Service)

Context: The "Economic Truth". Assets vs. Debts.

Component: <AssetGrid /> (Polymorphic)

Logic:

Fetch assets via `GET /estate/{

Animation: Fire confetti logic when a critical risk (e.g., "Missing Death Cert") is resolved.

2.id}/assets. * **Render:** * Iftype === 'LAND', render<LandCard The Roadmap Timeline (Vertical Stepper)

Visual: A vertical list of Tasks (e.g., "Obtain Letter from Chief").

Data Source: GET /succession/roadmap/{estateId}.

State: Tasks details={asset.landDetails} />. * Iftype === 'VEHICLE', render<VehicleCard details have status LOCKED, PENDING, COMPLETED.

Interaction: Clicking a PEND={asset.vehicleDetails} />.

The "Dirty Flag" UI:

If theING` task opens a specific Action Modal (e.g., "Upload Letter").

3. The Risk Banner user adds a Debt, the Net Worth card at the top must update.
* Strategy: In

Visual: Alert box at the top.

Data: ReadinessAssessment.riskFlags.
*validate the ['estate-summary'] query key immediately after mutation to re-fetch the calculated totals.

Component: `<Sol Content: "Critical: Minor Child found without Guardian. Fix now."

Action: Link to /family/guardianship.

🟡 Scenario C: Building the Inventory (Estate Service)

Actor: ExecutorvencyWidget />`

Logic: Check estate.isInsolvent.

Visual:

False (Green): "Estate is Healthy."

True (Red): "Warning or Planner.
Goal: List assets to calculate Net Worth.

Component: AssetManager

This requires: Debts exceed Assets. Distribution Blocked."

⚖️ Feature 3: Succession Automation (The Copilot)

Context: The "Digital Lawyer" guiding the user.

Component: <ReadinessScorecard />
Polymorphic UI Design.

View: AssetGrid. Shows cards with Total Value.

Action:* API: GET /succession/readiness/{estateId}

Visual: A Circular "Add Asset" button opens a dropdown:

Land -> Opens LandForm (Fields Progress bar (0-100%).

Interactivity:

Clicking the score: Title No, Acreage).

Vehicle -> Opens VehicleForm (Fields: Reg No, Chassis).

Bank -> Opens FinancialForm (Fields: Bank Name, Account No).

opens a "Fix It" Drawer.
* List riskFlags: e.g., "MissingIntegration Logic:

Form Submit: Sends payload to POST /estate/{id}/assets.

** Death Certificate".

Each risk has a "Resolve" button that links to the correct upload form.

Component: <ExecutorRoadmap />

API: GET /succession/roadmap/{estateId}

Response:** The backend recalculates Solvency immediately.

UI Update: Update the "Net Worth" header componentVisual: Vertical Stepper (Timeline).

Logic:

Locked Tasks: Grayed out with a padlock icon. (e.g., "File P&A 80" is locked until "Upload (grossValue - liabilities).

Side Effect: If the Asset is High Value (>10M), show Chief's Letter" is done).

Action: Clicking an "Active" task executes the specific workflow a Toast: "High value asset detected. We recommend a professional valuation."

🟠 Scenario D: The (e.g., opens the PDF generator).
📄 Feature 4: Form Generation (Prob "Digital Signature" (Family Service)

Actor: A Beneficiary (Sibling).
Goal: Consent to the processate Application)
Context: Generating the court bundle.

Workflow:

User clicks "Generate Forms" on the Roadmap.
(Form P&A 38).

The Flow:

Notification: User receives SMS with link: mirathi.ke/consent/{token}.

Landing Page: Shows summary2. Frontend Check: Is readinessScore >= 80? If not, show "Improve Score" modal.

API Call: POST /succession/application/generate.

**Polling: "John Doe wants to be Administrator of [Father's Name] Estate."

Action: "Do you agree?" (Yes/No).

Verification: OTP sent to phone number registered in FamilyService.
5.:** The PDF generation takes time (2-3 seconds). Show a "Preparing your documents..." loader.

Result: Receive a list of URLs (e.g., petition.pdf, affidavit.pdf).

Preview: Use react-pdf or an iframe to show the document before they download.

4. Integration Scenarios (Sequence Diagrams for Frontend)
Scenario 1: The "Smart" Document Upload

Signature: User draws signature on screen (Canvas API).

Submission:

code
JavaScript
download
content_copy
expand_less
POST /succession/consent/sign
Body: { consentId, signatureBlob, otp }

Result: The Executor sees "Consent Granted" on their dashboard instantly.

4. Frontend Data Models (How we verify assets without handling binary data.*

User selects "Title Deed.pdf" in `<TypeScript Interfaces)

Use these interfaces to ensure type safety with the backend.

1. The Readiness Assessment
code
TypeScript
download
content_copy
expand_less
interface ReadinessAssessment {
  score: number; // 0-100
  status: 'IN_PROGRESS' | 'READY_TO_FILE' | 'BLOCKED';
  context: {
    regime: 'TESTATE' | 'INTESTATE';
    religion: 'STATUTORY' | 'ISLAMIC';
  };
  risks: {
    severity: 'CRITICAL' | 'HIGH';
    message: string;
    actionLink: string;
  }[];
}
2. The Roadmap Task
code
TypeScript
download
content_copy
expand_less
interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  statusSmartUploader />`.
2.  **Frontend** calls `POST https://api.mirathi.com/documents/upload`.
3.  **Gateway** returns `{ documentId: "uuid-123", scan: 'LOCKED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  category: 'DOCUMENTStatus: "CLEAN" }`.
4.  **Frontend** calls `POST https://api.mirathi.com/estate' | 'COURT_FILING' | 'ASSET';
  isOverdue: boolean;
}
3./assets` with:
code
Code
download
content_copy
expand_less
```json
{
  "type": "LAND",
  "name The Asset (Polymorphic)
code
TypeScript
download
content_copy
expand_less
interface Asset {
  id: string;
  type: 'LAND'": "Ancestral Home",
      "evidenceDocumentId": "uuid-123" // <--- The | 'VEHICLE' | 'FINANCIAL';
  value: { amount: number; currency: 'KES' };
  status: 'VERIFIED' | 'UNVERIFIED';
  details: LandDetails | VehicleDetails | FinancialDetails; Link
    }
    ```
5.  **Estate Service** emits `AssetAdded`.
6.  **Succession Service** listens -> Re-runs Readiness -> Emits `ReadinessUpdated`.
7.  **Frontend ( // Discriminated Union
}
5. UI/UX Guidelines (The "VSSE Listener):** Receives { type: "SCORE_UPDATE", newScore: 45 }.

**ibe")

1. Tone of Voice:

Calm, authoritative, empathetic.

AvoidUI:** Toast Notification: "Asset added! Readiness Score increased to 45%."

Scenario 2: Getting legal jargon. Don't say "Intestate Succession"; say "No Will Found".

Don't say "S.45 Priority"; say "Debts that must be paid first".

** Family Consent (P&A 38)
The "Multi-Player" aspect of the system.

Executor (Frontend): Clicks "Request Consents" on the Dashboard.

Frontend: Displays list of Family Members. User selects "Jane (Sister)" and "Bob (Brother)".

API: POST /succession/application/consent-request.

System: Sends SMS to2. Error Handling:**

Never show generic errors.

If the backend throws EstateInsolventException, the UI should show a specific modal: *"Warning: The debts are higher than the assets. You cannot distribute money yet." Jane and Bob with a unique link.

Jane (Frontend - Mobile): Opens link `mir*

3. Accessibility:

High contrast (users might be elderly).

Large touch targets for mobileathi.com/consent/{token}`.

Jane's View:

Sees the Estate Summary (Transparency).

Sees "I, Jane, consent to [Executor Name] managing (Executor Roadmap is often checked on phones).

6. Implementation Checklist for Frontend Team

Setup: Initialize Next.js project with Tailwind CSS.

Auth: Implement AuthProvider using the JWT from Account Service.

Components: Build the SmartUploader using the Document Service API.

** this estate."

Signs on screen (Canvas signature).

API: POST /succession/consentDashboard:** Build theReadinessScore` circular progress component.

Forms: Build the Dynamic Asset Forms (Land vs Vehicle).

Integration: Connect ExecutorRoadmap to the API.

This documentation provides everything the/{id}/sign`.
8. Executor's View: The icon next to "Jane" turns from Clock (Pending) to Green Check (Signed) in real-time.

5. UI/UX frontend team needs to build a pixel-perfect, logic-aware interface for Mirathi.