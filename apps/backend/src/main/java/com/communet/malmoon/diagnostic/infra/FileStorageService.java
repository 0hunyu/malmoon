package com.communet.malmoon.diagnostic.infra;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;

/**
 * 오디오 파일을 로컬 디스크에 저장 (운영은 S3 권장)
 */
@Service
public class FileStorageService {
    private static final String ROOT = "uploads/diag";

    public String saveDiagnosticAudio(java.util.UUID attemptId, Integer itemIndex, MultipartFile file) {
        try {
            Path dir = Paths.get(ROOT, attemptId.toString());
            Files.createDirectories(dir);

            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains(".")) ? original.substring(original.lastIndexOf('.')) : ".dat";
            Path target = dir.resolve("item-" + itemIndex + ext);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/" + dir.resolve(target.getFileName()).toString().replace("\\","/");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store audio file", e);
        }
    }
}
