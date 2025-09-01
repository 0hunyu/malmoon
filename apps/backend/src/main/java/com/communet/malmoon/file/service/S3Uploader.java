package com.communet.malmoon.file.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * AWS S3 업로더
 * - S3에 파일 업로드 및 URL 반환 처리
 */
@Component
@RequiredArgsConstructor
public class S3Uploader {

	private final S3Client s3Client;

	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	/**
	 * S3에 파일 업로드
	 *
	 * @param file      업로드할 파일
	 * @param directory 업로드 경로 (aac, profile 등)
	 * @return 업로드된 파일의 S3 URL
	 * @throws IOException 파일 스트림 처리 중 예외 발생 시
	 */
	public String upload(String directory, MultipartFile file) throws IOException {
		String originalFilename = file.getOriginalFilename();
		String uuid = UUID.randomUUID().toString();
		String fileName = directory + "/" + uuid + "_" + originalFilename;

		// S3 업로드 요청 생성
		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
			.bucket(bucket)
			.key(fileName)
			.contentType(file.getContentType())
			.build();

		// 파일 업로드 실행
		s3Client.putObject(putObjectRequest,
			RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

		// 업로드된 파일 URL 반환
		return fileName;
	}

	/**
	 * java.io.File 기반 업로드 (InputStream 사용)
	 *
	 * @param directory 업로드 경로 (aac/create 등)
	 * @param inputStream 파일 스트림
	 * @param originalFilename 원본 파일명 (확장자 포함)
	 * @return S3 저장 키 (ex: aac/create/uuid_filename.png)
	 * @throws IOException 스트림 처리 예외
	 */
	public String upload(String directory, InputStream inputStream, String originalFilename, String contentType) throws
		IOException {
		String uuid = UUID.randomUUID().toString();
		String fileName = directory + "/" + uuid + "_" + originalFilename;

		PutObjectRequest putObjectRequest = PutObjectRequest.builder()
			.bucket(bucket)
			.key(fileName)
			.contentType(contentType)
			.build();

		s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, inputStream.available()));

		return fileName;
	}

	/**
	 * 업로드된 S3 파일의 URL 반환
	 *
	 * @param fileName S3에 저장된 키
	 * @return 전체 URL
	 */
	private String getFileUrl(String fileName) {
		return String.format("https://%s.s3.amazonaws.com/%s", bucket, fileName);
	}
}
