// src/succession-automation/src/domain/services/roadmap-generator.service.ts

import { RoadmapTask, TaskCategory, TaskPriority, TaskStatus, ExternalLink } from '../entities/roadmap-task.entity';
import { SuccessionContext } from '../value-objects/succession-context.vo';
import { RoadmapPhase } from '../aggregates/executor-roadmap.aggregate';

/**
 * Roadmap Generator Service
 * 
 * PURPOSE: The "Task Builder" - generates context-aware tasks
 * based on SuccessionContext. Creates the initial roadmap with
 * dependencies, priorities, and instructions.
 * 
 * INPUT:
 * - SuccessionContext (regime, marriage type, religion)
 * - Has minors (triggers guardianship tasks)
 * - Estate value (affects court selection)
 * 
 * OUTPUT:
 * - Array of RoadmapTask entities (pre-configured with dependencies)
 * 
 * TASK GENERATION LOGIC:
 * - ALL CASES: Death cert, asset inventory, file application
 * - INTESTATE: + Chief's letter
 * - TESTATE: + Locate will, verify witnesses
 * - ISLAMIC: + File in Kadhi's Court
 * - POLYGAMOUS: + Define houses (S.40)
 * - HAS MINORS: + Appoint guardian (S.71)
 * 
 * USAGE:
 * ```typescript
 * const tasks = generator.generateTasks(context, 3_000_000, true);
 * // Returns: [Task1 (locked), Task2 (pending), Task3 (locked), ...]
 * ```
 */

export interface TaskGenerationOptions {
  estateValueKES: number;
  hasMinors: boolean;
  polygamousHouseCount: number;
  hasDisputedAssets: boolean;
  applicantIsResident: boolean;
}

export class RoadmapGeneratorService {
  
