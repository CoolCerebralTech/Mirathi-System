🏛️ MIRATHI: System Architecture & Integration Guide

Version: 1.0.0
Status: Approved for Development
Context: Kenyan Law of Succession Act (Cap 160)

📑 Table of Contents

Executive Summary

Backend Services Breakdown

API Gateway

Account Service

Document Service

Family Service

Estate Service

Succession Automation Service

Inter-Service Communication

Frontend Integration Guide

User Scenarios (Login & Onboarding)

1. Executive Summary

Mirathi is an Active Intelligence Engine for estate planning and succession. Unlike traditional systems that passively record court dates, Mirathi acts as a "Digital Copilot," proactively guiding users through the legal complexity of the Kenyan Law of Succession.

Core Philosophy:

Fact vs. Truth: Family Service holds facts (Identity). Estate Service holds truth (Value). Succession Service holds process (Law).

No God Objects: We strictly separate the Assets (Physical Inventory) from the Court Case (Legal Workflow).

Automation First: We do not ask "What did you do today?"; we tell the user "Here is what you must do next."

2. Backend Services Breakdown
2.1 API Gateway (api-gateway)

Role: The Traffic Controller.

Functionality:

Single Entry Point (api.mirathi.ke/v1).

Terminates SSL/TLS.

Validates JWT Tokens via Account Service.

Routes requests to appropriate microservices.

Boundaries: It holds NO business logic. It is purely routing and security.

2.2 Account Service (account-service)

Role: Identity Access Management (IAM).

Aggregates: User, Role, AuthSession.

Functionality: Registration, OTP Verification, Password Management, RBAC (User vs Verifier).

🚫 What it does NOT hold:

Family Relationships: Why? Because a User Account is technical (login), but a Father/Son relationship is biological domain logic (Family Service).

Document Scans: Why? ID scans belong in the Document Service.

2.3 Document Service (document-service)

Role: The Intelligent Utility (Sidecar).

Aggregates: Document, VerificationAttempt.

Functionality:

Secure S3 Storage (Encrypted).

OCR Extraction: Reads "Title Deed Number" from scans automatically.

The "Claim Check" Pattern: Returns a UUID (documentId) to the frontend. Other services store this UUID, never the file.

🚫 What it does NOT hold:

Legal Context: Why? It knows "This is a PDF," not "This is proof of S.29 Dependency." The context belongs to the service consuming the document.

Deletion Logic: It does not delete files upon verification. It archives them for the legal audit trail.

2.4 Family Service (family-service)

Role: The Source of Kinship Truth.

Aggregates: Family (Kinship Graph), Guardianship (Legal Authority).

Functionality:

Tracks FamilyMember (Identity, Digital Twin).

Tracks PolygamousHouse (S.40 LSA Compliance).

Tracks Guardianship (Children Act Compliance).

🚫 What it does NOT hold:

Assets: Why? People own assets, but the Family service is about who they are, not what they have.

Inheritance Shares: Why? Being a son doesn't guarantee money (Disinheritance is possible). That logic is in Estate Service.

2.5 Estate Service (estate-service)

Role: The Economic Truth Engine.

Aggregates:

Estate: The Inventory & Solvency Master.

Will: The Instructions Master.

Functionality:

Asset Management: Uses Strategy Pattern for Land/Vehicle/Financial.

S.45 Enforcer: Prevents payment of low-priority debts before funeral expenses.

Solvency Radar: Auto-detects if Debts > Assets and flags insolvency.

S.35(3) Hotchpot: Adds "Phantom Value" of past gifts to calculate fair shares.

🚫 What it does NOT hold:

Grant of Probate: Why? A Grant is a court document (Succession Service). An Estate exists physically even without a Grant.

Court Hearings: Why? Estate Service is about Money, not Bureaucracy.

2.6 Succession Automation Service (succession-automation)

Role: The Digital Lawyer (The Brain).

Aggregates:

ReadinessAssessment: The Audit (0-100% Score).

ProbateApplication: The Generator (Bundle creation).

ExecutorRoadmap: The GPS (Dynamic To-Do List).

Functionality:

Context Detector: Decides if the case is Islamic, Testate, or Intestate.

Compliance Engine: Blocks form generation if Critical Risks exist (e.g., Minor without Guardian).

Form Generator: Assembles P&A 80, P&A 5, and P&A 12 into a PDF bundle.

🚫 What it does NOT hold:

Master Asset Records: Why? It reads assets to put them on a form, but Estate Service owns the data.

3. Inter-Service Communication

Mirathi uses an Event-Driven Architecture to ensure data consistency without tight coupling.

🧬 The "Death Event" Flow

Family Service: Records FamilyMember.dateOfDeath.

Event: FamilyMemberDeceased emitted.

Estate Service (Listener):

Creates Estate aggregate.

Sets status to FROZEN.

Checks for Will. If none, marks Intestate.

Succession Service (Listener):

Creates ReadinessAssessment.

Generates ExecutorRoadmap (Task 1: "Verify Assets").

🏡 The "Asset Verification" Flow

Document Service: Verifier clicks "Approve" on a Title Deed scan.

Event: DocumentVerified emitted.

Estate Service (Listener):

Updates Asset.verificationStatus = VERIFIED.

Emits AssetReadyForDistribution.

Succession Service (Listener):

Updates ReadinessAssessment (Score increases).

Updates ExecutorRoadmap (Task "Verify Assets" marked Complete).

4. Frontend Integration Guide

The Frontend connects to the backend via the API Gateway using the "Smart Integration" pattern.

📂 The "Smart Document" Pattern

Problem: How do we handle file uploads without passing binary data through business services?
Solution:

Frontend Component (<SmartUploader />): Uploads file directly to Document Service.

Response: Receives { documentId: "uuid-123", extractedText: {...} }.

Action: Frontend fills the form fields using the OCR data.

Submit: Frontend sends the Form Data + documentId to the Estate Service.

🧭 The Dashboard Logic

The User Dashboard is polymorphic based on the User Role and Case State.

Widget 1: Readiness Scorecard

API: GET /succession/readiness/{id}

UI: Circular progress bar. If < 80%, shows "Fix Issues" button.

Widget 2: The Roadmap

API: GET /succession/roadmap/{id}

UI: Vertical Stepper. Locked steps have a padlock icon.

Widget 3: Net Worth Summary

API: GET /estate/summary/{id}

UI: Real-time calculation of Assets - Liabilities. Updates immediately via React Query invalidation when a debt is added.

5. User Scenarios
🔐 Scenario A: Registration & Onboarding

Actor: A new user (The Executor).

Registration:

User enters Email/Phone -> POST /account/register.

User verifies OTP -> POST /account/verify.

The "Golden Question":

Screen asks: "Are you planning for the future OR handling a death?"

User selects: "Handling a death".

The Intake Wizard:

User enters Deceased Name and Date of Death.

Frontend calls POST /estate/initiate.

Result: Backend creates the Estate, Family group, and Roadmap instantly. User lands on the Dashboard.

📝 Scenario B: Generating the Court Bundle

Actor: The Executor (Ready to file).

Trigger: User clicks "Generate Forms" on the Roadmap.

Validation: Frontend checks ReadinessScore. If 100%:

API Call: POST /succession/application/generate.

Processing:

Succession Service pulls Assets from Estate Service.

Succession Service pulls Heirs from Family Service.

Generates PDF P&A 80.

Output: Frontend receives a download link for the PDF Bundle.

Next Step: Roadmap updates to Phase: "Filing". Task becomes "Upload Court Receipt".

End of Documentation
Architecture Approved by Lead Architect.