package com.communet.malmoon.diagnostic.service;

import com.communet.malmoon.diagnostic.client.DiagnosticFastApiClient;
import com.communet.malmoon.diagnostic.domain.InitialTestAttempt;
import com.communet.malmoon.diagnostic.domain.InitialTestItem;
import com.communet.malmoon.diagnostic.domain.InitialTestResult;
import com.communet.malmoon.diagnostic.dto.*;
import com.communet.malmoon.diagnostic.exception.NotFoundException;
import com.communet.malmoon.diagnostic.infra.FileStorageService;
import com.communet.malmoon.diagnostic.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 정확도/피드백은 LLM 결과만을 저장
 */
@Service
@RequiredArgsConstructor
public class DiagnosticService {

    private final InitialTestAttemptRepository attemptRepo;
    private final InitialTestItemRepository itemRepo;
    private final InitialTestResultRepository resultRepo;
    private final FileStorageService fileStorage;
    private final DiagnosticFastApiClient fastApiClient;

    /** 시작 */
    @Transactional
    public AttemptStartResponse startAttempt(AttemptStartRequest req) {
        InitialTestAttempt attempt = InitialTestAttempt.builder()
                .childId(req.getChildId())
                .ageGroup(req.getAgeGroup())
                .build();
        attemptRepo.save(attempt);
        return AttemptStartResponse.of(attempt.getAttemptId(), attempt.getAgeGroup(), attempt.getCreatedAt());
    }

    /** 문항 제출: 파일 저장 → STT → upsert */
    @Transactional
    public ItemSubmitResponse submitItem(UUID attemptId, Integer itemIndex, String targetText, MultipartFile file) {
        InitialTestAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("attempt"));

        String audioUrl = fileStorage.saveDiagnosticAudio(attemptId, itemIndex, file);
        String sttText  = fastApiClient.transcribe(file, 3);

        InitialTestItem item = itemRepo.findByAttempt_AttemptIdAndItemIndex(attemptId, itemIndex)
                .orElse(InitialTestItem.builder().attempt(attempt).itemIndex(itemIndex).build());
        item.setTargetText(targetText);
        item.setSttText(sttText);
        item.setAudioUrl(audioUrl);
        itemRepo.save(item);

        return new ItemSubmitResponse(itemIndex, targetText, sttText, audioUrl);
    }

    /** 종료: 10문항 모아 LLM 평가 → 결과 저장 */
    @Transactional
    public FinishResponse finishAttempt(UUID attemptId) {
        InitialTestAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("attempt"));

        List<InitialTestItem> items = itemRepo.findByAttempt_AttemptIdOrderByItemIndex(attemptId);
        if (items.size() < 10) throw new IllegalStateException("10문항이 모두 제출되지 않았습니다.");

        List<WordsPair> req = items.stream()
                .map(it -> WordsPair.builder()
                        .targetText(it.getTargetText())
                        .sttText(it.getSttText())
                        .build()
                )
                .toList();

        FeedbackEvalResponseDto rsp = fastApiClient.evaluateFeedback(req, 3);

        InitialTestResult result = InitialTestResult.builder()
                .attempt(attempt)
                .accuracy(BigDecimal.valueOf(rsp.getAccuracy()))
                .evaluation(rsp.getEvaluation())
                .strengths(rsp.getStrengths())
                .improvements(rsp.getImprovements())
                .recommendations(rsp.getRecommendations())
                .build();
        resultRepo.save(result);

        List<FinishResponse.ItemResult> itemDtos = items.stream()
                .map(it -> FinishResponse.ItemResult.builder()
                        .itemIndex(it.getItemIndex())
                        .targetText(it.getTargetText())
                        .sttText(it.getSttText())
                        .score(null)
                        .build()
                ).toList();

        return FinishResponse.builder()
                .attemptId(attemptId)
                .accuracy(result.getAccuracy())
                .evaluation(rsp.getEvaluation())
                .strengths(rsp.getStrengths())
                .improvements(rsp.getImprovements())
                .recommendations(rsp.getRecommendations())
                .items(itemDtos)
                .build();
    }

    /** 상세 조회 */
    @Transactional(readOnly = true)
    public AttemptDetailResponse getAttempt(UUID attemptId) {
        InitialTestAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new NotFoundException("attempt"));
        InitialTestResult result = resultRepo.findById(attemptId).orElse(null);
        List<InitialTestItem> items = itemRepo.findByAttempt_AttemptIdOrderByItemIndex(attemptId);

        List<FinishResponse.ItemResult> itemDtos = items.stream()
                .map(it -> FinishResponse.ItemResult.builder()
                        .itemIndex(it.getItemIndex())
                        .targetText(it.getTargetText())
                        .sttText(it.getSttText())
                        .score(null)
                        .build()
                ).toList();

        return AttemptDetailResponse.builder()
                .attemptId(attempt.getAttemptId())
                .childId(attempt.getChildId())
                .ageGroup(attempt.getAgeGroup())
                .createdAt(attempt.getCreatedAt())
                .accuracy(result != null ? result.getAccuracy() : null)
                .evaluation(result != null ? result.getEvaluation() : null)
                .recommendations(result != null ? result.getRecommendations() : null)
                .strengths(result != null ? result.getStrengths() : null)
                .improvements(result != null ? result.getImprovements() : null)
                .items(itemDtos)
                .build();
    }
}
