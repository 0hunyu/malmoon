package com.communet.malmoon.storybook.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.storybook.domain.SessionFeedback;
import com.communet.malmoon.storybook.domain.SpeechResult;
import com.communet.malmoon.storybook.domain.Storybook;
import com.communet.malmoon.storybook.dto.FeedbackDetailResponseDto;
import com.communet.malmoon.storybook.dto.SentencePairDto;
import com.communet.malmoon.storybook.dto.FeedbackEvalResponseDto;
import com.communet.malmoon.storybook.dto.SessionFeedbackRequestDto;
import com.communet.malmoon.storybook.repository.SessionFeedbackRepository;
import com.communet.malmoon.storybook.repository.SpeechResultRepository;
import com.communet.malmoon.storybook.repository.StorybookRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionFeedbackService {

	private final SpeechResultRepository speechResultRepository;
	private final SessionFeedbackRepository sessionFeedbackRepository;
	private final MemberRepository memberRepository;
	private final StorybookRepository storybookRepository;
	private final SessionFeedbackRepository feedbackRepository;

	private final RestTemplate restTemplate = new RestTemplate();

	@Value("${external.fastapi.url}")
	private String fastApiBaseUrl;

	@PostConstruct
	void logBaseUrl() {
		log.info("[FastAPI Base URL] {}", fastApiBaseUrl);
	}

	// 치료 영역 (STT 결과 및 원문 문장 기반 피드백 생성)
	public void processFeedbackAfterLesson(SessionFeedbackRequestDto requestDto) {
		Long childId = requestDto.getChildId();

		// 날짜를 LocalDateTime 범위로 변환
		LocalDateTime start = requestDto.getDate().atStartOfDay();
		LocalDateTime end = requestDto.getDate().atTime(LocalTime.MAX);

		//1.  STT 결과 + 원문 문장 조회
		List<SpeechResult> results =
				speechResultRepository.findWithSentenceByChildIdAndCreatedAtBetween(childId, start, end);

		if (results.isEmpty()) {
			System.out.println("❌ 해당 날짜의 STT 결과가 없습니다.");
			return;
		}

		// 디버깅 로그 출력
		results.forEach(result -> {
			System.out.println("📘 원문: " + result.getSentence().getSentence());
			System.out.println("🎙️ STT : " + result.getSttText());
			System.out.println("-----------");
		});

		//2. FastAPI 요청 dto 구성
		List<SentencePairDto> sentencePairs = new ArrayList<>();
		for (SpeechResult result : results) {
			SentencePairDto pair = new SentencePairDto();  // ✅ DTO 통일
			pair.setSentenceId(result.getSentence().getId());
			pair.setOriginal(result.getSentence().getSentence());

			String sttValue = result.getSttText();
			log.debug("🎤 STT 원본 값: {}", sttValue);
			pair.setStt(safeExtractText(sttValue));        // JSON/문자열 혼용 보정

			sentencePairs.add(pair);
		}


		// 3) FastAPI로 전송 (본문 = 배열)
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<List<SentencePairDto>> httpEntity = new HttpEntity<>(sentencePairs, headers);

		ResponseEntity<FeedbackEvalResponseDto> response = restTemplate.postForEntity(
				fastApiBaseUrl + "/api/v1/feedback/eval",
				httpEntity,
				FeedbackEvalResponseDto.class
		);

		if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
			log.error("FastAPI 응답 실패 또는 본문 없음. status={}", response.getStatusCode());
			return;
		}

		FeedbackEvalResponseDto res = response.getBody();

		// 4) DB 저장
		Member child = memberRepository.findById(childId)
				.orElseThrow(() -> new IllegalArgumentException("아동이 존재하지 않습니다."));

		String title = java.text.Normalizer.normalize(
				requestDto.getStorybookTitle().trim(),
				java.text.Normalizer.Form.NFC
		);

		Storybook storybook = storybookRepository.findByTitleIgnoreCase(title)
				.orElseThrow(() -> new RuntimeException("제목으로 동화책을 찾을 수 없습니다: " + title));

		SessionFeedback feedback = SessionFeedback.builder()
				.child(child)
				.storybook(storybook)
				.date(requestDto.getDate())
				.lastPage(requestDto.getLastPage())
				.evaluation(res.getEvaluation())
				.accuracy(res.getAccuracy())
				.strengths(res.getStrengths())
				.improvements(res.getImprovements())
				.recommendations(res.getRecommendations())
				.createdAt(LocalDateTime.now())
				.build();

		sessionFeedbackRepository.save(feedback);
		log.info("✅ SessionFeedback 저장 완료 childId={}, date={}", childId, requestDto.getDate());
	}

	// 관리 영역 (피드백 열람)
	// 1. 해당 아동의 피드백 날짜 조회
	public List<LocalDate> findFeedbackDatesByChild(Long childId) {
		return feedbackRepository.findDistinctDatesByChildId(childId);
	}

	// 2. 해당 날짜의 상세 피드백 조회
	public FeedbackDetailResponseDto getFeedbackDetail(Long childId, LocalDate date) {
		SessionFeedback feedback = feedbackRepository
				.findByChild_MemberIdAndDate(childId, date)
				.orElseThrow(() -> new RuntimeException("해당 날짜의 피드백이 존재하지 않습니다."));

		return FeedbackDetailResponseDto.builder()
				.storybookTitle(feedback.getStorybook().getTitle())
				.accuracy(feedback.getAccuracy())
				.evaluation(feedback.getEvaluation())
				.accuracy(feedback.getAccuracy())
				.strengths(feedback.getStrengths())
				.improvements(feedback.getImprovements())
				.recommendations(feedback.getRecommendations())
				.build();
	}
	// STT 결과가 {"text":"..."} 같은 JSON 문자열일 수도 있는 경우 안전 추출
	private String safeExtractText(String raw) {
		if (raw == null) return "";
		String s = raw.trim();
		try {
			JsonNode node = new ObjectMapper().readTree(s);
			if (node.has("text")) return node.get("text").asText("");
		} catch (Exception ignore) {
			// JSON이 아니면 그대로 사용
		}
		return s;
	}
}
