package com.buy01.media;

import java.time.Instant;
import java.util.List;

record MediaResponse(String id, String imageUrl, String imagePath, String productId, String sellerId, String contentType, Long size, Instant createdAt) {}
record ProductResponse(String id, String name, String description, Double price, Integer quantity, String userId, List<String> imageUrls, Instant createdAt, Instant updatedAt) {}
record ProductRequest(String name, String description, Double price, Integer quantity, List<String> imageUrls) {}