  /**
   * Generate complete roadmap task list
   */
  public generateTasks(
    context: SuccessionContext,
    options: TaskGenerationOptions
  ): RoadmapTask[] {
    
    const tasks: RoadmapTask[] = [];
    const taskMap = new Map<string, RoadmapTask>(); // For dependency resolution
    
    let orderIndex = 0;
    
    // ==================== PHASE 1: PRE-FILING TASKS ====================
    
    // Task: Obtain Death Certificate (CRITICAL, always required)
    const deathCertTask = this.createObtainDeathCertTask(orderIndex++);
    tasks.push(deathCertTask);
    taskMap.set('DEATH_CERT', deathCertTask);
    
    // Task: Verify deceased identity (depends on death cert)
    const verifyIdentityTask = this.createVerifyIdentityTask(
      orderIndex++,
      [deathCertTask.id.toString()]
    );
    tasks.push(verifyIdentityTask);
    taskMap.set('VERIFY_IDENTITY', verifyIdentityTask);
    
    // Task: Obtain KRA PIN (CRITICAL)
    const kraPinTask = this.createObtainKraPinTask(
      orderIndex++,
      [verifyIdentityTask.id.toString()]
    );
    tasks.push(kraPinTask);
    taskMap.set('KRA_PIN', kraPinTask);
    
    // Task: Verify family structure
    const verifyFamilyTask = this.createVerifyFamilyStructureTask(orderIndex++);
    tasks.push(verifyFamilyTask);
    taskMap.set('VERIFY_FAMILY', verifyFamilyTask);
    
    // CONDITIONAL: Appoint guardian (if minors)
    if (options.hasMinors) {
      const guardianTask = this.createAppointGuardianTask(
        orderIndex++,
        [verifyFamilyTask.id.toString()]
      );
      tasks.push(guardianTask);
      taskMap.set('APPOINT_GUARDIAN', guardianTask);
    }
    
    // CONDITIONAL: Chief's Letter (Intestate only)
    if (context.regime === 'INTESTATE') {
      const chiefLetterTask = this.createObtainChiefLetterTask(
        orderIndex++,
        [verifyFamilyTask.id.toString()]
      );
      tasks.push(chiefLetterTask);
      taskMap.set('CHIEF_LETTER', chiefLetterTask);
    }
    
    // CONDITIONAL: Locate Will (Testate only)
    if (context.regime === 'TESTATE') {
      const locateWillTask = this.createLocateWillTask(orderIndex++);
      tasks.push(locateWillTask);
      taskMap.set('LOCATE_WILL', locateWillTask);
      
      const verifyWitnessesTask = this.createVerifyWitnessesTask(
        orderIndex++,
        [locateWillTask.id.toString()]
      );
      tasks.push(verifyWitnessesTask);
      taskMap.set('VERIFY_WITNESSES', verifyWitnessesTask);
    }
    
    // CONDITIONAL: Define Polygamous Houses (S.40)
    if (context.isSection40Applicable() && options.polygamousHouseCount === 0) {
      const defineHousesTask = this.createDefinePolygamousHousesTask(
        orderIndex++,
        [verifyFamilyTask.id.toString()]
      );
      tasks.push(defineHousesTask);
      taskMap.set('DEFINE_HOUSES', defineHousesTask);
    }
    
    // Task: Inventory Assets
    const inventoryTask = this.createInventoryAssetsTask(
      orderIndex++,
      [kraPinTask.id.toString()]
    );
    tasks.push(inventoryTask);
    taskMap.set('INVENTORY_ASSETS', inventoryTask);
    
    // Task: Verify Asset Ownership
    const verifyAssetsTask = this.createVerifyAssetOwnershipTask(
      orderIndex++,
      [inventoryTask.id.toString()]
    );
    tasks.push(verifyAssetsTask);
    taskMap.set('VERIFY_ASSETS', verifyAssetsTask);
    
    // CONDITIONAL: Resolve Disputes
    if (options.hasDisputedAssets) {
      const resolveDisputesTask = this.createResolveAssetDisputesTask(
        orderIndex++,
        [verifyAssetsTask.id.toString()]
      );
      tasks.push(resolveDisputesTask);
      taskMap.set('RESOLVE_DISPUTES', resolveDisputesTask);
    }
    
    // Task: Identify and Document Debts
    const identifyDebtsTask = this.createIdentifyDebtsTask(
      orderIndex++,
      [inventoryTask.id.toString()]
    );
    tasks.push(identifyDebtsTask);
    taskMap.set('IDENTIFY_DEBTS', identifyDebtsTask);
    
    // ==================== PHASE 2: FILING & GAZETTE TASKS ====================
    
    // Collect dependencies for form generation (all pre-filing must be done)
    const preFiliComplete ngDeps = tasks
      .filter(t => [TaskCategory.IDENTITY_VERIFICATION, TaskCategory.FAMILY_VERIFICATION, 
                    TaskCategory.ASSET_INVENTORY].includes(t.category))
      .map(t => t.id.toString());
    
    // Task: Generate Forms
    const generateFormsTask = this.createGenerateFormsTask(
      orderIndex++,
      preFilingDeps
    );
    tasks.push(generateFormsTask);
    taskMap.set('GENERATE_FORMS', generateFormsTask);
    
    // Task: Review Forms
    const reviewFormsTask = this.createReviewFormsTask(
      orderIndex++,
      [generateFormsTask.id.toString()]
    );
    tasks.push(reviewFormsTask);
    taskMap.set('REVIEW_FORMS', reviewFormsTask);
    
    // Task: Collect Family Consents (P&A 38)
    const collectConsentsTask = this.createCollectConsentsTask(
      orderIndex++,
      [reviewFormsTask.id.toString()]
    );
    tasks.push(collectConsentsTask);
    taskMap.set('COLLECT_CONSENTS', collectConsentsTask);
    
    // Task: Pay Filing Fee
    const payFeeTask = this.createPayFilingFeeTask(
      orderIndex++,
      [reviewFormsTask.id.toString()],
      options.estateValueKES
    );
    tasks.push(payFeeTask);
    taskMap.set('PAY_FEE', payFeeTask);
    
    // Task: File Application
    const fileAppTask = this.createFileApplicationTask(
      orderIndex++,
      [collectConsentsTask.id.toString(), payFeeTask.id.toString()],
      context,
      options.estateValueKES
    );
    tasks.push(fileAppTask);
    taskMap.set('FILE_APP', fileAppTask);
    
    // Task: Publish Notice to Creditors
    const publishNoticeTask = this.createPublishNoticeTask(
      orderIndex++,
      [fileAppTask.id.toString()]
    );
    tasks.push(publishNoticeTask);
    taskMap.set('PUBLISH_NOTICE', publishNoticeTask);
    
    // ==================== PHASE 3: CONFIRMATION TASKS ====================
    
    // Task: Attend Court Hearing (if required)
    const courtHearingTask = this.createAttendCourtHearingTask(
      orderIndex++,
      [fileAppTask.id.toString()]
    );
    tasks.push(courtHearingTask);
    taskMap.set('COURT_HEARING', courtHearingTask);
    
    // Task: Collect Grant
    const collectGrantTask = this.createCollectGrantTask(
      orderIndex++,
      [courtHearingTask.id.toString()]
    );
    tasks.push(collectGrantTask);
    taskMap.set('COLLECT_GRANT', collectGrantTask);
    
    // ==================== PHASE 4: DISTRIBUTION TASKS ====================
    
    // Task: Pay Funeral Expenses (S.45 priority)
    const payFuneralTask = this.createPayFuneralExpensesTask(
      orderIndex++,
      [collectGrantTask.id.toString()]
    );
    tasks.push(payFuneralTask);
    taskMap.set('PAY_FUNERAL', payFuneralTask);
    
    // Task: Settle Secured Debts
    const settleDebtsTask = this.createSettleDebtsTask(
      orderIndex++,
      [payFuneralTask.id.toString()]
    );
    tasks.push(settleDebtsTask);
    taskMap.set('SETTLE_DEBTS', settleDebtsTask);
    
    // Task: Distribute Assets
    const distributeTask = this.createDistributeAssetsTask(
      orderIndex++,
      [settleDebtsTask.id.toString()]
    );
    tasks.push(distributeTask);
    taskMap.set('DISTRIBUTE_ASSETS', distributeTask);
    
    // Task: File Final Accounts
    const finalAccountsTask = this.createFileFinalAccountsTask(
      orderIndex++,
      [distributeTask.id.toString()]
    );
    tasks.push(finalAccountsTask);
    taskMap.set('FINAL_ACCOUNTS', finalAccountsTask);
    
    // Task: Close Estate
    const closeEstateTask = this.createCloseEstateTask(
      orderIndex++,
      [finalAccountsTask.id.toString()]
    );
    tasks.push(closeEstateTask);
    taskMap.set('CLOSE_ESTATE', closeEstateTask);
    
    return tasks;
  }
  
