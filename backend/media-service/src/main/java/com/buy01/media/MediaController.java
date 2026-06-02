package com.buy01.media;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@RestController
@RequestMapping("/media")
public class MediaController {
    private static final long MAX_SIZE = 2L * 1024L * 1024L;
    private final MediaRepository mediaRepository;
    private final Path uploadDir;
    private final RestClient productClient;

    public MediaController(MediaRepository mediaRepository, @Value("${app.upload-dir}") String uploadDir, @Value("${app.product-service-url}") String productServiceUrl) throws IOException {
        this.mediaRepository = mediaRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.productClient = RestClient.builder().baseUrl(productServiceUrl).build();
        Files.createDirectories(this.uploadDir);
    }

    @GetMapping
    List<MediaResponse> mine(@RequestHeader("X-User-Id") String sellerId, @RequestHeader("X-User-Role") String role) {
        requireSeller(role);
        return mediaRepository.findBySellerId(sellerId).stream().map(this::toResponse).toList();
    }

    @PostMapping("/images")
    @ResponseStatus(HttpStatus.CREATED)
    MediaResponse upload(@RequestHeader("X-User-Id") String sellerId,
                         @RequestHeader("X-User-Role") String role,
                         @RequestParam("productId") String productId,
                         @RequestParam("file") MultipartFile file) throws IOException {
        requireSeller(role);
        validate(file);
        ProductResponse product = fetchOwnedProduct(productId, sellerId);
        String extension = extension(file.getOriginalFilename(), file.getContentType());
        String filename = UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(filename).normalize();
        file.transferTo(target);

        Media media = new Media();
        media.setImagePath(target.toString());
        media.setProductId(productId);
        media.setSellerId(sellerId);
        media.setContentType(file.getContentType());
        media.setSize(file.getSize());
        media.setCreatedAt(Instant.now());
        Media saved = mediaRepository.save(media);
        MediaResponse response = toResponse(saved);
        attachImageToProduct(product, response.imageUrl(), sellerId, role);
        return response;
    }

    @GetMapping("/images/{id}")
    ResponseEntity<Resource> image(@PathVariable("id") String id) throws IOException {
        Media media = find(id);
        Path path = Paths.get(media.getImagePath()).normalize();
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Image file not found");
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(media.getContentType()))
            .cacheControl(CacheControl.noCache())
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
            .body(resource);
    }

    @DeleteMapping("/images/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable("id") String id, @RequestHeader("X-User-Id") String sellerId, @RequestHeader("X-User-Role") String role) throws IOException {
        requireSeller(role);
        Media media = find(id);
        if (!media.getSellerId().equals(sellerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only delete your own media");
        }
        Files.deleteIfExists(Paths.get(media.getImagePath()).normalize());
        mediaRepository.delete(media);
    }

    private void validate(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be 2 MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }
        byte[] bytes = file.getBytes();
        if (!hasImageSignature(bytes)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File content is not a supported image");
        }
    }

    private boolean hasImageSignature(byte[] bytes) {
        if (bytes.length < 4) return false;
        boolean png = bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        boolean jpg = bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8;
        boolean gif = bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46;
        boolean webp = bytes.length > 12 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;
        return png || jpg || gif || webp;
    }

    private String extension(String originalName, String contentType) {
        if (originalName != null && originalName.contains(".")) {
            String candidate = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
            if (candidate.matches("\\.(png|jpg|jpeg|gif|webp)")) return candidate;
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private Media find(String id) {
        return mediaRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Media not found"));
    }

    private void requireSeller(String role) {
        if (!"SELLER".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seller role is required");
        }
    }

    private ProductResponse fetchOwnedProduct(String productId, String sellerId) {
        try {
            ProductResponse product = productClient.get().uri("/products/{id}", productId).retrieve().body(ProductResponse.class);
            if (product == null) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
            }
            if (!sellerId.equals(product.userId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You can only upload media for your own products");
            }
            return product;
        } catch (ApiException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
    }

    private void attachImageToProduct(ProductResponse product, String imageUrl, String sellerId, String role) {
        List<String> imageUrls = new ArrayList<>(product.imageUrls() == null ? List.of() : product.imageUrls());
        if (!imageUrls.contains(imageUrl)) {
            imageUrls.add(imageUrl);
        }
        ProductRequest request = new ProductRequest(product.name(), product.description(), product.price(), product.quantity(), imageUrls);
        try {
            productClient.put()
                .uri("/products/{id}", product.id())
                .header("X-User-Id", sellerId)
                .header("X-User-Role", role)
                .body(request)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image uploaded but could not be linked to product");
        }
    }

    private MediaResponse toResponse(Media media) {
        return new MediaResponse(media.getId(), "/api/media/images/" + media.getId(), media.getImagePath(), media.getProductId(), media.getSellerId(), media.getContentType(), media.getSize(), media.getCreatedAt());
    }
}
