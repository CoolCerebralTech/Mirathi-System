This is the official System Architecture Documentation for Mirathi.

This document serves as the "Constitution" for the engineering team. It defines the boundaries, responsibilities, and interactions of the microservices ecosystem.

🏛️ MIRATHI: The Digital Succession Copilot

System Architecture & Domain Documentation
Version: 1.0.0
Context: Kenyan Law of Succession Act (Cap 160), Children Act, Marriage Act.

1. Executive Summary

Mirathi is not a passive record-keeping system; it is an Active Intelligence Engine. It replaces the manual, error-prone role of a legal clerk with a deterministic, rule-based system.

The Philosophy:

Economic Truth: We track the mathematical reality of assets and debts.

Legal Readiness: We proactively guide users to compliance before they approach the court.

Strict Separation: Identity (Family) is separated from Inventory (Estate), which is separated from Process (Succession).

2. High-Level Architecture

The system follows a Event-Driven Microservices architecture. Services communicate primarily via Domain Events (Asynchronous) to ensure loose coupling, with limited Synchronous (gRPC/REST) calls for read-only data aggregation.

The Service Map

API Gateway: The Entry Point.

Account Service: Authentication & User Profiles.

Document Service: The Intelligent Storage Utility.

Family Service: The Source of Kinship Truth.

Estate Service: The Economic Truth Engine.

Succession Service: The Automation & Intelligence Layer.

3. Service Deep-Dive
🟢 Service 1: API Gateway (api-gateway)

Role: The Traffic Controller.
Functionality:

Unified Entry Point: Exposes a single GraphQL/REST endpoint to clients (Web/Mobile).

Authentication termination: Validates JWTs from Account Service before passing requests downstream.

Rate Limiting & Throttling: Protects backend services from abuse.

Request Aggregation: Combines data from Family and Estate services for dashboard views.

🔵 Service 2: Account Service (account-service)

Role: Identity Access Management (IAM).
Aggregates: User, Role.

Key Functionalities:

Registration: Email/Phone verification (OTP).

Role Management: Handles USER, VERIFIER, ADMIN., AUDITOR

Security: Password hashing, MFA, Session management.

🚫 Boundaries (What it does NOT do):

It does NOT store relationships (e.g., "User A is the father of User B"). Why? That is Kinship logic, which belongs in Family Service.

It does NOT store legal documents (ID scans). Why? That belongs in Document Service.

🟡 Service 3: Document Service (document-service)

Role: The Intelligent Utility (Sidecar).
Aggregates: Document, VerificationAttempt.

Key Functionalities:

Secure Storage: Uploads files to S3 (Encrypted).

OCR & Extraction: Automatically extracts text (e.g., "Title Deed Number") from scans.

Virus Scanning: Sanitizes inputs.

Verification Workflow: Allows VERIFIER users to view and approve/reject documents.

The "Claim Check" Pattern:
This service returns a DocumentID. Other services store this ID, never the file itself.

🚫 Boundaries (What it does NOT do):

It does NOT know the legal context of a file. It knows "This is a PDF," not "This is proof of S.29 Dependency."

It does NOT delete files upon verification. It archives them for the legal audit trail.

🟠 Service 4: Family Service (family-service)

Role: The Source of Truth for Identity & Kinship.
Legal Context: Children Act, Marriage Act, S.40 (Polygamy).

🏗️ Aggregates & Entities

Aggregate: Family

Entities: FamilyMember, Marriage, PolygamousHouse, Relationship.

Logic: Manages the graph of people. Specifically models S.40 Houses (grouping a wife and her children) which is critical for polygamous distribution.

Aggregate: Guardianship

Entities: GuardianAssignment, ComplianceCheck.

Logic: Tracks who has legal authority over a minor.

🧠 Key Logic

Vital Status: Tracks isAlive, dateOfDeath. The change of this status is the "Big Bang" event that triggers the rest of the system.

Digital Twin: Stores biometric hashes and verification status of real-world humans.

🚫 Boundaries (What it does NOT do):

It does NOT handle Wills or Inheritance. Why? Being related to someone doesn't guarantee you get their money (Testamentary freedom).

It does NOT track Assets. Why? People own assets, but the Family service is about people, not property.

🔴 Service 5: Estate Service (estate-service)

Role: The Economic Truth Engine.
Legal Context: Law of Succession Act (S.45, S.35, S.26).

🏗️ Aggregates & Entities

Aggregate: Estate (Inventory)

Root: Estate.

Entities:

Asset: Uses Strategy Pattern for LandDetails, VehicleDetails, FinancialDetails.

Debt: Tracks Liabilities.

LegalDependant: Tracks S.29 claimants.

GiftInterVivos: Tracks S.35(3) hotchpot items.

EstateTaxCompliance: Tracks KRA status.

Logic:

