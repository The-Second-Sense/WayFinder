package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal contact sent from frontend phonebook.
 * Never stored permanently — used only for voice command beneficiary resolution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactLiteDto {

    /** Display name as it appears in phonebook */
    private String name;

    /** Phone number, best-effort E.164 e.g. +40740111222 */
    private String phone;
}

