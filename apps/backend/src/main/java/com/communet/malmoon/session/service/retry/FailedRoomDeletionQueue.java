package com.communet.malmoon.session.service.retry;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FailedRoomDeletionQueue {

    private final String RETRY_QUEUE_KEY = "failedRoomDeletionQueue";
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public void add(String roomName, int retryCount) {
        try {
            String json = objectMapper.writeValueAsString(new RetryItem(roomName, retryCount));
            redisTemplate.opsForList().rightPush(RETRY_QUEUE_KEY, json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize retry item", e);
        }
    }

    public RetryItem poll() {
        String json = redisTemplate.opsForList().leftPop(RETRY_QUEUE_KEY);
        if (json == null) return null;

        try {
            return objectMapper.readValue(json, RetryItem.class);
        } catch (JsonProcessingException e) {
            log.error("Redis 큐에서 역직렬화 실패: {}, 데이터: {}", e.getMessage(), json);
            return null;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RetryItem {
        private String roomName;
        private int retryCount;
    }
}