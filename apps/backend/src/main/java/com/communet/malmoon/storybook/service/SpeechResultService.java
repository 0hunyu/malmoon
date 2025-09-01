package com.communet.malmoon.storybook.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.communet.malmoon.member.domain.Member;
import com.communet.malmoon.member.repository.MemberRepository;
import com.communet.malmoon.storybook.domain.SpeechResult;
import com.communet.malmoon.storybook.domain.StorybookSentence;
import com.communet.malmoon.storybook.repository.SpeechResultRepository;
import com.communet.malmoon.storybook.repository.StorybookSentenceRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpeechResultService {
	private final SpeechResultRepository speechResultRepository;
	private final MemberRepository memberRepository;
	private final StorybookSentenceRepository sentenceRepository;

	private final RestTemplate restTemplate = new RestTemplate();

	@Value("${external.fastapi.url}")
	private String fastApiBaseUrl;

	@PostConstruct
	void logBaseUrl() {
		log.info("[FastAPI Base URL] {}", fastApiBaseUrl);
	}

	public void handleSpeechUpload(Long childId, Long sentenceId, String srcTextId, int page, Path audioPath) throws
		IOException {
		Member child = memberRepository.findById(childId)
			.orElseThrow(() -> new IllegalArgumentException("아동 정보 없음"));
		StorybookSentence sentence = sentenceRepository.findById(sentenceId)
			.orElseThrow(() -> new IllegalArgumentException("문장 정보 없음"));

		// 1. 파일 이름은 UUID 기반으로만 생성 (원래 이름 알 수 없으므로)
		String filename = UUID.randomUUID() + ".webm"; // 또는 ".mp3" 등

		// 2. 저장 경로
		Path savePath = Paths.get("uploads/audio", filename);
		Files.createDirectories(savePath.getParent());

		// 3. audioPath → 바이트 복사
		Files.copy(audioPath, savePath, StandardCopyOption.REPLACE_EXISTING);

		// FastAPI로 전송 전 디버깅 로그
		File audio = savePath.toFile();
		// System.out.println("🟡 [Spring → FastAPI] 보내는 파일 경로: " + audio.getAbsolutePath());
		// System.out.println("🟡 [Spring → FastAPI] 파일 존재 여부: " + audio.exists());
		// System.out.println("🟡 [Spring → FastAPI] 파일 크기(bytes): " + audio.length());
		// System.out.println("🟡 [Spring → FastAPI] 파일 이름: " + audio.getName());
		// System.out.println("🟡 [Spring → FastAPI] 파일 MIME Type: " + Files.probeContentType(savePath));

		//2. FastAPI로 전송
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.MULTIPART_FORM_DATA);

		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
		body.add("file", new FileSystemResource(savePath)); // FastAPI에서 field명이 "file"인지 확인

		HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
		String sttText = restTemplate.postForObject(
			fastApiBaseUrl + "/api/v1/stt/transcribe",
			requestEntity,
			String.class
		);

		// ✅ FastAPI 응답 디버깅 로그
		// System.out.println("🟢 [Spring] Whisper(FastAPI)로부터 받은 STT 텍스트:");
		// System.out.println("     " + sttText);

		// if (sttText == null || sttText.trim().isEmpty()) {
		// 	System.out.println("🔴 [Spring] STT 결과가 비어있거나 null입니다!");
		// } else {
		// 	System.out.println("🟢 [Spring] STT 결과 길이: " + sttText.length());
		// }

		//3. DB 저장
		SpeechResult result = SpeechResult.builder()
			.child(child)
			.sentence(sentence)
			.sttText(sttText)
			.srcTextId(srcTextId)
			.page(page)
			.audioUrl(savePath.toString())
			.createdAt(LocalDateTime.now())
			.build();

		speechResultRepository.save(result);

	}
}