Solvency: Assets - Debts >= 0.

Priority: Enforces S.45 (Funeral > Secured > Unsecured).

Readiness: Blocks distribution if Tax or Disputes exist.

Aggregate: Will (Instructions)

Root: Will.

Entities: BeneficiaryAssignment, Witness, ExecutorNomination.

Logic: Enforces S.11 (Two Witnesses) and Capacity.

🧠 Key Logic

The "Dirty Flag": Any change to an asset/debt immediately recalculates NetEstateValue.

Insolvency Radar: Auto-detects if the estate is bankrupt and alerts the user.

🚫 Boundaries (What it does NOT do):

It does NOT generate Court Forms. Why? That is a process artifact, not an economic fact.

It does NOT track Hearings or Gazette Notices. Why? An Estate exists physically regardless of what the court is doing.

🟣 Service 6: Succession Service (succession-service)

Role: The Digital Lawyer / Automation Engine.
Legal Context: Court Procedures Rules, Probate & Administration Rules.

🏗️ Aggregates & Entities

Aggregate: ReadinessAssessment (The Audit)

Entities: RiskFlag (e.g., "Minor without Guardian").

Value Objects: SuccessionContext (Regime, Religion, MarriageType).

Logic: Calculates a 0-100% score. Tells the user if they can file.

Aggregate: ProbateApplication (The Generator)

Entities: GeneratedForm (P&A 80, P&A 5), FamilyConsent.

Logic: Orchestrates the digital signing of consents (Form 38) and generates the PDF bundle.

Aggregate: ExecutorRoadmap (The GPS)

Entities: RoadmapTask, Milestone.

Logic: A dynamic To-Do list that unlocks tasks based on dependencies (e.g., "Unlock 'File P&A 80' only after 'Chief's Letter' is uploaded").

🧠 Key Logic

Context Detection: Analyzes Family + Estate data to decide: "Is this Islamic?" "Is this Polygamous?" "Is this Small Estate?"

Compliance Engine: Prevents the user from generating forms if ReadinessScore < 80.

🚫 Boundaries (What it does NOT do):

It does NOT hold the master record of Assets. Why? It reads assets from Estate Service to put them on a form, but if the asset changes, Estate Service is the truth.

4. Inter-Service Communication (The "Nervous System")

Mirathi uses an Event-Driven Architecture to keep services decoupled but consistent.

Scenario: The Death Event

This illustrates how the services dance together.

User (in Family Service) uploads a Death Certificate for "Father".

Document Service verifies the scan and returns DocID.

Family Service updates FamilyMember.isAlive = false and emits FamilyMemberDeceased.

Estate Service listens to FamilyMemberDeceased:

Creates an Estate aggregate.

Sets status to FROZEN (Safety lock).

Checks for a Will. If none, sets Regime = INTESTATE.

Succession Service listens to FamilyMemberDeceased:

Creates a ReadinessAssessment.

Runs ContextDetector (Polygamous? Intestate?).

Generates the ExecutorRoadmap (Task 1: "Verify Assets").

Scenario: The Asset Verification

User uploads Title Deed to Document Service.

Verifier approves document. Document Service emits DocumentVerified.

Estate Service listens:

Finds the Asset linked to that document.

Sets Asset.verificationStatus = VERIFIED.

Emits EstateAssetVerified.

Succession Service listens:

Updates ReadinessAssessment.

Removes "Unverified Asset" risk flag.

Score goes up (+10%).

5. Security & Data Protection (Data Protection Act 2019)
Data Sovereignty

All data is stored in Kenyan Availability Zones (or legally compliant equivalents).

Encryption: AES-256 for data at rest (S3 & DB), TLS 1.3 for data in transit.

Role-Based Access Control (RBAC)

Access Policy: A User can only access Family or Estate data where they are explicitly linked via FamilyMember.userId or ExecutorNomination.

Verifier Access: VERIFIER role can only see documents assigned to their queue, with PII redacted where possible.

6. Implementation Guidelines for Developers

Strict Typing: Use TypeScript Interfaces and Enums shared via a common library (@mirathi/common) to ensure FamilyService and SuccessionService agree on what Gender or AssetType means.

Idempotency: All Event Consumers must be idempotent. If EstateAssetVerified is processed twice, nothing bad should happen.

Validation:

Frontend: Validates UX (e.g., "Email format").

Application Layer: Validates DTOs.

Domain Layer: Validates Invariants (e.g., "Cannot pay debt if insolvent"). This is the final line of defense.

7. Conclusion

Mirathi transforms the Kenyan succession process from a bureaucratic nightmare into a guided, secure, and logical journey.

By strictly separating Facts (Family) from Money (Estate) and Process (Succession), we avoid the "God Object" traps of legacy systems and build a platform that is scalable, legally robust, and investor-ready.