  // ==================== TASK FACTORY METHODS ====================
  
  private createObtainDeathCertTask(orderIndex: number): RoadmapTask {
    return RoadmapTask.createPending(
      'Obtain Death Certificate',
      'Visit Civil Registration Office to obtain certified copy of Death Certificate',
      TaskCategory.DOCUMENT_COLLECTION,
      TaskPriority.CRITICAL,
      orderIndex,
      [
        'Locate the Civil Registration Office where death was registered',
        'Bring your National ID',
        'Pay KES 50 fee',
        'Processing takes 1-3 business days'
      ],
      3,
      {
        legalBasis: 'S.56 LSA - Death Certificate mandatory for all succession cases',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        externalLinks: [
          {
            title: 'Civil Registration Services',
            url: 'https://www.registrarofpersons.go.ke',
            type: 'GUIDE'
          }
        ],
        tags: ['critical', 'document', 'death-certificate']
      }
    );
  }
  
  private createVerifyIdentityTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Verify Deceased Identity',
      'Confirm deceased identity matches official records (National ID, KRA PIN)',
      TaskCategory.IDENTITY_VERIFICATION,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Verify National ID number on Death Certificate',
        'Cross-check with family records',
        'Ensure all official documents use same name spelling'
      ],
      1,
      {
        tags: ['verification', 'identity']
      }
    );
  }
  
  private createObtainKraPinTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Obtain KRA PIN Certificate',
      'Download KRA PIN certificate for deceased from iTax portal',
      TaskCategory.DOCUMENT_COLLECTION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Visit iTax portal (www.itax.kra.go.ke)',
        'Search for deceased using National ID',
        'Download PIN certificate',
        'If deceased had no PIN, apply posthumously with Death Certificate'
      ],
      1,
      {
        legalBasis: 'Tax Procedures Act - Required for estate valuation',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        externalLinks: [
          {
            title: 'iTax Portal',
            url: 'https://itax.kra.go.ke',
            type: 'FORM'
          }
        ],
        tags: ['critical', 'tax', 'kra-pin']
      }
    );
  }
  
  private createVerifyFamilyStructureTask(orderIndex: number): RoadmapTask {
    return RoadmapTask.createPending(
      'Verify Family Structure',
      'Document all family members, marriages, and children',
      TaskCategory.FAMILY_VERIFICATION,
      TaskPriority.HIGH,
      orderIndex,
      [
        'List all spouses (include marriage certificates)',
        'List all children (include birth certificates)',
        'Identify minors (under 18)',
        'Document polygamous houses if applicable',
        'Verify customary marriages with elders if needed'
      ],
      7,
      {
        legalBasis: 'S.35, S.40 LSA - Family structure determines distribution',
        tags: ['family', 'verification']
      }
    );
  }
  
  private createAppointGuardianTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Appoint Guardian for Minor(s)',
      'Designate legal guardian for minor children',
      TaskCategory.GUARDIAN_APPOINTMENT,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Identify suitable guardian (must be 18+)',
        'Obtain guardian consent (P&A 38)',
        'File guardianship application if contested',
        'Guardian must provide bond if managing property'
      ],
      14,
      {
        legalBasis: 'S.71 Children Act - Minors must have legal guardian',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'guardian', 'minors']
      }
    );
  }
  
  private createObtainChiefLetterTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Obtain Letter from Area Chief',
      'Get official letter from Chief confirming next of kin',
      TaskCategory.DOCUMENT_COLLECTION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Visit Chief\'s office in deceased\'s home area',
        'Bring Death Certificate and family IDs',
        'Chief will verify family tree with local elders',
        'Letter issued within 7-14 days'
      ],
      10,
      {
        legalBasis: 'Customary requirement for intestate succession',
        isConditional: true, // Only for Intestate
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'intestate', 'chief-letter']
      }
    );
  }
  
  private createLocateWillTask(orderIndex: number): RoadmapTask {
    return RoadmapTask.createPending(
      'Locate Original Will',
      'Find and retrieve the deceased\'s original Will document',
      TaskCategory.WILL_VERIFICATION,
      TaskPriority.CRITICAL,
      orderIndex,
      [
        'Check with lawyer who drafted Will',
        'Search safe deposit boxes',
        'Contact named Executor',
        'Check home safe and filing cabinets',
        'If lost, file affidavit explaining circumstances'
      ],
      14,
      {
        legalBasis: 'S.11 LSA - Original Will must be produced for Grant',
        isConditional: true, // Only for Testate
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'testate', 'will']
      }
    );
  }
  
  private createVerifyWitnessesTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Verify Will Witnesses',
      'Confirm Will was properly witnessed by 2 eligible witnesses',
      TaskCategory.WITNESS_CONFIRMATION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Check Will has 2 witness signatures',
        'Verify witnesses are not beneficiaries (S.11 LSA)',
        'Verify witnesses were 18+ at signing',
        'Contact witnesses to confirm (affidavit may be needed)'
      ],
      7,
      {
        legalBasis: 'S.11 LSA - Will must be signed by testator and 2 witnesses',
        isConditional: true, // Only for Testate
        tags: ['critical', 'testate', 'witnesses']
      }
    );
  }
  
  private createDefinePolygamousHousesTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Define Polygamous Houses (S.40)',
      'Establish house structure for polygamous marriage',
      TaskCategory.FAMILY_VERIFICATION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Identify each wife and her house',
        'Assign children to their mother\'s house',
        'Document customary house structure with elders',
        'Allocate assets per house',
        'Obtain consent from all house heads'
      ],
      14,
      {
        legalBasis: 'S.40 LSA - Property distributed by house in polygamous estates',
        isConditional: true, // Only for Polygamous
        tags: ['critical', 'polygamous', 'section-40']
      }
    );
  }
  
  private createInventoryAssetsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Inventory All Assets',
      'Create comprehensive list of all estate assets',
      TaskCategory.ASSET_INVENTORY,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'List all land parcels (with title deed numbers)',
        'List all properties (houses, rentals)',
        'List all financial accounts (banks, SACCOs)',
        'List all vehicles (with logbook details)',
        'List business interests and shares',
        'Obtain professional valuation for high-value items'
      ],
      14,
      {
        legalBasis: 'S.83 LSA - Executor must account for all assets',
        tags: ['assets', 'inventory']
      }
    );
  }
  
  private createVerifyAssetOwnershipTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Verify Asset Ownership',
      'Confirm deceased was legal owner of all listed assets',
      TaskCategory.ASSET_INVENTORY,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Check land titles at Lands Registry',
        'Verify vehicle ownership at NTSA',
        'Confirm bank account ownership',
        'Check for co-owners or joint tenancy',
        'Identify any encumbrances (mortgages, charges)'
      ],
      14,
      {
        tags: ['assets', 'verification']
      }
    );
  }
  
  private createResolveAssetDisputesTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Resolve Asset Disputes',
      'Address any contested or disputed assets',
      TaskCategory.ASSET_INVENTORY,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Identify disputed assets',
        'Attempt family mediation',
        'Consider Alternative Dispute Resolution (ADR)',
        'Gather supporting documents',
        'May need separate court application for determination'
      ],
      30,
      {
        isConditional: true, // Only if disputes exist
        tags: ['dispute', 'mediation']
      }
    );
  }
  
  private createIdentifyDebtsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Identify and Document All Debts',
      'List all estate liabilities and creditor claims',
      TaskCategory.DEBT_VERIFICATION,
      TaskPriority.MEDIUM,
      orderIndex,
      deps,
      [
        'Contact known creditors',
        'Check for mortgages and loans',
        'Verify credit card debts',
        'Check utility bills and arrears',
        'Prioritize debts per S.45 LSA (funeral > secured > unsecured)'
      ],
      7,
      {
        legalBasis: 'S.45 LSA - Debts must be paid in priority order',
        tags: ['debts', 'liabilities']
      }
    );
  }
  
  private createGenerateFormsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Generate Court Forms',
      'System will auto-generate required P&A forms',
      TaskCategory.FORM_GENERATION,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Review generated forms for accuracy',
        'Check all fields are complete',
        'Verify signatures and dates',
        'Download PDF copies for records'
      ],
      1,
      {
        tags: ['forms', 'automation']
      }
    );
  }
  
  private createReviewFormsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Review and Approve Forms',
      'Carefully review all generated forms before filing',
      TaskCategory.FORM_REVIEW,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Read each form carefully',
        'Verify all information is correct',
        'Check spelling of names',
        'Confirm asset values are accurate',
        'Approve forms to proceed'
      ],
      2,
      {
        requiresProof: true,
        proofType: 'CONFIRMATION',
        tags: ['forms', 'review']
      }
    );
  }
  
  private createCollectConsentsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Collect Family Consents (P&A 38)',
      'Obtain consent from all family members and beneficiaries',
      TaskCategory.CONSENT_COLLECTION,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'System will send consent requests via SMS/Email',
        'Follow up with family members',
        'Explain process and timeline',
        'Resolve any objections through mediation',
        'All required consents must be received'
      ],
      14,
      {
        legalBasis: 'S.56 LSA - Beneficiaries must consent or be notified',
        tags: ['consent', 'family']
      }
    );
  }
  
  private createPayFilingFeeTask(
    orderIndex: number,
    deps: string[],
    estateValue: number
  ): RoadmapTask {
    
    const fee = estateValue >= 5_000_000 ? 1000 : 500; // KES
    
    return RoadmapTask.createLocked(
      'Pay Court Filing Fee',
      `Pay KES ${fee.toLocaleString()} filing fee`,
      TaskCategory.PAYMENT,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Visit court cashier or use mobile payment',
        `Pay KES ${fee.toLocaleString()}`,
        'Obtain receipt',
        'Upload receipt to system'
      ],
      1,
      {
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['payment', 'filing-fee']
      }
    );
  }
  
  private createFileApplicationTask(
    orderIndex: number,
    deps: string[],
    context: SuccessionContext,
    estateValue: number
  ): RoadmapTask {
    
    const court = context.requiresKadhisCourt() 
      ? "Kadhi's Court"
      : (context.requiresHighCourt(estateValue) ? "High Court" : "Magistrate's Court");
    
    return RoadmapTask.createLocked(
      'File Application with Court',
      `Submit probate application to ${court}`,
      TaskCategory.COURT_FILING,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        `Visit ${court} registry`,
        'Submit all forms and supporting documents',
        'Obtain filing stamp and case number',
        'Note your next court date (if scheduled)'
      ],
      1,
      {
        legalBasis: 'S.56 LSA - Application for Grant',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'filing', 'court']
      }
    );
  }
  
  private createPublishNoticeTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Publish Notice to Creditors',
      'Publish notice in Kenya Gazette and newspaper',
      TaskCategory.COURT_FILING,
      TaskPriority.MEDIUM,
      orderIndex,
      deps,
      [
        'Draft notice to creditors',
        'Publish in Kenya Gazette',
        'Publish in local newspaper',
        'Allow 2 months for creditors to respond'
      ],
      7,
      {
        legalBasis: 'S.45 LSA - Creditors must be notified',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['gazette', 'creditors']
      }
    );
  }
  
  private createAttendCourtHearingTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Attend Court Hearing',
      'Appear in court on scheduled hearing date',
      TaskCategory.COURT_ATTENDANCE,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Note your hearing date (will be provided after filing)',
        'Arrive at court 30 minutes early',
        'Bring all original documents',
        'Answer any questions from Magistrate/Judge',
        'Court may approve grant immediately or set another date'
      ],
      1,
      {
        isConditional: true, // Some cases don't require hearing
        tags: ['court', 'hearing']
      }
    );
  }
  
  private createCollectGrantTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Collect Grant of Representation',
      'Collect approved Grant from court registry',
      TaskCategory.GRANT_COLLECTION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Check if Grant is ready (usually 2-4 weeks after hearing)',
        'Visit court registry',
        'Pay extraction fee (if required)',
        'Collect sealed Grant document',
        'Make certified copies for banks/land registry'
      ],
      7,
      {
        legalBasis: 'S.56 LSA - Grant authorizes administration',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'grant']
      }
    );
  }
  
  private createPayFuneralExpensesTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Pay Funeral Expenses',
      'Settle funeral costs (first priority per S.45)',
      TaskCategory.ASSET_DISTRIBUTION,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Gather all funeral expense receipts',
        'Verify expenses are reasonable',
        'Pay from estate funds',
        'Keep records for final accounts'
      ],
      3,
      {
        legalBasis: 'S.45(a) LSA - Funeral expenses have highest priority',
        tags: ['debts', 'funeral']
      }
    );
  }
  
  private createSettleDebtsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Settle Estate Debts',
      'Pay all verified creditors in priority order',
      TaskCategory.ASSET_DISTRIBUTION,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Pay secured debts (mortgages, charges)',
        'Pay taxes and statutory dues',
        'Pay wages and salaries',
        'Pay general unsecured debts',
        'Obtain receipts and discharge letters'
      ],
      30,
      {
        legalBasis: 'S.45 LSA - Debts paid in priority order',
        tags: ['debts', 'payment']
      }
    );
  }
  
  private createDistributeAssetsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Distribute Assets to Beneficiaries',
      'Transfer assets to rightful beneficiaries per Will or law',
      TaskCategory.ASSET_DISTRIBUTION,
      TaskPriority.CRITICAL,
      orderIndex,
      deps,
      [
        'Calculate each beneficiary\'s share',
        'Prepare transfer documents',
        'Transfer land titles at Lands Registry',
        'Transfer vehicle ownership at NTSA',
        'Distribute cash and movable property',
        'Obtain signed receipts from all beneficiaries'
      ],
      60,
      {
        legalBasis: 'S.35, S.40 LSA - Distribution per law or Will',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['critical', 'distribution', 'assets']
      }
    );
  }
  
  private createFileFinalAccountsTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'File Final Accounts with Court',
      'Submit detailed account of all receipts and payments',
      TaskCategory.FINAL_ACCOUNTS,
      TaskPriority.HIGH,
      orderIndex,
      deps,
      [
        'Prepare schedule of assets received',
        'List all debts paid with receipts',
        'Show distribution to beneficiaries',
        'File accounts with court registry',
        'Court may require hearing to approve accounts'
      ],
      14,
      {
        legalBasis: 'S.83 LSA - Executor must account for administration',
        requiresProof: true,
        proofType: 'DOCUMENT_UPLOAD',
        tags: ['accounts', 'court']
      }
    );
  }
  
  private createCloseEstateTask(orderIndex: number, deps: string[]): RoadmapTask {
    return RoadmapTask.createLocked(
      'Close Estate',
      'Obtain court approval to close estate',
      TaskCategory.FINAL_ACCOUNTS,
      TaskPriority.MEDIUM,
      orderIndex,
      deps,
      [
        'Ensure all assets distributed',
        'Ensure all debts paid',
        'File closing statement with court',
        'Obtain discharge as executor/administrator',
        'Archive all estate records'
      ],
      7,
      {
        legalBasis: 'S.83 LSA - Formal closure of administration',
        tags: ['closure', 'completion']
      }
    );
  }
  
  // ==================== UTILITY METHODS ====================
  
  /**
   * Calculate estimated total duration
   */
  public estimateTotalDuration(tasks: RoadmapTask[]): number {
    // Critical path calculation (longest dependency chain)
    return tasks.reduce((max, task) => {
      const duration = this.calculateTaskDuration(task, tasks);
      return Math.max(max, duration);
    }, 0);
  }
  
  /**
   * Calculate task duration including dependencies
   */
  private calculateTaskDuration(task: RoadmapTask, allTasks: RoadmapTask[]): number {
    if (task.dependsOnTaskIds.length === 0) {
      return task.estimatedDurationDays;
    }
    
    const depDurations = task.dependsOnTaskIds.map(depId => {
      const depTask = allTasks.find(t => t.id.toString() === depId);
      return depTask ? this.calculateTaskDuration(depTask, allTasks) : 0;
    });
    
    return Math.max(...depDurations) + task.estimatedDurationDays;
  }
  
  /**
   * Get task count by category
   */
  public getTaskCountByCategory(tasks: RoadmapTask[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    tasks.forEach(task => {
      const category = task.category;
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }
  
  /**
   * Get critical path tasks (longest dependency chain)
   */
  public getCriticalPath(tasks: RoadmapTask[]): RoadmapTask[] {
    // Find the task with longest total duration
    let longestTask: RoadmapTask | null = null;
    let maxDuration = 0;
    
    tasks.forEach(task => {
      const duration = this.calculateTaskDuration(task, tasks);
      if (duration > maxDuration) {
        maxDuration = duration;
        longestTask = task;
      }
    });
    
    if (!longestTask) return [];
    
    // Trace back through dependencies
    const criticalPath: RoadmapTask[] = [longestTask];
    let currentTask = longestTask;
    
    while (currentTask.dependsOnTaskIds.length > 0) {
      // Find the dependency with longest duration
      let longestDep: RoadmapTask | null = null;
      let longestDepDuration = 0;
      
      currentTask.dependsOnTaskIds.forEach(depId => {
        const depTask = tasks.find(t => t.id.toString() === depId);
        if (depTask) {
          const duration = this.calculateTaskDuration(depTask, tasks);
          if (duration > longestDepDuration) {
            longestDepDuration = duration;
            longestDep = depTask;
          }
        }
      });
      
      if (longestDep) {
        criticalPath.unshift(longestDep);
        currentTask = longestDep;
      } else {
        break;
      }
    }
    
    return criticalPath;
  }
  
  /**
   * Validate task dependencies (check for cycles)
   */
  public validateDependencies(tasks: RoadmapTask[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskMap = new Map<string, RoadmapTask>();
    
    tasks.forEach(task => taskMap.set(task.id.toString(), task));
    
    // Check for cycles
    tasks.forEach(task => {
      const visited = new Set<string>();
      const stack = [task.id.toString()];
      
      while (stack.length > 0) {
        const currentId = stack.pop()!;
        
        if (visited.has(currentId)) {
          errors.push(`Circular dependency detected involving task: ${task.title}`);
          break;
        }
        
        visited.add(currentId);
        
        const currentTask = taskMap.get(currentId);
        if (currentTask) {
          currentTask.dependsOnTaskIds.forEach(depId => {
            if (!taskMap.has(depId)) {
              errors.push(
                `Task "${currentTask.title}" depends on non-existent task: ${depId}`
              );
            } else {
              stack.push(depId);
            }
          });
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get tasks by phase
   */
  public getTasksByPhase(tasks: RoadmapTask[]): Map<RoadmapPhase, RoadmapTask[]> {
    const phaseMap = new Map<RoadmapPhase, RoadmapTask[]>();
    
    const categoryToPhaseMap: Record<TaskCategory, RoadmapPhase> = {
      [TaskCategory.IDENTITY_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DOCUMENT_COLLECTION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FAMILY_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.ASSET_INVENTORY]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DEBT_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.WILL_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.WITNESS_CONFIRMATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.GUARDIAN_APPOINTMENT]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FORM_GENERATION]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.FORM_REVIEW]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.CONSENT_COLLECTION]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.PAYMENT]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.COURT_FILING]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.COURT_ATTENDANCE]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.GRANT_COLLECTION]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.ASSET_DISTRIBUTION]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.FINAL_ACCOUNTS]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.GENERAL]: RoadmapPhase.PRE_FILING
    };
    
    tasks.forEach(task => {
      const phase = categoryToPhaseMap[task.category];
      const phaseTasks = phaseMap.get(phase) || [];
      phaseTasks.push(task);
      phaseMap.set(phase, phaseTasks);
    });
    
    return phaseMap;
  }
}