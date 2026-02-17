package com.example.backend_wayfinder.exception;

import lombok.Getter;

@Getter
public class AiServiceException extends RuntimeException {
    private final String serviceName;
    private final boolean isRetryable;

    public AiServiceException(String serviceName, String message, boolean isRetryable) {
        super(message);
        this.serviceName = serviceName;
        this.isRetryable = isRetryable;
    }

    public AiServiceException(String serviceName, String message, Throwable cause, boolean isRetryable) {
        super(message, cause);
        this.serviceName = serviceName;
        this.isRetryable = isRetryable;
    }
}

