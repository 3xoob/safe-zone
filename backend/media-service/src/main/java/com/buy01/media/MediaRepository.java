package com.buy01.media;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MediaRepository extends MongoRepository<Media, String> {
    List<Media> findBySellerId(String sellerId);
}
