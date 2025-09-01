package com.communet.malmoon.external.fastapi;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.communet.malmoon.aac.dto.request.AacCreateReq;
import com.communet.malmoon.aac.exception.AacErrorCode;
import com.communet.malmoon.aac.exception.AacException;
import com.communet.malmoon.common.config.FastApiProperties;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * FastAPI와 통신하는 클라이언트입니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FastApiClient {
	private final FastApiProperties fastApiProperties;
	private final RestTemplate restTemplate;

	/**
	 * FastAPI로 AAC 생성 요청을 보낸 후 preview 이미지 URL을 반환합니다.
	 * @param request 상황, 감정, 동작 정보를 포함한 요청
	 * @return 미리보기 이미지 URL
	 */
	public String requestPreviewImage(AacCreateReq request) {
		try {
			String url = fastApiProperties.getUrl() + "/api/v1/aacs/generate";

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			HttpEntity<AacCreateReq> entity = new HttpEntity<>(request, headers);

			ResponseEntity<JsonNode> response = restTemplate.exchange(
				url,
				HttpMethod.POST,
				entity,
				JsonNode.class
			);

			JsonNode body = response.getBody();
			if (!response.getStatusCode().is2xxSuccessful() || body == null || body.get("preview_url") == null) {
				throw new AacException(AacErrorCode.GENERATION_FAILED);
			}

			return body.get("preview_url").asText();
		} catch (HttpClientErrorException e) {
			log.warn("FastAPI 요청 4xx 에러: {}", e.getResponseBodyAsString(), e);
			throw new AacException(AacErrorCode.FASTAPI_CLIENT_ERROR);

		} catch (HttpServerErrorException e) {
			log.error("FastAPI 서버 5xx 에러: {}", e.getResponseBodyAsString(), e);
			throw new AacException(AacErrorCode.FASTAPI_SERVER_ERROR);

		} catch (ResourceAccessException e) {
			log.error("FastAPI 네트워크 오류: {}", e.getMessage(), e);
			throw new AacException(AacErrorCode.FASTAPI_TIMEOUT);

		} catch (Exception e) {
			log.error("FastAPI 처리 중 알 수 없는 오류: {}", e.getMessage(), e);
			throw new AacException(AacErrorCode.GENERATION_FAILED);
		}

	}
}
