package com.buy01.product;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping
    List<ProductResponse> list(@RequestHeader(value = "X-User-Id", required = false) String userId,
                               @RequestHeader(value = "X-User-Role", required = false) String role) {
        List<Product> result = "SELLER".equals(role) && userId != null ? products.findByUserId(userId) : products.findAll();
        return result.stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    ProductResponse get(@PathVariable("id") String id) {
        return toResponse(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ProductResponse create(@RequestHeader("X-User-Id") String userId, @RequestHeader("X-User-Role") String role, @Valid @RequestBody ProductRequest request) {
        requireSeller(role);
        Product product = new Product();
        apply(product, request);
        product.setUserId(userId);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return toResponse(products.save(product));
    }

    @PutMapping("/{id}")
    ProductResponse update(@PathVariable("id") String id, @RequestHeader("X-User-Id") String userId, @RequestHeader("X-User-Role") String role, @Valid @RequestBody ProductRequest request) {
        requireSeller(role);
        Product product = find(id);
        requireOwner(product, userId);
        apply(product, request);
        product.setUpdatedAt(Instant.now());
        return toResponse(products.save(product));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable("id") String id, @RequestHeader("X-User-Id") String userId, @RequestHeader("X-User-Role") String role) {
        requireSeller(role);
        Product product = find(id);
        requireOwner(product, userId);
        products.delete(product);
    }

    private Product find(String id) {
        return products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private void apply(Product product, ProductRequest request) {
        product.setName(request.name().trim());
        product.setDescription(request.description().trim());
        product.setPrice(request.price());
        product.setQuantity(request.quantity());
        product.setImageUrls(request.imageUrls());
    }

    private void requireSeller(String role) {
        if (!"SELLER".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seller role is required");
        }
    }

    private void requireOwner(Product product, String userId) {
        if (!product.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only modify your own products");
        }
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(product.getId(), product.getName(), product.getDescription(), product.getPrice(), product.getQuantity(), product.getUserId(), product.getImageUrls(), product.getCreatedAt(), product.getUpdatedAt());
    }
}
