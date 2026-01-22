🏛️ MIRATHI: The Digital Succession Copilot

![alt text](https://img.shields.io/badge/build-passing-brightgreen)


![alt text](https://img.shields.io/badge/stack-NestJS%20%7C%20Prisma%20%7C%20PostgreSQL-blue)


![alt text](https://img.shields.io/badge/architecture-Microservices%20%7C%20DDD-orange)


![alt text](https://img.shields.io/badge/license-MIT-green)

"Protecting Legacies, Automating Justice."

Mirathi (Swahili for Inheritance) is an Intelligent Succession Engine designed to revolutionize how estates are managed in Kenya. It replaces the manual, error-prone role of a legal clerk with a deterministic, rule-based system that understands the Law of Succession Act (Cap 160).

Unlike traditional legal apps that passively record data, Mirathi acts as a "Digital Lawyer"—proactively guiding users through compliance, solvency checks, and court readiness.

🛑 The Problem

The process of transferring assets after death in Kenya is broken:

The Polygamy Puzzle: Manual distribution among multiple households (Section 40) often leads to errors and disputes.

Procedural Paralysis: 80% of court filings are rejected due to simple clerical errors (e.g., missing Chief's Letter).

Vulnerable Heirs: Widows and minors are often disinherited because there is no system to enforce Section 29 (Dependant Support).

Economic Opacity: Heirs rarely know the true "Net Worth" of an estate, leading to fraud by executors.

💡 The Solution

Mirathi is architected around three pillars of truth:

Family Service: Establishes Biometric & Kinship Truth (Who is related to whom?).

Estate Service: Establishes Economic Truth (What is the Net Worth?).

Succession Service: Establishes Process Truth (Are we ready for Court?).

🏗️ System Architecture

Mirathi utilizes an Event-Driven Microservices Architecture built with Domain-Driven Design (DDD) principles.

code
Mermaid
download
content_copy
expand_less
graph TD
    User((User)) --> Gateway[API Gateway]
    
    subgraph "The Intelligence Layer"
        Gateway --> Auth[Account Service]
        Gateway --> Family[Family Service]
        Gateway --> Estate[Estate Service]
        Gateway --> Succession[Succession Automation]
        Gateway --> Docs[Document Service]
    end
    
    Family -->|MemberDeceased Event| Estate
    Estate -->|AssetVerified Event| Succession
    Succession -->|GrantIssued Event| Estate
    Docs -->|OCR Data| Estate
🧩 Service Breakdown
Service	Responsibility	Key Domain Concepts
Family Service	Identity & Kinship. Manages the graph of people and legal authority.	PolygamousHouse (S.40), Guardianship (Children Act), DigitalTwin.
Estate Service	Inventory & Math. The ledger of assets, debts, and testamentary intent.	SolvencyRadar, S45_Priority_Enforcer, S35_Hotchpot_Calculator.
Succession Service	The Digital Lawyer. Generates court forms and guides the executor.	ReadinessAssessment, ContextDetector, ExecutorRoadmap.
Document Service	Intelligent Storage. Secure S3 storage with OCR extraction.	SmartUploader, VerificationPipeline.
🚀 Key Features & Innovations
1. The Solvency Radar 📡

Real-time financial health check. The system calculates (Assets + Cash) - Liabilities instantly.

Safety Gate: It is programmatically impossible to distribute assets if the estate is insolvent.

S.45 Enforcer: Prevents payment of low-priority debts (e.g., personal loans) before high-priority debts (e.g., funeral expenses).

2. The "Context Detector" 🧠

The system automatically detects the legal regime based on data:

Is there a Will? → Testate Mode (Generates P&A 1).

Is it Polygamous? → Section 40 Mode (Generates House Distribution Schedules).

Is it Islamic? → Kadhi's Court Mode.

3. Smart Document Processing 📄

We don't just upload files; we interrogate them.

OCR: Automatically extracts "Title Deed Numbers" and "ID Numbers" from scans to fill forms.

Validation: A verification workflow ensures documents are legitimate before they enter the legal bundle.

4. The Readiness Score 💯

A 0-100% score that tells the user exactly how "Court Ready" they are.

Missing Death Cert? -40% (Critical)

Minor without Guardian? Blocked (Fatal)

Unverified Bank Account? -10% (Warning)

🛠️ Technology Stack

Backend Framework: NestJS (Node.js)

Language: TypeScript (Strict Mode)

Database: PostgreSQL

ORM: Prisma (with PostgreSQL Extensions)

Architecture: CQRS (Command Query Responsibility Segregation)

Communication: RabbitMQ / Redis (Event Bus)

Storage: AWS S3 (Encrypted)

🏁 Getting Started
Prerequisites

Node.js v18+

Docker & Docker Compose

PostgreSQL

Installation

Clone the repository
git clone https://github.com/yourusername/mirathi.git
cd mirathi

Start Infrastructure (DB, Redis)

docker-compose up -d

Install Dependencies

pnpm install

Run Migrations
npx prisma migrate dev

Start Services

pnpm run start:dev
📜 Legal Compliance

This system is built in strict accordance with:

The Law of Succession Act (Cap 160) - Laws of Kenya.

The Children Act - Regarding guardianship of minors.

The Marriage Act - Regarding recognition of spouses.

Data Protection Act (2019) - Regarding handling of sensitive family data.

🤝 Contributing

We welcome contributions from developers, legal tech enthusiasts, and succession experts. Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Built with ❤️ for Kenyan Families.