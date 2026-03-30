package com.example.backend_wayfinder.service.impl;

import com.example.backend_wayfinder.Dto.ContactLiteDto;
import com.example.backend_wayfinder.service.ContactCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactCacheServiceImpl implements ContactCacheService {

    private final CacheManager cacheManager;

    private static final String CACHE_NAME = "contacts";
    private static final int MAX_CONTACTS = 2000;
    private static final int MAX_RESULTS = 5;

    @Override
    public void storeContacts(UUID userId, List<ContactLiteDto> contacts) {
        if (contacts == null || contacts.isEmpty()) {
            log.debug("No contacts to cache for user {}", userId);
            return;
        }

        // ✅ NEW: Deduplicate contacts - keep only 1 instance per unique contact
        // This prevents "Bogdan de la Aiud" from appearing multiple times in cache
        Map<String, ContactLiteDto> deduped = new LinkedHashMap<>();
        for (ContactLiteDto contact : contacts) {
            String key = normalize(contact.getName()) + "|" + contact.getPhone();

            // If contact already exists, just refresh (keep first occurrence)
            // If new contact, add it
            deduped.putIfAbsent(key, contact);
        }

        List<ContactLiteDto> dedupedList = new ArrayList<>(deduped.values());

        List<ContactLiteDto> trimmed = dedupedList.size() > MAX_CONTACTS
                ? dedupedList.subList(0, MAX_CONTACTS)
                : dedupedList;

        Cache cache = getCache();
        cache.put(userId.toString(), new ArrayList<>(trimmed));
        log.info("Cached {} unique contacts for user {} (deduped from {} total)",
                 trimmed.size(), userId, contacts.size());
    }

    @Override
    public List<ContactLiteDto> getContacts(UUID userId) {
        Cache cache = getCache();
        Cache.ValueWrapper wrapper = cache.get(userId.toString());
        if (wrapper == null) return Collections.emptyList();

        @SuppressWarnings("unchecked")
        List<ContactLiteDto> contacts = (List<ContactLiteDto>) wrapper.get();
        return contacts != null ? contacts : Collections.emptyList();
    }

    @Override
    public List<ContactLiteDto> findByName(UUID userId, String nameHint) {
        if (nameHint == null || nameHint.isBlank()) return Collections.emptyList();

        List<ContactLiteDto> contacts = getContacts(userId);
        if (contacts.isEmpty()) {
            log.debug("No cached contacts for user {} — cannot resolve '{}'", userId, nameHint);
            return Collections.emptyList();
        }

        String hint = normalize(nameHint);

        // ✅ Check if full name (2+ words)
        boolean isFullName = nameHint.trim().split("\\s+").length >= 2;

        // 1. Exact match
        List<ContactLiteDto> exact = contacts.stream()
                .filter(c -> normalize(c.getName()).equals(hint))
                .collect(Collectors.toList());
        if (!exact.isEmpty()) return exact.subList(0, Math.min(exact.size(), MAX_RESULTS));

        // 2. Starts-with match
        List<ContactLiteDto> startsWith = contacts.stream()
                .filter(c -> normalize(c.getName()).startsWith(hint))
                .collect(Collectors.toList());
        if (!startsWith.isEmpty()) return startsWith.subList(0, Math.min(startsWith.size(), MAX_RESULTS));

        if (isFullName) {
            log.debug("Full name '{}' not found in contacts (exact or starts-with). No fuzzy matching for full names.", nameHint);
            return Collections.emptyList();
        }

        // 3. Contains match (fuzzy) - ONLY for single names
        String[] hintWords = hint.split("\\s+");
        List<ContactLiteDto> contains = contacts.stream()
                .filter(c -> {
                    String normName = normalize(c.getName());
                    return Arrays.stream(hintWords)
                            .filter(w -> w.length() >= 3)
                            .anyMatch(normName::contains);
                })
                .collect(Collectors.toList());

        return contains.subList(0, Math.min(contains.size(), MAX_RESULTS));
    }

    private Cache getCache() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) throw new IllegalStateException("Cache 'contacts' not found");
        return cache;
    }

    /**
     * Lowercase + strip diacritics (ă→a, î→i, â→a, ș→s, ț→t etc.)
     */
    private String normalize(String input) {
        if (input == null) return "";
        String nfd = Normalizer.normalize(input.toLowerCase(), Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}", "").trim();
    }
}

