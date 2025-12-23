# 👨‍👩‍👧‍👦 Family Service

**Domain:** Identity, Kinship, and Legal Authority  
**Context:** Kenyan Marriage Act, Children Act, Law of Succession Act (S.40)

## 📖 Overview
The **Family Service** is the authoritative source of truth for **who people are** and **how they are related**. It manages the immutable facts of kinship, marriage, and guardianship. 

It is designed to handle complex Kenyan family structures, including **polygamy (S.40)**, **customary marriages**, and **guardianship of minors**.

### 🚫 Strict Boundaries
To maintain a clean architecture, this service **DOES NOT**:
* Handle **Inheritance** (Who gets what).
* Manage **Assets** or **Wills**.
* Calculate **Dependency Levels** (S.29 financial support).

If it answers *"Who is related to whom?"* -> **Family Service**.  
If it answers *"Who is entitled to money?"* -> **Estate Service**.

---

## 🏗 Domain Architecture (DDD)

### 1. Aggregate: `Family`
Represents the biological and legal kinship graph.
* **Root:** `Family`
* **Entities:**
    * `FamilyMember`: The person (contains strictly identity data: DOB, Gender, ID).
    * `Marriage`: Supports Civil, Christian, Islamic, and Customary types.
    * `PolygamousHouse`: Explicit modeling of **Section 40 LSA** (House of Wife A vs. House of Wife B).
    * `Relationship`: The edges of the graph (Parent, Child, Sibling).
    * `NextOfKin`: Designated contacts (NOT beneficiaries).

### 2. Aggregate: `Guardianship`
Represents the legal authority over a minor or incapacitated person.
* **Root:** `Guardianship`
* **Entities:**
    * `GuardianAssignment`: Who is the guardian? (Links to User/FamilyMember).
    * `ComplianceCheck`: Filing annual returns on the child's welfare.
* **Key Invariant:** A minor cannot have overlapping, conflicting active guardianships.

---

## 🇰🇪 Legal Context Logic
* **Polygamy:** We model "Houses" explicitly because under **Section 40**, property is distributed *by house*, not just *by child*.
* **Guardianship:** Aligns with the **Children Act**. A guardian handles *care*, while a Trustee (Estate Service) handles *money*.
* **Identity:** We validate National IDs and KRA PINs but treat them as attributes of a Member.


---

### 2. Estate Service `README.md`

```markdown
# 🏡 Estate Service

**Domain:** Inventory, Instructions, and Financial Entitlement  
**Context:** Law of Succession Act (Cap 160) - Sections 35, 40, 45, 83

## 📖 Overview
The **Estate Service** manages the "Net Worth" and the "Last Wishes" of a user. It is responsible for the **Inventory** (Assets/Debts) and the **Instructions** (Will). 

It includes a powerful **Distribution Engine** that calculates inheritance shares based on Kenyan law (Intestate) or the Will (Testate).

### 🚫 Strict Boundaries
This service **DOES NOT**:
* Track **Court Hearings** or **Filings**.
* Manage **Physical Asset Transfers** (Lands Registry interactions).
* Issue **Grants of Representation**.

If it answers *"What do they own?"* or *"What does the math say?"* -> **Estate Service**.

---

## 🏗 Domain Architecture (DDD)

### 1. Aggregate: `Estate` (The Inventory)
Represents the solvency and net worth of the deceased.
* **Root:** `Estate`
* **Entities:**
    * `Asset`: Polymorphic (Land, Vehicle, Shares).
    * `Debt`: Categorized by **Section 45 Priority** (Funeral > Secured > Unsecured).
    * `LegalDependant`: Persons claiming S.29 support (Moved here from separate aggregate).
    * `GiftInterVivos`: Past gifts tracked for **Section 35(3) Hotchpot** calculations.
    * `AssetLiquidation`: Conversion of physical assets to cash.

### 2. Aggregate: `Will` (The Instructions)
Represents the testamentary freedom of the user.
* **Root:** `Will`
* **Entities:**
    * `BeneficiaryAssignment`: The link between an Asset and a Person.
    * `WillExecutor`: Nominees to manage the estate.
    * `Witness`: Validation of the document.
* **Status:** Draft -> Witnessed -> Active -> Revoked.

### 3. Domain Service: `DistributionCalculator`
* **Not an Aggregate.** This is a pure logic engine.
* **Input:** Estate Inventory + Will Instructions + Family Tree.
* **Logic:** Applies S.35 (Spouse/Children), S.40 (Polygamy), or Will rules.
* **Output:** `DistributionSnapshot` (Who gets what %).

---

## 🇰🇪 Legal Context Logic
* **Solvency:** Assets must cover Secured Debts before distribution.
* **Dependants:** Under **Section 26**, a valid Will can be challenged if dependants are ignored. We store these claims within the Estate aggregate.
* **Hotchpot:** Gifts given during life may be deducted from the final share.

---

### 3. Succession Automation Service `README.md`

```markdown
# ⚖️ Succession Automation Service

**Domain:** Legal Process Automation, Risk Analysis, and Document Generation  
**Context:** "The Digital Lawyer" / "Succession Copilot"

## 📖 Overview
The **Succession Automation Service** replaces the need to manually track court dates. Instead of a passive record-keeping system, this is an **active intelligence engine**.

It analyzes data from the *Family* and *Estate* services to:
1.  **Assess Readiness:** Can this family file for succession?
2.  **Generate Documents:** Automatically create P&A 80, P&A 1, and Consents.
3.  **Guide the Executor:** Provide a dynamic roadmap (GPS) of what to do next.

### 🚫 Strict Boundaries
This service **DOES NOT**:
* Hold the "Truth" about Assets (Estate Service does that).
* Hold the "Truth" about Kinship (Family Service does that).
* Replicate the Judiciary's internal filing system.

---

## 🏗 Domain Architecture (DDD)

### 1. Aggregate: `ReadinessAssessment` (The Audit)
Runs a health check on the case.
* **Root:** `ReadinessAssessment`
* **Value Object:** `SuccessionContext` (Regime: Testate/Intestate, Marriage: Poly/Mono, Religion: Statutory/Islamic).
* **Entities:**
    * `RiskFlag`: Warnings with severity and source (e.g., "High Risk: Minor child has no guardian").
* **Output:** A `ReadinessScore` (0-100%).

### 2. Aggregate: `ProbateApplication` (The Generator)
Compiles the legal bundle for court.
* **Root:** `ProbateApplication`
* **Entities:**
    * `GeneratedForm`: The specific PDFs (P&A 1, P&A 5, etc.) generated based on the Context.
    * `FamilyConsent`: Tracks digital signatures (Form P&A 38) via SMS/Email.

### 3. Aggregate: `ExecutorRoadmap` (The GPS)
A dynamic to-do list that adapts to the case status.
* **Root:** `ExecutorRoadmap`
* **Entities:**
    * `RoadmapTask`: Specific actions (e.g., "Obtain Letter from Chief").
* **Logic:** If `Context = INTESTATE`, add "Chief's Letter" task. If `Context = TESTATE`, remove it.

---

## 🇰🇪 Legal Context Logic
* **Succession Context:** The system automatically detects if the case is **Islamic** (routes to Kadhi’s Court forms) or **Civil** (High Court).
* **Risk Engine:** Identifies **Section 35(3) Cohabitation** risks or **Section 26 Dependant** risks before the user files, saving them legal fees.

