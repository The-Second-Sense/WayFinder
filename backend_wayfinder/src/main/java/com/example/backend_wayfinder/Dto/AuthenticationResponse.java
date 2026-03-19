package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthenticationResponse {

    private boolean success;
    private String message;
    private String accessToken;
    private String refreshToken;
    private UserDto user;
    private List<AccountDto> accounts;
    private boolean requiresMfa;
}
