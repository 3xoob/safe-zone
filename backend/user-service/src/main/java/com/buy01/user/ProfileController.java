package com.buy01.user;

import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
public class ProfileController {
    private static final long MAX_AVATAR_SIZE = 2L * 1024L * 1024L;
    private final UserRepository users;
    private final Path avatarDir;

    public ProfileController(UserRepository users, @Value("${app.avatar-upload-dir}") String avatarUploadDir) throws IOException {
        this.users = users;
        this.avatarDir = Paths.get(avatarUploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.avatarDir);
    }

    @GetMapping("/me")
    UserResponse me(@RequestHeader("X-User-Id") String userId) {
        return AuthController.toResponse(findUser(userId));
    }

    @PutMapping("/me")
    UserResponse update(@RequestHeader("X-User-Id") String userId, @Valid @RequestBody UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setName(request.name().trim());
        user.setUpdatedAt(Instant.now());
        return AuthController.toResponse(users.save(user));
    }

    @PostMapping("/me/avatar")
    UserResponse uploadAvatar(@RequestHeader("X-User-Id") String userId, @RequestParam("file") MultipartFile file) throws IOException {
        validateAvatar(file);
        User user = findUser(userId);
        String extension = extension(file.getOriginalFilename(), file.getContentType());
        String filename = user.getId() + "-" + UUID.randomUUID() + extension;
        Path target = avatarDir.resolve(filename).normalize();
        if (!target.startsWith(avatarDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar filename");
        }
        file.transferTo(target);
        deleteOldAvatar(user.getAvatar());
        user.setAvatar("/api/users/avatars/" + filename);
        user.setUpdatedAt(Instant.now());
        return AuthController.toResponse(users.save(user));
    }

    @GetMapping("/avatars/{filename}")
    ResponseEntity<Resource> avatar(@PathVariable("filename") String filename) throws IOException {
        if (!filename.matches("[a-zA-Z0-9._-]+")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar filename");
        }
        Path path = avatarDir.resolve(filename).normalize();
        if (!path.startsWith(avatarDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar filename");
        }
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Avatar file not found");
        }
        String contentType = Files.probeContentType(path);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType))
            .cacheControl(CacheControl.noCache())
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
            .body(resource);
    }

    private void validateAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar image is required");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar must be 2 MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }
        if (!hasImageSignature(file.getBytes())) {
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

    private void deleteOldAvatar(String avatar) throws IOException {
        if (avatar == null || !avatar.startsWith("/api/users/avatars/")) {
            return;
        }
        String filename = avatar.substring(avatar.lastIndexOf('/') + 1);
        if (filename.matches("[a-zA-Z0-9._-]+")) {
            Files.deleteIfExists(avatarDir.resolve(filename).normalize());
        }
    }

    private User findUser(String userId) {
        return users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
