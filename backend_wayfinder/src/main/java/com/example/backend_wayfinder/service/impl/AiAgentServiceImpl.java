package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.enums.AiMode;
import com.example.backend_wayfinder.enums.Intent;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AiAgentServiceImpl implements AiAgentService {

    private final UserRepository userRepository;
    private final VoiceAuthenticationService voiceAuthenticationService;
    private final TransactionService transactionService;
    private final AccountService accountService;
    private final BeneficiaryService beneficiaryService;
    private final AiInteractionLogService aiInteractionLogService;

    @Override
    public VoiceCommandResponse processVoiceCommand(VoiceCommandRequest request) {
        log.info("Processing voice command for user ID: {} in {} mode",
                request.getUserId(), request.getAiMode());

        // Verify user exists
        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Voice authentication if enabled
        if (user.getIsVoiceAuthEnabled() && request.getVoiceFingerprint() != null) {
            boolean isVoiceValid = voiceAuthenticationService.verifyVoice(
                    request.getVoiceFingerprint(),
                    user.getVoiceFingerprint()
            );
            if (!isVoiceValid) {
                log.error("Voice authentication failed for user ID: {}", user.getUserId());
                return VoiceCommandResponse.builder()
                        .success(false)
                        .message("Voice authentication failed")
                        .build();
            }
        }

        // Detect intent from voice transcript
        Intent intent = detectIntent(request.getVoiceCommandTranscript());
        BigDecimal confidenceScore = calculateConfidenceScore(request.getVoiceCommandTranscript(), intent);

        // NEW: Extract entities from transcript
        Map<String, Object> extractedEntities = extractEntities(request.getVoiceCommandTranscript());

        VoiceCommandResponse response;

        // Process based on AI mode
        if (request.getAiMode() == AiMode.GUIDE) {
            // GUIDE mode: Provide instructions with structured steps
            response = handleGuideMode(intent, confidenceScore, extractedEntities);
        } else {
            // AGENT mode: Execute action
            response = executeAction(
                    request.getUserId(),
                    intent,
                    request.getVoiceCommandTranscript(),
                    request.getVoiceFingerprint()
            );
        }

        // Log the interaction
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
    }

    @Override
    public Intent detectIntent(String voiceTranscript) {
        // TODO: Integrate with DeBERTa model hosted on Modal
        // For now, using simple keyword matching

        String transcript = voiceTranscript.toLowerCase();

        // Transfer money intents
        if (transcript.contains("transfer") || transcript.contains("send money") ||
            transcript.contains("pay") || transcript.contains("send")) {
            return Intent.TRANSFER_MONEY;
        }

        // Check balance intents
        if (transcript.contains("balance") || transcript.contains("how much")) {
            return Intent.CHECK_BALANCE;
        }

        // View transactions
        if (transcript.contains("transaction") || transcript.contains("history") ||
            transcript.contains("recent payments")) {
            return Intent.VIEW_TRANSACTIONS;
        }

        // Beneficiary management
        if (transcript.contains("add beneficiary") || transcript.contains("save contact")) {
            return Intent.ADD_BENEFICIARY;
        }
        if (transcript.contains("show beneficiaries") || transcript.contains("list contacts")) {
            return Intent.VIEW_BENEFICIARIES;
        }

        // Help intents
        if (transcript.contains("help transfer") || transcript.contains("how to transfer")) {
            return Intent.HELP_TRANSFER;
        }
        if (transcript.contains("help")) {
            return Intent.HELP_GENERAL;
        }

        // Account management
        if (transcript.contains("show accounts") || transcript.contains("my accounts")) {
            return Intent.VIEW_ACCOUNTS;
        }

        return Intent.UNKNOWN;
    }

    @Override
    public String getGuidanceForIntent(Intent intent) {
        switch (intent) {
            case TRANSFER_MONEY:
                return "To transfer money, say: 'Transfer [amount] to [beneficiary name]'. " +
                       "Make sure you have added the beneficiary first and have sufficient balance.";

            case CHECK_BALANCE:
                return "To check your balance, I can show you the balance of all your accounts. " +
                       "You can also ask for a specific account balance.";

            case VIEW_TRANSACTIONS:
                return "To view your transactions, I can show you recent transactions or " +
                       "transactions within a specific date range.";

            case ADD_BENEFICIARY:
                return "To add a beneficiary, say: 'Add beneficiary [name] with account number [number]'. " +
                       "This will save the contact for future transfers.";

            case VIEW_BENEFICIARIES:
                return "I can show you all your saved beneficiaries. " +
                       "This helps you quickly transfer money to people you send money to often.";

            case VIEW_ACCOUNTS:
                return "I can show you all your accounts including their balances and status.";

            case HELP_TRANSFER:
                return "Transfers allow you to send money to other accounts. " +
                       "You can transfer to saved beneficiaries or new account numbers. " +
                       "The system will verify your voice before processing transfers.";

            case HELP_GENERAL:
                return "I can help you with: checking balance, viewing transactions, " +
                       "transferring money, managing beneficiaries, and viewing your accounts. " +
                       "You can switch me to AGENT mode to perform actions automatically, " +
                       "or keep me in GUIDE mode for instructions.";

            default:
                return "I'm not sure what you're asking. Try saying things like: " +
                       "'check balance', 'transfer money', 'show transactions', or ask for 'help'.";
        }
    }

    @Override
    public VoiceCommandResponse executeAction(UUID userId, Intent intent, String voiceTranscript, List<Double> voiceFingerprint) {
        log.info("Executing action for intent: {} for user ID: {}", intent, userId);

        try {
            switch (intent) {
                case TRANSFER_MONEY:
                    return executeTransfer(userId, voiceTranscript, voiceFingerprint);

                case CHECK_BALANCE:
                    return executeCheckBalance(userId);

                case VIEW_TRANSACTIONS:
                    return executeViewTransactions(userId);

                case VIEW_ACCOUNTS:
                    return executeViewAccounts(userId);

                case VIEW_BENEFICIARIES:
                    return executeViewBeneficiaries(userId);

                case ADD_BENEFICIARY:
                    return executeAddBeneficiary(userId, voiceTranscript);

                default:
                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT)
                            .intent(intent)
                            .actionPerformed(false)
                            .success(false)
                            .message("I cannot perform this action. " + getGuidanceForIntent(intent))
                            .build();
            }
        } catch (Exception e) {
            log.error("Error executing action for intent: {}", intent, e);
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT)
                    .intent(intent)
                    .actionPerformed(false)
                    .success(false)
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

    // Private helper methods

    private VoiceCommandResponse handleGuideMode(Intent intent, BigDecimal confidenceScore, Map<String, Object> entities) {
        String guidance = getGuidanceForIntent(intent);
        List<GuidanceStep> guidanceSteps = buildGuidanceSteps(intent, entities);

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.GUIDE)
                .intent(intent)
                .confidenceScore(confidenceScore)
                .guidanceMessage(guidance)
                .guidanceSteps(guidanceSteps)
                .extractedEntities(entities)
                .navigateToScreen(getNavigationScreen(intent))
                .highlightButtonId(getFirstButtonToHighlight(intent))
                .actionPerformed(false)
                .message(guidance)
                .success(true)
                .build();
    }

    private List<GuidanceStep> buildGuidanceSteps(Intent intent, Map<String, Object> entities) {
        List<GuidanceStep> steps = new ArrayList<>();

        switch (intent) {
            case TRANSFER_MONEY:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Apasă butonul 'Transfer'")
                        .elementId("nav-transfer-button")
                        .screenName("home")
                        .icon("send")
                        .completed(false)
                        .build());

                String beneficiary = entities != null && entities.containsKey("beneficiary")
                    ? (String) entities.get("beneficiary")
                    : "[beneficiar]";

                steps.add(GuidanceStep.builder()
                        .stepNumber(2)
                        .instruction("Selectează beneficiarul: " + beneficiary)
                        .elementId("beneficiary-selector")
                        .screenName("transfer")
                        .expectedValue(beneficiary)
                        .icon("person")
                        .completed(false)
                        .build());

                String amount = entities != null && entities.containsKey("amount")
                    ? entities.get("amount").toString()
                    : "[suma]";

                steps.add(GuidanceStep.builder()
                        .stepNumber(3)
                        .instruction("Introdu suma: " + amount + " RON")
                        .elementId("amount-input")
                        .screenName("transfer")
                        .expectedValue(amount)
                        .icon("attach_money")
                        .completed(false)
                        .build());

                steps.add(GuidanceStep.builder()
                        .stepNumber(4)
                        .instruction("Apasă 'Confirmă'")
                        .elementId("confirm-button")
                        .screenName("transfer")
                        .icon("check_circle")
                        .completed(false)
                        .build());
                break;

            case CHECK_BALANCE:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Soldul tău este afișat pe ecranul principal")
                        .elementId("balance-card")
                        .screenName("dashboard")
                        .icon("account_balance")
                        .completed(false)
                        .build());
                break;

            case VIEW_TRANSACTIONS:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Apasă butonul 'Tranzacții'")
                        .elementId("nav-transactions-button")
                        .screenName("home")
                        .icon("receipt")
                        .completed(false)
                        .build());

                steps.add(GuidanceStep.builder()
                        .stepNumber(2)
                        .instruction("Vezi lista ta de tranzacții")
                        .elementId("transactions-list")
                        .screenName("transactions")
                        .icon("list")
                        .completed(false)
                        .build());
                break;

            case ADD_BENEFICIARY:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Apasă butonul 'Beneficiari'")
                        .elementId("nav-beneficiaries-button")
                        .screenName("home")
                        .icon("people")
                        .completed(false)
                        .build());

                steps.add(GuidanceStep.builder()
                        .stepNumber(2)
                        .instruction("Apasă '+' pentru a adăuga beneficiar")
                        .elementId("add-beneficiary-button")
                        .screenName("beneficiaries")
                        .icon("add")
                        .completed(false)
                        .build());

                steps.add(GuidanceStep.builder()
                        .stepNumber(3)
                        .instruction("Introdu numele și contul beneficiarului")
                        .elementId("beneficiary-form")
                        .screenName("add-beneficiary")
                        .icon("edit")
                        .completed(false)
                        .build());
                break;

            case VIEW_BENEFICIARIES:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Apasă butonul 'Beneficiari'")
                        .elementId("nav-beneficiaries-button")
                        .screenName("home")
                        .icon("people")
                        .completed(false)
                        .build());
                break;

            case VIEW_ACCOUNTS:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Apasă butonul 'Conturi'")
                        .elementId("nav-accounts-button")
                        .screenName("home")
                        .icon("account_balance_wallet")
                        .completed(false)
                        .build());
                break;

            default:
                steps.add(GuidanceStep.builder()
                        .stepNumber(1)
                        .instruction("Încearcă să spui o comandă validă")
                        .elementId("voice-button")
                        .screenName("home")
                        .icon("mic")
                        .completed(false)
                        .build());
                break;
        }

        return steps;
    }

    private String getNavigationScreen(Intent intent) {
        switch (intent) {
            case TRANSFER_MONEY: return "transfer";
            case CHECK_BALANCE: return "dashboard";
            case VIEW_TRANSACTIONS: return "transactions";
            case ADD_BENEFICIARY: return "add-beneficiary";
            case VIEW_BENEFICIARIES: return "beneficiaries";
            case VIEW_ACCOUNTS: return "accounts";
            default: return "dashboard";
        }
    }

    private String getFirstButtonToHighlight(Intent intent) {
        switch (intent) {
            case TRANSFER_MONEY: return "nav-transfer-button";
            case CHECK_BALANCE: return "balance-card";
            case VIEW_TRANSACTIONS: return "nav-transactions-button";
            case ADD_BENEFICIARY: return "nav-beneficiaries-button";
            case VIEW_BENEFICIARIES: return "nav-beneficiaries-button";
            case VIEW_ACCOUNTS: return "nav-accounts-button";
            default: return null;
        }
    }

    private VoiceCommandResponse executeTransfer(UUID userId, String transcript, List<Double> voiceFingerprint) {
        // Extract transfer details from transcript
        Map<String, Object> entities = extractEntities(transcript);

        // Check for amount
        if (!entities.containsKey("amount")) {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT)
                    .intent(Intent.TRANSFER_MONEY)
                    .actionPerformed(false)
                    .success(false)
                    .message("Could not detect amount. Please specify how much you want to transfer.")
                    .build();
        }

        BigDecimal amount = (BigDecimal) entities.get("amount");

        // Get user's first active account
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
        AccountDto sourceAccount = accounts.stream()
                .filter(AccountDto::getIsActive)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active account found"));

        BeneficiaryDto beneficiary;
        String recipientIdentifier;

        // NEW: Check if transfer is to phone number
        if (entities.containsKey("phoneNumber")) {
            String phoneNumber = (String) entities.get("phoneNumber");
            log.info("Attempting transfer to phone number: {}", phoneNumber);
            recipientIdentifier = phoneNumber;

            try {
                // Try to find beneficiary by phone
                beneficiary = beneficiaryService.getBeneficiaryByPhoneNumber(userId, phoneNumber);
                log.info("Found beneficiary with phone: {}", phoneNumber);
            } catch (Exception e) {
                // Beneficiary not found, try to find user by phone
                try {
                    UserEntity recipientUser = userRepository.findByPhoneNumber(phoneNumber)
                            .orElseThrow(() -> new RuntimeException("No user found with phone number: " + phoneNumber));

                    // Get recipient's active account
                    List<AccountDto> recipientAccounts = accountService.getAccountsByUserId(recipientUser.getUserId());
                    AccountDto recipientAccount = recipientAccounts.stream()
                            .filter(AccountDto::getIsActive)
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("Recipient has no active account"));

                    // Create temporary beneficiary representation
                    beneficiary = BeneficiaryDto.builder()
                            .targetAccountNumber(recipientAccount.getAccountNumber())
                            .nickname(recipientUser.getFullName())
                            .build();

                    log.info("Found user with phone {}: {}", phoneNumber, recipientUser.getFullName());
                } catch (Exception ex) {
                    return VoiceCommandResponse.builder()
                            .aiMode(AiMode.AGENT)
                            .intent(Intent.TRANSFER_MONEY)
                            .actionPerformed(false)
                            .success(false)
                            .message("Could not find user or beneficiary with phone number: " + phoneNumber)
                            .build();
                }
            }
        }
        // Original: Transfer by beneficiary name
        else if (entities.containsKey("beneficiary")) {
            String beneficiaryName = (String) entities.get("beneficiary");
            recipientIdentifier = beneficiaryName;

            try {
                beneficiary = beneficiaryService.getBeneficiaryByNickname(userId, beneficiaryName);
            } catch (Exception e) {
                return VoiceCommandResponse.builder()
                        .aiMode(AiMode.AGENT)
                        .intent(Intent.TRANSFER_MONEY)
                        .actionPerformed(false)
                        .success(false)
                        .message("Beneficiary '" + beneficiaryName + "' not found. Please add them first.")
                        .build();
            }
        } else {
            return VoiceCommandResponse.builder()
                    .aiMode(AiMode.AGENT)
                    .intent(Intent.TRANSFER_MONEY)
                    .actionPerformed(false)
                    .success(false)
                    .message("Could not detect recipient. Please specify a beneficiary name or phone number.")
                    .build();
        }

        // Create transaction
        CreateTransactionRequest transactionRequest = CreateTransactionRequest.builder()
                .sourceAccountId(sourceAccount.getAccountId())
                .destinationAccountNumber(beneficiary.getTargetAccountNumber())
                .amount(amount)
                .currency("RON")
                .description("Voice command transfer to " + recipientIdentifier)
                .initiatedBy("AI")
                .currentVoiceFingerprint(voiceFingerprint)
                .build();

        TransactionDto transaction = transactionService.createTransaction(transactionRequest);

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.TRANSFER_MONEY)
                .actionPerformed(true)
                .actionConfirmation("Successfully transferred " + amount + " RON to " + recipientIdentifier)
                .actionDetails("Transaction ID: " + transaction.getId())
                .transactionId(transaction.getId())
                .success(true)
                .message("Transfer completed!")
                .build();
    }

    private VoiceCommandResponse executeCheckBalance(UUID userId) {
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);

        StringBuilder message = new StringBuilder("Your account balances:\n");
        for (AccountDto account : accounts) {
            message.append("Account ")
                   .append(account.getAccountNumber())
                   .append(": ")
                   .append(account.getBalance())
                   .append(" ")
                   .append(account.getCurrency())
                   .append("\n");
        }

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.CHECK_BALANCE)
                .actionPerformed(true)
                .actionDetails("Retrieved " + accounts.size() + " accounts")
                .message(message.toString())
                .success(true)
                .build();
    }

    private VoiceCommandResponse executeViewTransactions(UUID userId) {
        List<TransactionDto> transactions = transactionService.getTransactionsByUserId(userId);

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.VIEW_TRANSACTIONS)
                .actionPerformed(true)
                .actionDetails("Retrieved " + transactions.size() + " transactions")
                .message("Found " + transactions.size() + " transactions. Check the app for details.")
                .success(true)
                .build();
    }

    private VoiceCommandResponse executeViewAccounts(UUID userId) {
        List<AccountDto> accounts = accountService.getAccountsByUserId(userId);

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.VIEW_ACCOUNTS)
                .actionPerformed(true)
                .actionDetails("Retrieved " + accounts.size() + " accounts")
                .message("You have " + accounts.size() + " accounts. Check the app for details.")
                .success(true)
                .build();
    }

    private VoiceCommandResponse executeViewBeneficiaries(UUID userId) {
        List<BeneficiaryDto> beneficiaries = beneficiaryService.getBeneficiariesByUserId(userId);

        StringBuilder message = new StringBuilder("Your beneficiaries:\n");
        for (BeneficiaryDto ben : beneficiaries) {
            message.append("- ").append(ben.getNickname()).append("\n");
        }

        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.VIEW_BENEFICIARIES)
                .actionPerformed(true)
                .actionDetails("Retrieved " + beneficiaries.size() + " beneficiaries")
                .message(message.toString())
                .success(true)
                .build();
    }

    private VoiceCommandResponse executeAddBeneficiary(UUID userId, String transcript) {
        // TODO: Extract beneficiary details using NER
        return VoiceCommandResponse.builder()
                .aiMode(AiMode.AGENT)
                .intent(Intent.ADD_BENEFICIARY)
                .actionPerformed(false)
                .success(false)
                .message("Adding beneficiaries via voice is not yet fully implemented. Please use the app.")
                .build();
    }

    private BigDecimal calculateConfidenceScore(String transcript, Intent intent) {
        // TODO: Get actual confidence score from DeBERTa model
        // For now, return a placeholder based on intent detection
        if (intent == Intent.UNKNOWN) {
            return new BigDecimal("0.30");
        }
        return new BigDecimal("0.85");
    }

    private String extractBeneficiaryName(String transcript) {
        // Simple extraction - looks for "to [name]"
        Pattern pattern = Pattern.compile("to\\s+([a-zA-Z]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(transcript);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return null;
    }

    private Map<String, Object> extractEntities(String transcript) {
        Map<String, Object> entities = new HashMap<>();

        // Extract amount
        Pattern amountPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(lei|ron|euro|eur)?", Pattern.CASE_INSENSITIVE);
        Matcher amountMatcher = amountPattern.matcher(transcript);
        if (amountMatcher.find()) {
            // Skip if it's a phone number (more than 4 digits without spaces)
            String potentialAmount = amountMatcher.group(1);
            if (potentialAmount.length() <= 8) { // Amounts are typically not this long
                entities.put("amount", new BigDecimal(potentialAmount));
            }
        }

        // NEW: Extract phone number (various formats)
        // Matches: +40723456789, 0723456789, 0723 456 789, +40 723 456 789
        Pattern phonePattern = Pattern.compile("(?:phone:?\\s*|tel:?\\s*|telefon:?\\s*)?(\\+?\\d{1,3})?[\\s.-]?(\\d{3,4})[\\s.-]?(\\d{3})[\\s.-]?(\\d{3,4})", Pattern.CASE_INSENSITIVE);
        Matcher phoneMatcher = phonePattern.matcher(transcript);
        if (phoneMatcher.find()) {
            // Reconstruct full phone number
            StringBuilder phoneNumber = new StringBuilder();
            if (phoneMatcher.group(1) != null) {
                phoneNumber.append(phoneMatcher.group(1)); // Country code
            }
            phoneNumber.append(phoneMatcher.group(2)); // First part
            phoneNumber.append(phoneMatcher.group(3)); // Middle part
            phoneNumber.append(phoneMatcher.group(4)); // Last part

            String fullPhone = phoneNumber.toString().replaceAll("\\s+", "");
            entities.put("phoneNumber", fullPhone);
            log.info("Extracted phone number: {}", fullPhone);
        }

        // Extract beneficiary name (simplified)
        // Only extract if no phone number was found
        if (!entities.containsKey("phoneNumber")) {
            String beneficiaryName = extractBeneficiaryName(transcript);
            if (beneficiaryName != null) {
                entities.put("beneficiary", beneficiaryName);
            }
        }

        return entities;
    }
}
