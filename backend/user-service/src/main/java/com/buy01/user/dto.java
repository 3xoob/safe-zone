package com.buy01.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

record RegisterRequest(@NotBlank String name, @Email @NotBlank String email, @Size(min = 6) String password, @NotNull Role role) {}
record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
record UpdateProfileRequest(@NotBlank String name) {}
record UserResponse(String id, String name, String email, Role role, String avatar) {}
record AuthResponse(String token, UserResponse user) {}
