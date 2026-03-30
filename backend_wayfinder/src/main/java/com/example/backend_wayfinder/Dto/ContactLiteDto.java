package com.example.backend_wayfinder.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal contact sent from frontend phonebook.
 * Never stored permanently — used only for voice command beneficiary resolution.
 *
 * Validation ensures:
 * - Name is not empty (prevents null pointer exceptions)
 * - Phone is in E.164 format (prevents invalid DB queries)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactLiteDto {

    /** Display name as it appears in phonebook */
    @NotBlank(message = "Contactul trebuie să aibă o denumire")
    private String name;

    /** Phone number in E.164 format e.g. +40740111222 */
    @NotBlank(message = "Contactul trebuie să aibă un număr de telefon")
    @Pattern(regexp = "^\\+\\d{1,3}\\d{4,14}$",
             message = "Format telefon invalid (E.164 necesar, ex: +40740111222)")
    private String phone;

    /**
     * Validate if this contact is safe for voice command processing
     */
    public boolean isValidForVoiceCommand() {
        return name != null && !name.trim().isEmpty() &&
               phone != null && phone.matches("^\\+\\d{1,3}\\d{4,14}$");
    }
}
