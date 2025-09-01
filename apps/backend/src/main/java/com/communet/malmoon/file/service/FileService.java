package com.communet.malmoon.file.service;

import org.springframework.web.multipart.MultipartFile;

import com.communet.malmoon.file.dto.request.PresignPutReq;
import com.communet.malmoon.file.dto.request.UploadConfirmReq;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.dto.response.PresignPutRes;
import com.communet.malmoon.file.dto.response.UploadConfirmRes;

/**
 * 파일 관련 기능을 정의하는 인터페이스입니다.
 */
public interface FileService {
	/**
	 * 파일 업로드
	 *
	 * @param directory 업로드 대상 디렉토리 (aac, profile 등)
	 * @param file MultipartFile 업로드할 파일
	 * @return 업로드된 S3 URL
	 */
	FileUploadRes uploadFile(String directory, MultipartFile file);

	FileUploadRes uploadFile(String directory, java.io.File file);

	/**
	 * fileId를 통해 S3 이미지 URL을 반환합니다.
	 *
	 * @param fileId 파일 테이블의 ID
	 * @return S3 접근용 정적 URL
	 */
	String getFileUrl(Long fileId);

	/**
	 * fileId를 통해 S3의 presigned 이미지 URL을 반환합니다.
	 * @param fileId 파일 테이블의 ID
	 * @return Presigned URL (일정 시간만 접근 가능)
	 */
	String getPresignedFileUrl(Long fileId);

	// 신규: Pre-Signed 방식
	PresignPutRes presignPut(PresignPutReq req, Long uploaderId);
	UploadConfirmRes confirmUpload(UploadConfirmReq req, Long uploaderId);
}
