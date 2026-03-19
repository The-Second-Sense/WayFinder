package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.ContactLiteDto;

import java.util.List;
import java.util.UUID;

public interface ContactCacheService {

    /**
     * Store (or refresh) the contact list for a user.
     * Replaces any previously cached snapshot.
     *
     * @param userId   owner of the contacts
     * @param contacts list sent from frontend (name + phone, max 2000)
     */
    void storeContacts(UUID userId, List<ContactLiteDto> contacts);

    /**
     * Retrieve the cached contacts for a user.
     * Returns an empty list if the cache has expired or was never populated.
     *
     * @param userId owner of the contacts
     * @return cached contacts or empty list
     */
    List<ContactLiteDto> getContacts(UUID userId);

    /**
     * Find the best-matching contact(s) for a given name fragment.
     * Searches: exact match → starts-with → contains (all case-insensitive, diacritics-stripped).
     *
     * @param userId   owner
     * @param nameHint beneficiary name extracted from voice transcript
     * @return ordered list of candidates (best match first, max 5)
     */
    List<ContactLiteDto> findByName(UUID userId, String nameHint);
}

