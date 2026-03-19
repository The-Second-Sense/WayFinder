package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.entities.ProviderEntity;
import com.example.backend_wayfinder.enums.AiMode;
import com.example.backend_wayfinder.enums.Intent;
import com.example.backend_wayfinder.repository.TransactionRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.repository.ProviderRepository;
import com.example.backend_wayfinder.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AiAgentServiceImpl implements AiAgentService {

    private final ProviderRepository providerRepository;
    private final TransactionService transactionService;
    private final AccountService accountService;
    private final BeneficiaryService beneficiaryService;
    private final ContactCacheService contactCacheService;
    private final UserRepository userRepository;
    private final VoiceAuthenticationService voiceAuthenticationService;
    private final AiInteractionLogService aiInteractionLogService;
    private final ModalAiService modalAiService;
    private final BillService billService;

    public AiAgentServiceImpl(
            ProviderRepository providerRepository,
            TransactionService transactionService,
            AccountService accountService,
            BeneficiaryService beneficiaryService,
            ContactCacheService contactCacheService,
            UserRepository userRepository,
            VoiceAuthenticationService voiceAuthenticationService,
            AiInteractionLogService aiInteractionLogService,
            ModalAiService modalAiService,
            BillService billService
    ) {
        this.providerRepository = providerRepository;
        this.transactionService = transactionService;
        this.accountService = accountService;
        this.beneficiaryService = beneficiaryService;
        this.contactCacheService = contactCacheService;
        this.userRepository = userRepository;
        this.voiceAuthenticationService = voiceAuthenticationService;
        this.aiInteractionLogService = aiInteractionLogService;
        this.modalAiService = modalAiService;
        this.billService = billService;
    }

    // In-memory cache for extracted entities from NER model
    private final ThreadLocal<Map<String, Object>> aiExtractedEntities = ThreadLocal.withInitial(HashMap::new);

    // Stores the confidence score returned by the AI model during the current request
    private final ThreadLocal<Double> aiModelConfidenceScore = new ThreadLocal<>();

    @Override
    public VoiceCommandResponse processVoiceCommand(VoiceCommandRequest request) {
        log.info("Processing voice command for user ID: {} in {} mode",
                request.getUserId(), request.getAiMode());

        aiExtractedEntities.remove();
        aiModelConfidenceScore.remove();

        try {
            UserEntity user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getIsVoiceAuthEnabled() && request.getVoiceFingerprint() != null) {
                boolean isVoiceValid = voiceAuthenticationService.verifyVoice(
                        request.getVoiceFingerprint(), user.getVoiceFingerprint());
                if (!isVoiceValid) {
                    log.error("Voice authentication failed for user ID: {}", user.getUserId());
                    return VoiceCommandResponse.builder()
                            .success(false).message("Voice authentication failed").build();
                }
            }

            Intent intent;
            if (request.getPrecomputedIntent() != null && !request.getPrecomputedIntent().isBlank()) {
                intent = mapModelIntentToEnum(request.getPrecomputedIntent());
                log.info("Using pre-computed intent: {} -> {}", request.getPrecomputedIntent(), intent);

                if (request.getPrecomputedEntities() != null && !request.getPrecomputedEntities().isEmpty()) {
                    aiExtractedEntities.set(new HashMap<>(request.getPrecomputedEntities()));
                    log.info("Using pre-computed entities: {}", request.getPrecomputedEntities());
                }

                if (intent == Intent.UNKNOWN) {
                    intent = inferIntentFromEntities(request.getPrecomputedEntities(), request.getVoiceCommandTranscript());
                    log.info("Overriding ALTELE with inferred intent: {}", intent);
                }
            } else {
                intent = detectIntent(request.getVoiceCommandTranscript());
            }

            BigDecimal confidenceScore = calculateConfidenceScore(request.getVoiceCommandTranscript(), intent);

            Map<String, Object> extractedEntities = mergeEntities(
                    aiExtractedEntities.get(), request.getVoiceCommandTranscript());
            log.info("Final extracted entities for processing: {}", extractedEntities);

            VoiceCommandResponse response;
            if (request.getAiMode() == AiMode.GUIDE) {
                response = handleGuideMode(intent, confidenceScore, extractedEntities);
            } else {
                response = executeAction(request.getUserId(), intent,
                        request.getVoiceCommandTranscript(), request.getVoiceFingerprint(), request.getContacts());
            }

            AiInteractionLogDto logDto = AiInteractionLogDto.builder()
                    .userId(request.getUserId())
                    .voiceCommandTranscript(request.getVoiceCommandTranscript())
                    .aiMode(request.getAiMode())
                    .intentDetected(intent.toString())
                    .confidenceScore(confidenceScore)
                    .actionTaken(response.getActionDetails())
                    .aiResponse(response.getMessage())
                    .linkedTransactionId(response.getTransactionId())
                    .build();

            AiInteractionLogDto savedLog = aiInteractionLogService.createLog(logDto);
            response.setLogId(savedLog.getLogId());

            log.info("Voice command processed successfully. Log ID: {}", savedLog.getLogId());
            return response;

        } finally {
            aiExtractedEntities.remove();
            aiModelConfidenceScore.remove();
        }
    }

    @Override
    public Intent detectIntent(String voiceTranscript) {
        try {
            Object result = modalAiService.classifyIntentWithFallback(voiceTranscript);

            if (result instanceof IntentAgentResponse) {
                IntentAgentResponse intentResponse = (IntentAgentResponse) result;
                String modelIntent = intentResponse.getIntent();
                log.info("AI model returned intent: {} for transcript: '{}'", modelIntent, voiceTranscript);

                if (intentResponse.getEntities() != null && !intentResponse.getEntities().isEmpty()) {
                    aiExtractedEntities.set(new HashMap<>(intentResponse.getEntities()));
                    log.info("AI model extracted entities: {}", intentResponse.getEntities());
                }

                return mapModelIntentToEnum(modelIntent);

            } else if (result instanceof DeBertaClassificationResponse) {
                DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) result;
                String winner = debertaResponse.getWinner();
                if (debertaResponse.getScore() != null) {
                    aiModelConfidenceScore.set(debertaResponse.getScore());
                }
                log.info("DeBERTa zero-shot returned intent: {} (score={}) for transcript: '{}'",
                        winner, debertaResponse.getScore(), voiceTranscript);
                return mapModelIntentToEnum(winner);
            }

        } catch (Exception e) {
            log.warn("AI model intent detection failed, falling back to keyword matching: {}", e.getMessage());
        }

        return detectIntentByKeywords(voiceTranscript);
    }

    @Override
    public String getGuidanceForIntent(Intent intent) {
        return switch (intent) {
            case TRANSFER_MONEY -> "To transfer money, say: 'Transfer [amount] to [beneficiary name]'. " +
                    "Make sure you have added the beneficiary first and have sufficient balance.";
            case CHECK_BALANCE -> "To check your balance, I can show you the balance of all your accounts. " +
                    "You can also ask for a specific account balance.";
            case VIEW_TRANSACTIONS -> "To view your transactions, I can show you recent transactions or " +
                    "transactions within a specific date range.";
            case ADD_BENEFICIARY -> "To add a beneficiary, say: 'Add beneficiary [name] with account number [number]'. " +
                    "This will save the contact for future transfers.";
            case VIEW_BENEFICIARIES -> "I can show you all your saved beneficiaries. " +
                    "This helps you quickly transfer money to people you send money to often.";
            case VIEW_ACCOUNTS -> "I can show you all your accounts including their balances and status.";
            case HELP_TRANSFER -> "Transferurile îți permit să trimiți bani către alte conturi. " +
                    "Poți transfera către beneficiari salvați sau numere de cont noi. " +
                    "Sistemul va verifica vocea ta înainte de a procesa transferurile.";
            case HELP_BENEFICIARY -> "Beneficiarii sunt persoanele la care trimiți bani frecvent. " +
                    "Poți adăuga un beneficiar cu numele și contul său, " +
                    "apoi poți transfera rapid fără să reintroduci datele.";
            case HELP_ACCOUNT -> "Conturile tale sunt afișate pe ecranul principal. " +
                    "Poți activa sau dezactiva conturi din secțiunea Conturi. " +
                    "Fiecare cont are propriul IBAN și sold.";
            case HELP_GENERAL -> "Îți pot ajuta cu: verificarea soldului, vizualizarea tranzacțiilor, " +
                    "transferul de bani, gestionarea beneficiarilor și vizualizarea conturilor. " +
                    "Poți trece în modul AGENT pentru ca eu să execut acțiunile automat, " +
                    "sau rămâi în modul GHID pentru instrucțiuni pas cu pas.";
            case REMOVE_BENEFICIARY -> "Pentru a șterge un beneficiar, mergi la secțiunea Beneficiari, " +
                    "selectează beneficiarul și apasă 'Șterge'.";
            case ACTIVATE_ACCOUNT -> "Pentru a activa un cont, mergi la secțiunea Conturi și apasă 'Activează' lângă contul dorit.";
            case DEACTIVATE_ACCOUNT -> "Pentru a dezactiva un cont, mergi la secțiunea Conturi și apasă 'Dezactivează' lângă contul dorit.";
            case PLATA_FACTURI -> "Pentru a plăti o factură, spune: 'Plătește factura la [furnizor] de [sumă] lei'.";
            default -> "Nu înțeleg comanda. Încearcă să spui: " +
                    "'verifică soldul', 'transfer bani', 'tranzacții recente', sau 'ajutor'.";
        };
    }

    @Override
    public VoiceCommandResponse executeAction(UUID userId, Intent intent, String voiceTranscript, List<Double> voiceFingerprint, List<ContactLiteDto> contacts) {
        log.info("Executing action for intent: {} for user ID: {}", intent, userId);
        try {
            return switch (intent) {
                case TRANSFER_MONEY -> executeTransfer(userId, voiceTranscript, voiceFingerprint, contacts);
                case PLATA_FACTURI -> executePlataFacturi(userId, voiceTranscript, voiceFingerprint);
                case CHECK_BALANCE -> executeCheckBalance(userId);
                case VIEW_TRANSACTIONS -> executeViewTransactions(userId);
                case VIEW_ACCOUNTS -> executeViewAccounts(userId);
                case VIEW_BENEFICIARIES -> executeViewBeneficiaries(userId);
                case ADD_BENEFICIARY -> executeAddBeneficiary(userId, voiceTranscript);
                default -> VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT).intent(intent)
                        .actionPerformed(false).success(false)
                        .message("I cannot perform this action. " + getGuidanceForIntent(intent))
                        .build();
            };
        } catch (Exception e) {
            log.error("Error executing action for intent: {}", intent, e);
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(intent)
                    .actionPerformed(false).success(false)
                    .message("Failed to execute action: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public List<AiInteractionLogDto> getUserInteractionHistory(UUID userId) {
        return aiInteractionLogService.getLogsByUserId(userId);
    }

    @Override
    public List<AiInteractionLogDto> getRecentInteractions(UUID userId, LocalDateTime since) {
        return aiInteractionLogService.getLogsByDateRange(userId, since, LocalDateTime.now());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private Intent inferIntentFromEntities(Map<String, Object> entities, String transcript) {
        if (entities != null) {
            boolean hasSuma      = entities.containsKey("SUMA");
            boolean hasBeneficiar = entities.containsKey("BENEFICIAR");
            boolean hasValuta    = entities.containsKey("VALUTA");
            boolean hasFactura   = entities.containsKey("FACTURA");
            boolean hasSold      = entities.containsKey("SOLD");
            boolean hasTranzactii = entities.containsKey("TRANZACTII");

            if (hasFactura) return Intent.PLATA_FACTURI;
            if (hasSuma && (hasBeneficiar || hasValuta)) return Intent.TRANSFER_MONEY;
            if (hasBeneficiar && !hasSuma) return Intent.ADD_BENEFICIARY;
            if (hasSold) return Intent.CHECK_BALANCE;
            if (hasTranzactii) return Intent.VIEW_TRANSACTIONS;
        }
        return detectIntentByKeywords(transcript);
    }

    private Intent mapModelIntentToEnum(String modelLabel) {
        if (modelLabel == null) return Intent.UNKNOWN;
        return switch (modelLabel.toUpperCase().trim()) {
            case "TRANSFER" -> Intent.TRANSFER_MONEY;
            case "SOLD" -> Intent.CHECK_BALANCE;
            case "TRANZACTII" -> Intent.VIEW_TRANSACTIONS;
            case "ADAUGA_BENEFICIAR" -> Intent.ADD_BENEFICIARY;
            case "PLATA_FACTURI" -> Intent.PLATA_FACTURI;
            default -> Intent.UNKNOWN;
        };
    }

    private Intent detectIntentByKeywords(String voiceTranscript) {
        String t = voiceTranscript.toLowerCase();

        // Transfer (EN + RO + question forms)
        if (t.contains("transfer") || t.contains("transferă") || t.contains("trimite") ||
            t.contains("plătește") || t.contains("plateste") || t.contains("send money") ||
            t.contains("pay") || t.contains("send") || t.contains("virament") || t.contains("achita") ||
            t.contains("cum fac un transfer") || t.contains("cum transfer") || t.contains("vreau să transfer") ||
            t.contains("vreau sa transfer") || t.contains("cum trimit") || t.contains("cum platesc") ||
            t.contains("cum plătesc"))
            return Intent.TRANSFER_MONEY;

        // Balance (EN + RO + question forms)
        if (t.contains("balance") || t.contains("sold") || t.contains("how much") ||
            t.contains("cât am") || t.contains("cat am") || t.contains("balanță") || t.contains("balanta") ||
            t.contains("cât este") || t.contains("cat este") || t.contains("ce sold") ||
            t.contains("verifică soldul") || t.contains("verifica soldul"))
            return Intent.CHECK_BALANCE;

        // Transactions (EN + RO + question forms)
        if (t.contains("transaction") || t.contains("history") || t.contains("recent payments") ||
            t.contains("tranzacții") || t.contains("tranzactii") || t.contains("istoric") ||
            t.contains("plăți") || t.contains("plati") || t.contains("ce tranzacții") ||
            t.contains("ultimele plăți") || t.contains("ultimele plati"))
            return Intent.VIEW_TRANSACTIONS;

        // Beneficiary (EN + RO + question forms)
        if (t.contains("add beneficiary") || t.contains("save contact") ||
            t.contains("adaugă beneficiar") || t.contains("adauga beneficiar") ||
            t.contains("beneficiar") || t.contains("contact nou") ||
            t.contains("cum adaug") || t.contains("vreau să adaug") || t.contains("vreau sa adaug"))
            return Intent.ADD_BENEFICIARY;

        // Bill payment (EN + RO + question forms)
        if (t.contains("plătește factura") || t.contains("factură") || t.contains("bill") ||
            t.contains("utilities") || t.contains("electricity") || t.contains("water") ||
            t.contains("internet") || t.contains("phone bill") || t.contains("plata facturii"))
            return Intent.PLATA_FACTURI;

        return Intent.UNKNOWN;
    }

    private VoiceCommandResponse handleGuideMode(Intent intent, BigDecimal confidenceScore, Map<String, Object> entities) {
        String guidance = getGuidanceForIntent(intent);
        List<GuidanceStep> guidanceSteps = buildGuidanceSteps(intent, entities);
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.GUIDE).intent(intent).confidenceScore(confidenceScore)
                .guidanceMessage(guidance).guidanceSteps(guidanceSteps)
                .extractedEntities(entities)
                .navigateToScreen(getNavigationScreen(intent))
                .highlightButtonId(getFirstButtonToHighlight(intent))
                .actionPerformed(false).message(guidance).success(true).build();
    }

    private List<GuidanceStep> buildGuidanceSteps(Intent intent, Map<String, Object> entities) {
        List<GuidanceStep> steps = new ArrayList<>();
        switch (intent) {
            case TRANSFER_MONEY:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Trimite'")
                        .elementId("nav-transfer-button").screenName("home").icon("send").completed(false).build());
                String beneficiary = entities != null && entities.containsKey("beneficiary")
                        ? (String) entities.get("beneficiary") : "";
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Selectează beneficiarul sau adauga un numar de telefon: " + beneficiary)
                        .elementId("beneficiary-selector").screenName("transfer").expectedValue(beneficiary)
                        .icon("person").completed(false).build());
                String amount = entities != null && entities.containsKey("amount")
                        ? entities.get("amount").toString() : "";
                steps.add(GuidanceStep.builder().stepNumber(3).instruction("Introdu suma: " + amount + " RON")
                        .elementId("amount-input").screenName("transfer").expectedValue(amount)
                        .icon("attach_money").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(4).instruction("Apasă 'Confirmă Transferul'")
                        .elementId("confirm-button").screenName("transfer").icon("check_circle").completed(false).build());
                break;
            case CHECK_BALANCE:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Soldul tău este afișat pe ecranul principal")
                        .elementId("balance-card").screenName("dashboard").icon("account_balance").completed(false).build());
                break;
            case VIEW_TRANSACTIONS:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Tranzacții'")
                        .elementId("nav-transactions-button").screenName("home").icon("receipt").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Vezi lista ta de tranzacții")
                        .elementId("transactions-list").screenName("transactions").icon("list").completed(false).build());
                break;
            case ADD_BENEFICIARY:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Beneficiari'")
                        .elementId("nav-beneficiaries-button").screenName("home").icon("people").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Apasă '+' pentru a adăuga beneficiar")
                        .elementId("add-beneficiary-button").screenName("beneficiaries").icon("add").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(3).instruction("Introdu numele și contul beneficiarului")
                        .elementId("beneficiary-form").screenName("add-beneficiary").icon("edit").completed(false).build());
                break;
            case VIEW_BENEFICIARIES:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Beneficiari'")
                        .elementId("nav-beneficiaries-button").screenName("home").icon("people").completed(false).build());
                break;
            case VIEW_ACCOUNTS:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Conturi'")
                        .elementId("nav-accounts-button").screenName("home").icon("account_balance_wallet").completed(false).build());
                break;
            case REMOVE_BENEFICIARY:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Beneficiari'")
                        .elementId("nav-beneficiaries-button").screenName("home").icon("people").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Selectează beneficiarul pe care vrei să-l ștergi")
                        .elementId("beneficiary-list-item").screenName("beneficiaries").icon("person").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(3).instruction("Apasă 'Șterge' pentru a confirma")
                        .elementId("delete-beneficiary-button").screenName("beneficiaries").icon("delete").completed(false).build());
                break;
            case ACTIVATE_ACCOUNT:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Conturi'")
                        .elementId("nav-accounts-button").screenName("home").icon("account_balance_wallet").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Selectează contul pe care vrei să-l activezi")
                        .elementId("account-list-item").screenName("accounts").icon("account_balance").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(3).instruction("Apasă 'Activează'")
                        .elementId("activate-account-button").screenName("accounts").icon("check_circle").completed(false).build());
                break;
            case DEACTIVATE_ACCOUNT:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Conturi'")
                        .elementId("nav-accounts-button").screenName("home").icon("account_balance_wallet").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Selectează contul pe care vrei să-l dezactivezi")
                        .elementId("account-list-item").screenName("accounts").icon("account_balance").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(3).instruction("Apasă 'Dezactivează'")
                        .elementId("deactivate-account-button").screenName("accounts").icon("cancel").completed(false).build());
                break;
            case HELP_TRANSFER:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Spune: 'Transferă [sumă] lei lui [beneficiar]'")
                        .elementId("voice-button").screenName("home").icon("mic").completed(false).build());
                steps.add(GuidanceStep.builder().stepNumber(2).instruction("Asigură-te că beneficiarul este salvat în lista ta")
                        .elementId("nav-beneficiaries-button").screenName("home").icon("people").completed(false).build());
                break;
            case HELP_BENEFICIARY:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Beneficiari' pentru a gestiona contactele")
                        .elementId("nav-beneficiaries-button").screenName("home").icon("people").completed(false).build());
                break;
            case HELP_ACCOUNT:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Apasă butonul 'Conturi' pentru a vedea conturile tale")
                        .elementId("nav-accounts-button").screenName("home").icon("account_balance_wallet").completed(false).build());
                break;
            case HELP_GENERAL:
                steps.add(GuidanceStep.builder().stepNumber(1)
                        .instruction("Poți spune: 'verifică soldul', 'transferă bani', 'tranzacții recente'")
                        .elementId("voice-button").screenName("home").icon("mic").completed(false).build());
                break;
            default:
                steps.add(GuidanceStep.builder().stepNumber(1).instruction("Încearcă să spui o comandă validă")
                        .elementId("voice-button").screenName("home").icon("mic").completed(false).build());
                break;
        }
        return steps;
    }

    private String getNavigationScreen(Intent intent) {
        return switch (intent) {
            case TRANSFER_MONEY, PLATA_FACTURI -> "transfer";
            case CHECK_BALANCE -> "dashboard";
            case VIEW_TRANSACTIONS -> "transactions";
            case ADD_BENEFICIARY -> "add-beneficiary";
            case VIEW_BENEFICIARIES, REMOVE_BENEFICIARY -> "beneficiaries";
            case VIEW_ACCOUNTS, ACTIVATE_ACCOUNT, DEACTIVATE_ACCOUNT -> "accounts";
            case HELP_TRANSFER, HELP_GENERAL -> "home";
            case HELP_BENEFICIARY -> "beneficiaries";
            case HELP_ACCOUNT -> "accounts";
            default -> "dashboard";
        };
    }

    private String getFirstButtonToHighlight(Intent intent) {
        return switch (intent) {
            case TRANSFER_MONEY -> "nav-transfer-button";
            case PLATA_FACTURI -> "voice-button";
            case CHECK_BALANCE -> "balance-card";
            case VIEW_TRANSACTIONS -> "nav-transactions-button";
            case ADD_BENEFICIARY, VIEW_BENEFICIARIES, REMOVE_BENEFICIARY -> "nav-beneficiaries-button";
            case VIEW_ACCOUNTS, ACTIVATE_ACCOUNT, DEACTIVATE_ACCOUNT -> "nav-accounts-button";
            case HELP_TRANSFER, HELP_GENERAL -> "voice-button";
            case HELP_BENEFICIARY -> "nav-beneficiaries-button";
            case HELP_ACCOUNT -> "nav-accounts-button";
            default -> null;
        };
    }

    private VoiceCommandResponse executeTransfer(UUID userId, String transcript, List<Double> voiceFingerprint, List<ContactLiteDto> contacts) {
        Map<String, Object> entities = mergeEntities(aiExtractedEntities.get(), transcript);

        if (!entities.containsKey("amount")) {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                    .actionPerformed(false).success(false)
                    .message("Could not detect amount. Please specify how much you want to transfer.")
                    .build();
        }

        BigDecimal amount = (BigDecimal) entities.get("amount");
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
        AccountDto sourceAccount = accounts.stream().filter(AccountDto::getIsActive).findFirst()
                .orElseThrow(() -> new RuntimeException("No active account found"));

        BeneficiaryDto beneficiary;
        String recipientIdentifier;

        if (entities.containsKey("phoneNumber")) {
            String phoneNumber = (String) entities.get("phoneNumber");
            log.info("Attempting transfer to phone number: {}", phoneNumber);
            recipientIdentifier = phoneNumber;
            try {
                beneficiary = beneficiaryService.getBeneficiaryByPhoneNumber(userId, phoneNumber);
                log.info("Found beneficiary with phone: {}", phoneNumber);
            } catch (Exception e) {
                try {
                    UserEntity recipientUser = userRepository.findByPhoneNumber(phoneNumber)
                            .orElseThrow(() -> new RuntimeException("No user found with phone number: " + phoneNumber));
                    List<AccountDto> recipientAccounts = accountService.getAccountsByUserId(recipientUser.getUserId());
                    AccountDto recipientAccount = recipientAccounts.stream().filter(AccountDto::getIsActive).findFirst()
                            .orElseThrow(() -> new RuntimeException("Recipient has no active account"));
                    beneficiary = BeneficiaryDto.builder()
                            .targetAccountNumber(recipientAccount.getAccountNumber())
                            .nickname(recipientUser.getFullName()).build();
                    log.info("Found user with phone {}: {}", phoneNumber, recipientUser.getFullName());
                } catch (Exception ex) {
                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                            .actionPerformed(false).success(false)
                            .message("Could not find user or beneficiary with phone number: " + phoneNumber).build();
                }
            }
        } else if (entities.containsKey("beneficiary")) {
            String beneficiaryName = (String) entities.get("beneficiary");
            recipientIdentifier = beneficiaryName;

            // ── Step 1: Search in contacts cache (phonebook sent from frontend) ──────
            // Store current request contacts if provided (refresh cache)
            if (contacts != null && !contacts.isEmpty()) {
                contactCacheService.storeContacts(userId, contacts);
            }
            List<ContactLiteDto> contactMatches = contactCacheService.findByName(userId, beneficiaryName);

            // Fallback: fuzzy matching for typos (e.g. "Pogdan" -> "Bogdan")
            if (contactMatches.isEmpty()) {
                List<ContactLiteDto> cachedContacts = contactCacheService.getContacts(userId);
                contactMatches = rankContactsBySimilarity(cachedContacts, beneficiaryName, 0.84, 5);
                if (!contactMatches.isEmpty()) {
                    log.info("Found {} fuzzy contact match(es) for '{}' (typo correction)", contactMatches.size(), beneficiaryName);
                }
            }

            if (!contactMatches.isEmpty()) {
                log.info("Found {} contact match(es) from phonebook cache for '{}'", contactMatches.size(), beneficiaryName);

                // Map ContactLiteDto → BeneficiaryDto so the frontend confirm flow works uniformly
                List<BeneficiaryDto> contactAsBeneficiaries = new ArrayList<>();
                for (ContactLiteDto c : contactMatches) {
                    // Try to resolve phone → user → account within this app
                    String phone = c.getPhone();
                    String accountNumber = null;
                    String officialName = c.getName();

                    if (phone != null && !phone.isBlank()) {
                        try {
                            UserEntity appUser = userRepository.findByPhoneNumber(phone).orElse(null);
                            if (appUser != null) {
                                List<AccountDto> appAccounts = accountService.getAccountsByUserId(appUser.getUserId());
                                AccountDto appAccount = appAccounts.stream().filter(AccountDto::getIsActive).findFirst().orElse(null);
                                if (appAccount != null) accountNumber = appAccount.getAccountNumber();
                                officialName = appUser.getFullName();
                            }
                        } catch (Exception ignored) {}
                    }

                    contactAsBeneficiaries.add(BeneficiaryDto.builder()
                            .nickname(c.getName())
                            .officialName(officialName)
                            .phoneNumber(phone)
                            .targetAccountNumber(accountNumber) // may be null if not a Wayfinder user
                            .build());
                }

                // Build correction hint if name differs from what was understood
                String correctionNote = "";
                if (!contactAsBeneficiaries.isEmpty()) {
                    String topName = contactAsBeneficiaries.get(0).getNickname();
                    if (topName != null && !normalizeDiacritics(topName).equalsIgnoreCase(normalizeDiacritics(beneficiaryName))) {
                        correctionNote = "Am înțeles '" + beneficiaryName + "'. ";
                    }
                }

                String confirmMsg = contactAsBeneficiaries.size() == 1
                        ? correctionNote + "Am găsit contactul '" + contactAsBeneficiaries.get(0).getNickname() +
                          "'. Confirmi transferul de " + amount + " LEI?"
                        : correctionNote + "Am găsit " + contactAsBeneficiaries.size() + " contacte cu numele '" +
                          beneficiaryName + "'. Alege unul.";

                Map<String, Object> actionData = new HashMap<>();
                actionData.put("description", entities.getOrDefault("description", ""));
                actionData.put("targetAccountNumber", contactAsBeneficiaries.get(0).getTargetAccountNumber());
                actionData.put("amount", amount);
                actionData.put("currency", "RON");

                return VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                        .actionPerformed(false).success(true)
                        .pendingConfirmation(true)
                        .matchedBeneficiaries(contactAsBeneficiaries)
                        .extractedEntities(entities)
                        .actionData(actionData)
                        .message(confirmMsg)
                        .build();
            }

            // ── Step 2: Search saved beneficiaries in DB ──────────────────────────────
            try {
                beneficiary = beneficiaryService.getBeneficiaryByNickname(userId, beneficiaryName);
                // exact match found — still ask for confirmation before executing
                Map<String, Object> actionData = new HashMap<>();
                actionData.put("description", entities.getOrDefault("description", ""));
                actionData.put("targetAccountNumber", beneficiary.getTargetAccountNumber());
                actionData.put("amount", amount);
                actionData.put("currency", "RON");

                return VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                        .actionPerformed(false).success(true)
                        .pendingConfirmation(true)
                        .matchedBeneficiaries(List.of(beneficiary))
                        .extractedEntities(entities)
                        .actionData(actionData)
                        .message("Am găsit beneficiarul '" + beneficiary.getNickname() +
                                 "'. Confirmi transferul de " + amount + " LEI?")
                        .build();
            } catch (Exception e) {
                List<String> candidates = generateNameCandidates(beneficiaryName);
                List<BeneficiaryDto> matches = new ArrayList<>();

                for (String candidate : candidates) {
                    List<BeneficiaryDto> found = beneficiaryService.searchBeneficiaries(userId, candidate);
                    for (BeneficiaryDto b : found) {
                        if (matches.stream().noneMatch(m -> m.getBeneficiaryId().equals(b.getBeneficiaryId()))) {
                            matches.add(b);
                        }
                    }
                    if (!matches.isEmpty()) break;
                }

                if (!matches.isEmpty()) {
                    String confirmMsg = matches.size() == 1
                            ? "Am găsit beneficiarul '" + matches.get(0).getNickname() +
                              "'. Confirmi transferul de " + amount + " LEI?"
                            : "Am găsit " + matches.size() + " beneficiari cu numele '" + beneficiaryName + "'. Alege unul.";
                    Map<String, Object> actionData = new HashMap<>();
                    actionData.put("description", entities.getOrDefault("description", ""));
                    actionData.put("targetAccountNumber", matches.get(0).getTargetAccountNumber());
                    actionData.put("amount", amount);
                    actionData.put("currency", "RON");

                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                            .actionPerformed(false).success(true)
                            .pendingConfirmation(true)
                            .matchedBeneficiaries(matches)
                            .extractedEntities(entities)
                            .actionData(actionData)
                            .message(confirmMsg)
                            .build();
                }

                // ── Step 3: Search registered app users by name ───────────────────────
                List<String> userCandidates = generateNameCandidates(beneficiaryName);
                List<UserEntity> userMatches = new ArrayList<>();

                for (String candidate : userCandidates) {
                    List<String> searchTerms = new ArrayList<>();
                    searchTerms.add(candidate);
                    String normalized = normalizeDiacritics(candidate);
                    if (!normalized.equals(candidate)) searchTerms.add(normalized);

                    for (String term : searchTerms) {
                        List<UserEntity> found = userRepository.findByFullNameContainingIgnoreCase(term);
                        for (UserEntity u : found) {
                            if (userMatches.stream().noneMatch(m -> m.getUserId().equals(u.getUserId()))) {
                                userMatches.add(u);
                            }
                        }
                    }
                    if (!userMatches.isEmpty()) break;
                }

                if (userMatches.isEmpty()) {
                    String[] words = normalizeDiacritics(beneficiaryName).split("\\s+");
                    for (String word : words) {
                        if (word.length() < 3) continue;
                        List<UserEntity> found = userRepository.findByFullNameContainingIgnoreCase(word);
                        for (UserEntity u : found) {
                            if (userMatches.stream().noneMatch(m -> m.getUserId().equals(u.getUserId()))) {
                                userMatches.add(u);
                            }
                        }
                    }
                }

                if (userMatches.isEmpty()) {
                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                            .actionPerformed(false).success(false)
                            .message("Nu am găsit niciun utilizator sau beneficiar cu numele '" + beneficiaryName + "'.")
                            .build();
                }

                List<BeneficiaryDto> userAsBeneficiaries = new ArrayList<>();
                for (UserEntity u : userMatches) {
                    List<AccountDto> uAccounts = accountService.getAccountsByUserId(u.getUserId());
                    uAccounts.stream().filter(AccountDto::getIsActive).findFirst().ifPresent(acc ->
                        userAsBeneficiaries.add(BeneficiaryDto.builder()
                            .nickname(u.getFullName())
                            .officialName(u.getFullName())
                            .targetAccountNumber(acc.getAccountNumber())
                            .phoneNumber(u.getPhoneNumber())
                            .build())
                    );
                }

                if (userAsBeneficiaries.isEmpty()) {
                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                            .actionPerformed(false).success(false)
                            .message("Utilizatorul '" + beneficiaryName + "' nu are un cont activ.")
                            .build();
                }

                String confirmMsg = userAsBeneficiaries.size() == 1
                        ? "Am găsit utilizatorul '" + userAsBeneficiaries.get(0).getNickname() +
                          "'. Confirmi transferul de " + amount + " LEI?"
                        : "Am găsit " + userAsBeneficiaries.size() + " utilizatori cu numele '" +
                          beneficiaryName + "'. Alege unul.";

                Map<String, Object> actionData = new HashMap<>();
                actionData.put("description", entities.getOrDefault("description", ""));
                actionData.put("targetAccountNumber", userAsBeneficiaries.get(0).getTargetAccountNumber());
                actionData.put("amount", amount);
                actionData.put("currency", "RON");

                return VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                        .actionPerformed(false).success(true)
                        .pendingConfirmation(true)
                        .matchedBeneficiaries(userAsBeneficiaries)
                        .extractedEntities(entities)
                        .actionData(actionData)
                        .message(confirmMsg)
                        .build();
            }
        } else {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY)
                    .actionPerformed(false).success(false)
                    .message("Could not detect recipient. Please specify a beneficiary name or phone number.").build();
        }

        // Use extracted description if available, fallback to default
        String description = entities.containsKey("description")
                ? "voice transfer confirmed: " + String.valueOf(entities.get("description"))
                : "voice transfer confirmed";

        CreateTransactionRequest transactionRequest = CreateTransactionRequest.builder()
                .sourceAccountId(sourceAccount.getAccountId())
                .destinationAccountNumber(beneficiary.getTargetAccountNumber())
                .amount(amount).currency("RON")
                .description(description)
                .initiatedBy("AI").currentVoiceFingerprint(voiceFingerprint).build();

        TransactionDto transaction = transactionService.createTransaction(transactionRequest);

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.TRANSFER_MONEY).actionPerformed(true)
                .actionConfirmation("Successfully transferred " + amount + " RON to " + recipientIdentifier)
                .actionDetails("Transaction ID: " + transaction.getId())
                .transactionId(transaction.getId()).success(true).message("Transfer completed!").build();
    }

    private VoiceCommandResponse executePlataFacturi(UUID userId, String transcript, List<Double> voiceFingerprint) {
        Map<String, Object> entities = mergeEntities(aiExtractedEntities.get(), transcript);

        // NEW FLOW: Check for provider/factura FIRST (no amount needed!)
        if (!entities.containsKey("factura")) {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.PLATA_FACTURI)
                    .actionPerformed(false).success(false)
                    .message("Nu am putut detecta furnizorul facturii. Te rog specifică ce factură vrei să plătești (ex: 'Digi', 'electricitate').")
                    .build();
        }

        String providerKeyword = (String) entities.get("factura");
        log.info("Searching for bills with provider keyword: {}", providerKeyword);

        // Step 1: Try to find provider by name/keyword
        List<ProviderEntity> providers = providerRepository.findByCategoryContainingIgnoreCase(providerKeyword);
        if (providers.isEmpty()) {
            // Try searching by name
            providers = providerRepository.findAll().stream()
                    .filter(p -> p.getName().toLowerCase().contains(providerKeyword.toLowerCase()) ||
                                p.getKeywords().toLowerCase().contains(providerKeyword.toLowerCase()))
                    .toList();

            if (providers.isEmpty()) {
                return VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT).intent(Intent.PLATA_FACTURI)
                        .actionPerformed(false).success(false)
                        .message("Furnizorul '" + providerKeyword + "' nu este recunoscut. Încearcă: Digi, Orange, Vodafone, electricitate, gaz, apă.")
                        .build();
            }
        }

        // Step 2: Search for bills directly using BillService
        List<BillDto> bills = billService.getUserBillsByProviderName(userId, providerKeyword);

        if (bills.isEmpty()) {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.PLATA_FACTURI)
                    .actionPerformed(false).success(false)
                    .message("Nu aveți facturi neachitate la " + providerKeyword + ". Spuneți suma pe care doriți s-o plătiți.")
                    .build();
        }

        // Step 3: Return bills found
        Map<String, Object> actionData = new HashMap<>();
        actionData.put("providerKeyword", providerKeyword);
        actionData.put("billsFound", bills.size());
        actionData.put("bills", bills);

        String message;
        if (bills.size() == 1) {
            BillDto bill = bills.get(0);
            message = String.format("Aveți o factură la %s de %.2f RON: %s. Confirmați plata?",
                    bill.getProviderName(), bill.getAmount(), bill.getDescription());
            actionData.put("selectedBill", bill);
        } else {
            message = "Am găsit " + bills.size() + " facturi neachitate la " + providerKeyword + ":";
            for (int i = 0; i < bills.size(); i++) {
                BillDto bill = bills.get(i);
                message += String.format("\n%d. %s - %.2f RON (%s)",
                    i + 1, bill.getBillName(), bill.getAmount(), bill.getDescription());
            }
            message += "\n\nCare plătiți?";
        }

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.PLATA_FACTURI)
                .actionPerformed(false).success(true)
                .pendingConfirmation(true)
                .extractedEntities(entities)
                .actionData(actionData)
                .message(message)
                .build();
    }

    private VoiceCommandResponse executeCheckBalance(UUID userId) {
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
        StringBuilder message = new StringBuilder("Your account balances:\n");
        for (AccountDto account : accounts) {
            message.append("Account ").append(account.getAccountNumber())
                   .append(": ").append(account.getBalance())
                   .append(" ").append(account.getCurrency()).append("\n");
        }
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.CHECK_BALANCE).actionPerformed(true)
                .actionDetails("Retrieved " + accounts.size() + " accounts")
                .message(message.toString()).success(true).build();
    }

    private VoiceCommandResponse executeViewTransactions(UUID userId) {
        List<TransactionDto> transactions = transactionService.getTransactionsByUserId(userId);
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.VIEW_TRANSACTIONS).actionPerformed(true)
                .actionDetails("Retrieved " + transactions.size() + " transactions")
                .message("Found " + transactions.size() + " transactions. Check the app for details.")
                .success(true).build();
    }

    private VoiceCommandResponse executeViewAccounts(UUID userId) {
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.VIEW_ACCOUNTS).actionPerformed(true)
                .actionDetails("Retrieved " + accounts.size() + " accounts")
                .message("You have " + accounts.size() + " accounts. Check the app for details.")
                .success(true).build();
    }

    private VoiceCommandResponse executeViewBeneficiaries(UUID userId) {
        List<BeneficiaryDto> beneficiaries = beneficiaryService.getBeneficiariesByUserId(userId);
        StringBuilder message = new StringBuilder("Your beneficiaries:\n");
        for (BeneficiaryDto ben : beneficiaries) {
            message.append("- ").append(ben.getNickname()).append("\n");
        }
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT).intent(Intent.VIEW_BENEFICIARIES).actionPerformed(true)
                .actionDetails("Retrieved " + beneficiaries.size() + " beneficiaries")
                .message(message.toString()).success(true).build();
    }

    private VoiceCommandResponse executeAddBeneficiary(UUID userId, String transcript) {
        String name = null;
        String accountNumber = null;
        String phoneNumber = null;

        Pattern namePattern = Pattern.compile(
                "(?:beneficiar(?:ul)?|beneficiary)\\s+([A-Za-z]+(?:\\s+[A-Za-z]+)?)",
                Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(transcript);
        if (nameMatcher.find()) name = nameMatcher.group(1).trim();

        Pattern ibanPattern = Pattern.compile(
                "(?:cont|account|iban)[:\\s]+([A-Z]{2}\\d{2}[A-Z0-9]{1,30}|\\d{10,26})",
                Pattern.CASE_INSENSITIVE);
        Matcher ibanMatcher = ibanPattern.matcher(transcript);
        if (ibanMatcher.find()) accountNumber = ibanMatcher.group(1).trim();

        Pattern phonePattern = Pattern.compile(
                "(?:telefon|phone|tel)[:\\s]*(\\+?\\d[\\d\\s.-]{8,14}\\d)",
                Pattern.CASE_INSENSITIVE);
        Matcher phoneMatcher = phonePattern.matcher(transcript);
        if (phoneMatcher.find()) phoneNumber = phoneMatcher.group(1).replaceAll("[\\s.-]", "").trim();

        if (name == null || (accountNumber == null && phoneNumber == null)) {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.ADD_BENEFICIARY)
                    .actionPerformed(false).success(false)
                    .message("Nu am putut identifica beneficiarul. Spune: 'adaugă beneficiar [Nume] cont [număr cont]'.")
                    .build();
        }

        try {
            CreateBeneficiaryRequest req = CreateBeneficiaryRequest.builder()
                    .userId(userId).nickname(name).officialName(name)
                    .targetAccountNumber(accountNumber != null ? accountNumber : "")
                    .phoneNumber(phoneNumber).build();

            BeneficiaryDto saved = beneficiaryService.createBeneficiary(req);

            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.ADD_BENEFICIARY).actionPerformed(true)
                    .actionConfirmation("Beneficiarul '" + name + "' a fost adăugat cu succes.")
                    .actionDetails("Beneficiary ID: " + saved.getBeneficiaryId())
                    .success(true).message("Beneficiarul '" + name + "' a fost adăugat!").build();
        } catch (Exception e) {
            log.error("Failed to add beneficiary via voice: {}", e.getMessage());
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT).intent(Intent.ADD_BENEFICIARY)
                    .actionPerformed(false).success(false)
                    .message("Nu s-a putut adăuga beneficiarul: " + e.getMessage()).build();
        }
    }

    private BigDecimal calculateConfidenceScore(String transcript, Intent intent) {
        Double modelScore = aiModelConfidenceScore.get();
        if (modelScore != null) return BigDecimal.valueOf(modelScore);
        if (intent == Intent.UNKNOWN) return new BigDecimal("0.30");
        return new BigDecimal("0.85");
    }

    private String extractBeneficiaryName(String transcript) {
        Pattern pattern = Pattern.compile("to\\s+([a-zA-Z]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(transcript);
        return matcher.find() ? matcher.group(1) : null;
    }

    private Map<String, Object> mergeEntities(Map<String, Object> aiModelEntities, String transcript) {
        Map<String, Object> regexEntities = extractEntities(transcript);

        if (aiModelEntities == null || aiModelEntities.isEmpty()) {
            return regexEntities != null ? regexEntities : new HashMap<>();
        }

        Map<String, Object> merged = new HashMap<>(regexEntities != null ? regexEntities : new HashMap<>());

        if (aiModelEntities.containsKey("BENEFICIAR")) {
            merged.put("beneficiary", aiModelEntities.get("BENEFICIAR").toString().trim());
        }
        if (aiModelEntities.containsKey("FACTURA")) {
            merged.put("factura", aiModelEntities.get("FACTURA").toString().trim().toLowerCase());
        }
        if (aiModelEntities.containsKey("SUMA")) {
            try {
                String sumaStr = aiModelEntities.get("SUMA").toString().trim();
                BigDecimal parsed = parseRomanianAmount(sumaStr);
                if (parsed != null) {
                    log.info("Romanian text-to-number: '{}' -> {}", sumaStr, parsed);
                    merged.put("amount", parsed);
                } else {
                    String numericStr = sumaStr.replaceAll("[^\\d.,]", "").replace(",", ".");
                    if (!numericStr.isEmpty()) {
                        BigDecimal numericParsed = new BigDecimal(numericStr);
                        log.info("Numeric fallback parse: '{}' -> {}", sumaStr, numericParsed);
                        merged.put("amount", numericParsed);
                    } else {
                        log.warn("Could not parse SUMA '{}' — not a recognized number or digit", sumaStr);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not parse SUMA '{}': {}", aiModelEntities.get("SUMA"), e.getMessage());
            }
        }
        if (aiModelEntities.containsKey("VALUTA")) {
            merged.put("currency", aiModelEntities.get("VALUTA").toString().trim().toUpperCase());
        }

        // Extract transfer description from transcript (after "pentru", "pt", etc.)
        String beneficiaryHint = merged.containsKey("beneficiary")
                ? String.valueOf(merged.get("beneficiary"))
                : null;
        String extractedDescription = extractTransferDescription(transcript, beneficiaryHint);
        if (extractedDescription != null && !extractedDescription.isBlank()) {
            merged.put("description", extractedDescription);
            log.info("Extracted transfer description: '{}'", extractedDescription);
        }

        log.info("Merged entities: AI={}, Regex={}, Final={}", aiModelEntities, regexEntities, merged);
        return merged;
    }

    private Map<String, Object> extractEntities(String transcript) {
        Map<String, Object> entities = new HashMap<>();

        Pattern amountPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(lei|ron|euro|eur)?", Pattern.CASE_INSENSITIVE);
        Matcher amountMatcher = amountPattern.matcher(transcript);
        if (amountMatcher.find()) {
            String potentialAmount = amountMatcher.group(1);
            if (potentialAmount.length() <= 8) {
                entities.put("amount", new BigDecimal(potentialAmount));
            }
        }

        Pattern phonePattern = Pattern.compile(
                "(?:phone:?\\s*|tel:?\\s*|telefon:?\\s*)?(\\+?\\d{1,3})?[\\s.-]?(\\d{3,4})[\\s.-]?(\\d{3})[\\s.-]?(\\d{3,4})",
                Pattern.CASE_INSENSITIVE);
        Matcher phoneMatcher = phonePattern.matcher(transcript);
        if (phoneMatcher.find()) {
            StringBuilder phoneNumber = new StringBuilder();
            if (phoneMatcher.group(1) != null) phoneNumber.append(phoneMatcher.group(1));
            phoneNumber.append(phoneMatcher.group(2));
            phoneNumber.append(phoneMatcher.group(3));
            phoneNumber.append(phoneMatcher.group(4));
            String fullPhone = phoneNumber.toString().replaceAll("\\s+", "");
            entities.put("phoneNumber", fullPhone);
            log.info("Extracted phone number: {}", fullPhone);
        }

        if (!entities.containsKey("phoneNumber")) {
            String beneficiaryName = extractBeneficiaryName(transcript);
            if (beneficiaryName != null) entities.put("beneficiary", beneficiaryName);
        }

        return entities;
    }

    /**
     * Generates name search candidates by stripping common Romanian genitive/dative suffixes.
     * e.g. "Mariei" -> ["Mariei", "Marie", "Maria", "Mari"], "lui Andrei" -> ["Andrei", "Andre"]
     */
    private List<String> generateNameCandidates(String name) {
        List<String> candidates = new ArrayList<>();
        // Strip "lui " or "lui" prefix (e.g. "lui Andrei")
        String cleaned = name.replaceAll("(?i)^lui\\s+", "").trim();
        candidates.add(cleaned);

        // Romanian genitive/dative endings to strip
        String[] suffixes = {"iei", "ei", "ii", "i"};
        for (String suffix : suffixes) {
            if (cleaned.toLowerCase().endsWith(suffix) && cleaned.length() > suffix.length() + 2) {
                String stem = cleaned.substring(0, cleaned.length() - suffix.length());
                candidates.add(stem + "a");  // e.g. "Mari" -> "Maria"
                candidates.add(stem + "e");  // e.g. "Mari" -> "Marie"
                candidates.add(stem);        // bare stem
            }
        }
        return candidates;
    }

    /**
     * Strips Romanian (and other) diacritics from a string.
     * e.g. "Nicolae Guță" -> "Nicolae Guta", "Ștefan" -> "Stefan"
     */
    private String normalizeDiacritics(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }

    /**
     * Converts Romanian text numbers to BigDecimal.
     * e.g. "o sută" -> 100, "două sute" -> 200, "cincizeci" -> 50, "o mie" -> 1000, "cinci" -> 5
     */
    private BigDecimal parseRomanianAmount(String input) {
        if (input == null || input.isBlank()) return null;

        if (input.matches(".*\\d.*")) {
            String numericStr = input.replaceAll("[^\\d.,]", "").replace(",", ".");
            try { return numericStr.isEmpty() ? null : new BigDecimal(numericStr); } catch (Exception e) { return null; }
        }

        String s = input.toLowerCase().trim();
        Map<String, Integer> units = new LinkedHashMap<>();
        units.put("zero", 0); units.put("unu", 1); units.put("una", 1); units.put("un", 1);
        units.put("o", 1); units.put("doua", 2); units.put("doi", 2);
        units.put("trei", 3); units.put("patru", 4); units.put("cinci", 5);
        units.put("sase", 6); units.put("sapte", 7);
        units.put("opt", 8); units.put("noua", 9);
        units.put("zece", 10); units.put("unsprezece", 11); units.put("doisprezece", 12);
        units.put("treisprezece", 13); units.put("paisprezece", 14); units.put("cincisprezece", 15);
        units.put("saisprezece", 16); units.put("saptesprezece", 17);
        units.put("optsprezece", 18); units.put("nouasprezece", 19); units.put("douazeci", 20);
        units.put("treizeci", 30); units.put("patruzeci", 40); units.put("cincizeci", 50);
        units.put("saizeci", 60); units.put("saptezeci", 70);
        units.put("optzeci", 80); units.put("nouazeci", 90);

        // Normalize diacritics first so "cinci" matches whether input has diacritics or not
        String normalized = normalizeDiacritics(s);

        // Quick check: if normalized input is a direct unit match, return it immediately
        if (units.containsKey(normalized)) {
            int val = units.get(normalized);
            return val > 0 ? new BigDecimal(val) : null;
        }

        int total = 0;
        int current = 0;

        String[] tokens = normalized.split("[\\s,]+");
        for (String token : tokens) {
            token = token.trim();
            if (token.isEmpty()) continue;
            if (token.equals("suta") || token.equals("sute")) {
                current = (current == 0 ? 1 : current) * 100;
            } else if (token.equals("mie") || token.equals("mii")) {
                current = (current == 0 ? 1 : current) * 1000;
                total += current;
                current = 0;
            } else if (units.containsKey(token)) {
                current += units.get(token);
            }
        }
        total += current;

        return total > 0 ? new BigDecimal(total) : null;
    }

    /**
     * Extract transfer description from transcript, including the marker word (e.g., "pentru", "pt")
     * e.g. "Trimite 100 lei lui Ion pentru bere" -> "pentru bere"
     */
    private String extractTransferDescription(String transcript, String beneficiaryHint) {
        if (transcript == null || transcript.isBlank()) return null;

        String t = transcript.trim();

        // Prefer common Romanian markers for transfer description (keep the marker word)
        Pattern markerPattern = Pattern.compile("(?i)\\b(pentru|pt\\.?|descriere|cu descriere)\\b\\s+(.+)$");
        Matcher markerMatcher = markerPattern.matcher(t);
        if (markerMatcher.find()) {
            String marker = markerMatcher.group(1).trim();
            String desc = markerMatcher.group(2).trim();
            String fullDesc = marker + " " + desc;
            return sanitizeDescription(fullDesc);
        }

        // Fallback: text after beneficiary hint
        if (beneficiaryHint != null && !beneficiaryHint.isBlank()) {
            int idx = indexOfNormalized(t, beneficiaryHint);
            if (idx >= 0) {
                int start = idx + beneficiaryHint.length();
                if (start < t.length()) {
                    String tail = t.substring(start).trim();
                    if (!tail.isBlank() && tail.length() >= 3) {
                        return sanitizeDescription(tail);
                    }
                }
            }
        }

        return null;
    }

    private String sanitizeDescription(String desc) {
        if (desc == null) return null;
        String cleaned = desc.replaceAll("\\s+", " ").trim();
        if (cleaned.isBlank()) return null;
        if (cleaned.length() > 140) cleaned = cleaned.substring(0, 140);
        return cleaned;
    }

    private int indexOfNormalized(String text, String needle) {
        String nt = normalizeDiacritics(text).toLowerCase();
        String nn = normalizeDiacritics(needle).toLowerCase();
        return nt.indexOf(nn);
    }

    /**
     * Rank contacts by similarity to beneficiary name (fuzzy matching fallback for typos).
     * e.g. "Pogdan" matches "Bogdan" with score ~0.92
     */
    private List<ContactLiteDto> rankContactsBySimilarity(
            List<ContactLiteDto> contacts,
            String beneficiaryName,
            double minScore,
            int maxResults
    ) {
        if (contacts == null || contacts.isEmpty() || beneficiaryName == null || beneficiaryName.isBlank()) {
            return Collections.emptyList();
        }

        String target = normalizeNameForMatch(beneficiaryName);

        List<Map.Entry<ContactLiteDto, Double>> scored = new ArrayList<>();
        for (ContactLiteDto c : contacts) {
            String name = c.getName();
            if (name == null || name.isBlank()) continue;
            double score = nameSimilarity(normalizeNameForMatch(name), target);
            if (score >= minScore) {
                scored.add(new AbstractMap.SimpleEntry<>(c, score));
            }
        }

        scored.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<ContactLiteDto> result = new ArrayList<>();
        for (Map.Entry<ContactLiteDto, Double> entry : scored) {
            result.add(entry.getKey());
            if (result.size() >= maxResults) break;
        }
        return result;
    }

    private String normalizeNameForMatch(String input) {
        if (input == null) return "";
        return normalizeDiacritics(input)
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private double nameSimilarity(String a, String b) {
        if (a.equals(b)) return 1.0;
        int dist = levenshteinDistance(a, b);
        int maxLen = Math.max(a.length(), b.length());
        if (maxLen == 0) return 1.0;
        return 1.0 - ((double) dist / (double) maxLen);
    }

    /**
     * Compute Levenshtein distance between two strings for typo tolerance.
     */
    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];

        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[a.length()][b.length()];
    }

}
