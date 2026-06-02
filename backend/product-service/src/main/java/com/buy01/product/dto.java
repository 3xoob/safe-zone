package com.buy01.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

record ProductRequest(@NotBlank String name, @NotBlank String description, @NotNull @DecimalMin(value = "0.0", inclusive = false) Double price, @NotNull @Min(0) Integer quantity, List<String> imageUrls) {}
record ProductResponse(String id, String name, String description, Double price, Integer quantity, String userId, List<String> imageUrls, Instant createdAt, Instant updatedAt) {}
