package com.communet.malmoon.file.service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.communet.malmoon.file.domain.File;
import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.request.PresignPutReq;
import com.communet.malmoon.file.dto.request.UploadConfirmReq;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.dto.response.PresignPutRes;
import com.communet.malmoon.file.dto.response.UploadConfirmRes;
import com.communet.malmoon.file.repository.FileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * 파일 서비스 구현체
 * - 파일 업로드 로직 처리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileServiceImpl implements FileService {

	private final S3Presigner s3Presigner;
	private final S3Client s3Client;
	private final S3Uploader s3Uploader;
	private final FileRepository fileRepository;

	@Value("${cloud.aws.s3.url-prefix}")
	private String s3Prefix;

	@Value("${cloud.aws.s3.bucket}")
	private String bucket;
	@Value("${cloud.aws.s3.presign-exp-seconds}") private int expSec;
	@Value("${cloud.aws.s3.key-prefix:}") private String keyPrefix;

	@Value("${file.max-size-bytes}") private long maxSizeBytes;
	@Value("#{'${file.allowed-content-types}'.split(',')}") private List<String> allowed;

	@Override
	public FileUploadRes uploadFile(String directory, MultipartFile file) {
		try {
			// 1. S3에 파일 업로드 → 파일 경로만 반환됨 (예: aac/abc.png)
			String filename = s3Uploader.upload(directory, file);

			// 2. File 엔티티 생성 및 저장
			File savedFile = fileRepository.save(File.builder()
				.fileType(FileType.valueOf(directory.toUpperCase())) // directory → Enum 변환
				.filename(filename)
				.isDeleted(false)
				.build());

			log.info("파일 저장 완료: id={}, filename={}", savedFile.getId(), filename);

			// 3. 응답 DTO 반환
			return FileUploadRes.builder()
				.fileId(savedFile.getId())
				.url(s3Prefix + filename)
				.build();

		} catch (IOException e) {
			log.error("파일 업로드 실패", e);
			throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.");
		}
	}

	@Override
	public FileUploadRes uploadFile(String directory, java.io.File file) {
		try (java.io.InputStream inputStream = new java.io.FileInputStream(file)) {
			// 0. ContentType 추론
			String contentType = resolveContentType(file.getName());

			// 1. S3Uploader에 InputStream 기반 업로드 요청
			String filename = s3Uploader.upload(directory, inputStream, file.getName(), contentType);

			// 2. File 엔티티 저장
			File savedFile = fileRepository.save(File.builder()
				.fileType(FileType.valueOf(directory.toUpperCase()))
				.filename(filename)
				.isDeleted(false)
				.build());

			log.info("파일 저장 완료: id={}, filename={}", savedFile.getId(), filename);

			// 3. 결과 DTO 반환
			return FileUploadRes.builder()
				.fileId(savedFile.getId())
				.url(s3Prefix + filename)
				.build();
		} catch (IOException e) {
			log.error("파일 업로드 실패", e);
			throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.");
		}
	}

	@Override
	public String getFileUrl(Long fileId) {
		File file = fileRepository.findById(fileId)
			.orElseThrow(() -> new IllegalArgumentException("해당 파일이 존재하지 않습니다. ID=" + fileId));

		if (file.isDeleted()) {
			throw new IllegalStateException("삭제된 파일입니다. ID=" + fileId);
		}

		return s3Prefix + file.getFilename();
	}

	@Override
	public String getPresignedFileUrl(Long fileId) {
		File file = fileRepository.findById(fileId)
			.orElseThrow(() -> new IllegalArgumentException("해당 파일이 존재하지 않습니다. ID=" + fileId));

		if (file.isDeleted()) {
			throw new IllegalStateException("삭제된 파일입니다. ID=" + fileId);
		}

		String key = file.getFilename();

		GetObjectRequest getObjectRequest = GetObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.build();

		GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
			.signatureDuration(Duration.ofMinutes(10))
			.getObjectRequest(getObjectRequest)
			.build();

		PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
		return presignedRequest.url().toString();
	}

	@Override
	public PresignPutRes presignPut(PresignPutReq req, Long uploaderId) {
		validate(req.getContentType(), req.getSize());

		String ext = guessExt(req.getContentType(), req.getOriginalFileName());
		String safeOriginal = sanitizeOriginalName(req.getOriginalFileName(), ext);

		String dir = (req.getFileType() != null) ? req.getFileType().name() : "MISC";

		String fileName = UUID.randomUUID() + "_" + safeOriginal;

		String key = joinKey(keyPrefix, dir, fileName);

		PutObjectRequest.Builder put = PutObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.contentType(req.getContentType())
			.serverSideEncryption("AES256");

		// 체크섬(옵션)
		if (req.getChecksumSha256Base64() != null && !req.getChecksumSha256Base64().isBlank()) {
			put = put.checksumSHA256(req.getChecksumSha256Base64());
		}

		PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(
			PutObjectPresignRequest.builder()
				.signatureDuration(Duration.ofSeconds(expSec))
				.putObjectRequest(put.build())
				.build()
		);

		// 사전 파일 레코드 생성(선택): 여기서는 업로드 확정 시에만 저장(아래 confirm)
		return new PresignPutRes(presigned.url().toString(), key, (long) expSec);

	}

	@Override
	public UploadConfirmRes confirmUpload(UploadConfirmReq req, Long uploaderId) {
		// (선택) S3 HEAD로 존재/사이즈/타입 확인 — 장애 시에도 Redis 큐 등으로 재시도 가능
		try {
			HeadObjectResponse head = s3Client.headObject(HeadObjectRequest.builder()
				.bucket(bucket).key(req.getKey()).build());
			if (req.getSize() != null && head.contentLength() != req.getSize()) {
				log.warn("사이즈 불일치: client={}, s3={}", req.getSize(), head.contentLength());
			}
			if (req.getEtag() != null) {
				String got = head.eTag(); // 보통 "..." 형태
				String want = req.getEtag();
				if (!want.equals(got) && !want.equals(got.replace("\"",""))) {
					throw new IllegalStateException("ETag 불일치");
				}
			}
		} catch (Exception e) {
			throw new IllegalStateException("S3 업로드 확인 실패(HEAD 실패): key=" + req.getKey(), e);
		}

		// DB 저장 (기존 구조 재사용: filename=key)
		// fileType은 key 경로에서 역추론 가능하나, 필요시 confirmReq에 넣어도 됨
		FileType type = guessTypeFromKey(req.getKey());
		File saved = fileRepository.save(File.builder()
			.fileType(type)
			.filename(req.getKey())
			.isDeleted(false)
			.build());

		// 조회용 URL: 짧은 Pre-Signed GET(10분)
		String viewUrl = presignGet(req.getKey(), 600);
		return UploadConfirmRes.builder()
			.fileId(saved.getId())
			.viewUrl(viewUrl)
			.build();
	}

	private String sanitizeOriginalName(String original, String ext) {
		if (original == null || original.isBlank()) return "file." + ext;
		// 경로구분자 제거, 공백 -> _
		return original.replaceAll("[\\\\/]+", "_").replaceAll("\\s+", "_");
	}

	private String joinKey(String... parts) {
		return java.util.Arrays.stream(parts)
			.filter(p -> p != null && !p.isBlank())
			.map(p -> p.replaceAll("^/+", "").replaceAll("/+$", "")) // 앞/뒤 슬래시 제거
			.reduce((a, b) -> a + "/" + b)
			.orElse("");
	}

	private String guessExt(String contentType, String originalName) {
		// contentType 우선, 없으면 파일명으로 추론
		if (contentType == null) contentType = "";
		return switch (contentType) {
			case "image/jpeg" -> "jpg";
			case "image/png"  -> "png";
			case "image/webp" -> "webp";
			case "image/avif" -> "avif";
			case "image/gif"  -> "gif";
			case "application/pdf" -> "pdf";
			case "video/mp4" -> "mp4";
			case "audio/mpeg" -> "mp3";
			case "audio/wav" -> "wav";
			default -> {
				String lower = (originalName == null ? "" : originalName).toLowerCase();
				if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) yield "jpg";
				if (lower.endsWith(".png"))  yield "png";
				if (lower.endsWith(".webp")) yield "webp";
				if (lower.endsWith(".avif")) yield "avif";
				if (lower.endsWith(".gif"))  yield "gif";
				if (lower.endsWith(".pdf"))  yield "pdf";
				if (lower.endsWith(".mp4"))  yield "mp4";
				if (lower.endsWith(".mp3"))  yield "mp3";
				if (lower.endsWith(".wav"))  yield "wav";
				yield "bin";
			}
		};
	}

	private void validate(String contentType, Long size) {
		if (size == null || size <= 0 || size > maxSizeBytes) {
			throw new IllegalArgumentException("파일 크기 제한 초과");
		}
		boolean allowedType = allowed.stream().anyMatch(ct -> ct.equalsIgnoreCase(contentType));
		if (!allowedType) {
			throw new IllegalArgumentException("허용되지 않는 Content-Type: " + contentType);
		}
	}

	private FileType guessTypeFromKey(String key) {
		// 대소문자 섞여 들어와도 잡히게 방어
		String kLower = key.toLowerCase();
		for (FileType t : FileType.values()) {
			if (key.contains("/" + t.name() + "/")        // 대문자 디렉터리
				|| kLower.contains("/" + t.name().toLowerCase() + "/")) {
				return t;
			}
		}
		return FileType.AAC;
	}

	private String presignGet(String key, int seconds) {
		GetObjectRequest get = GetObjectRequest.builder()
			.bucket(bucket).key(key).build();
		PresignedGetObjectRequest p = s3Presigner.presignGetObject(
			GetObjectPresignRequest.builder()
				.getObjectRequest(get)
				.signatureDuration(Duration.ofSeconds(seconds))
				.build());
		return p.url().toString();
	}

	private String resolveContentType(String filename) {
		filename = filename.toLowerCase();
		if (filename.endsWith(".png"))
			return "image/png";
		if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
			return "image/jpeg";
		if (filename.endsWith(".gif"))
			return "image/gif";
		return "application/octet-stream";
	}

}
