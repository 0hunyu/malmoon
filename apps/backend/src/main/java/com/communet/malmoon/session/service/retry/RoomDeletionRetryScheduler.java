package com.communet.malmoon.session.service.retry;

import io.livekit.server.RoomServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import retrofit2.Response;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomDeletionRetryScheduler {

    private static final int MAX_RETRY_COUNT = 5;
    private static final int MAX_BATCH_SIZE = 100;

    private final FailedRoomDeletionQueue retryQueue;
    private final RoomServiceClient roomServiceClient;

    @Scheduled(fixedDelay = 60000) // 1분마다 실행
    public void retryFailedDeletions() {
        int processedCount = 0;
        FailedRoomDeletionQueue.RetryItem item;

        while (processedCount < MAX_BATCH_SIZE && (item = retryQueue.poll()) != null) {
            String roomName = item.getRoomName();
            int retryCount = item.getRetryCount();

            try {
                Response<Void> response = roomServiceClient.deleteRoom(roomName).execute();
                if (response.isSuccessful()) {
                    log.info("재시도: {} 방 삭제 성공", roomName);
                } else {
                    log.warn("재시도: {} 방 삭제 실패, 코드: {}", roomName, response.code());
                    requeueOrGiveUp(roomName, retryCount);
                }
            } catch (Exception e) {
                log.warn("재시도: {} 방 삭제 중 예외 발생: {}", roomName, e.getMessage());
                requeueOrGiveUp(roomName, retryCount);
            }

            processedCount++;
        }
    }

    private void requeueOrGiveUp(String roomName, int retryCount) {
        if (retryCount < MAX_RETRY_COUNT) {
            retryQueue.add(roomName, retryCount + 1);
            log.info("{} 재시도 횟수 증가: {}", roomName, retryCount + 1);
        } else {
            log.error("{} 최대 재시도 횟수 도달, 더 이상 재시도하지 않음", roomName);
        }
    }
}
