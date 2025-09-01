package com.communet.malmoon.diagnostic.infra;

import org.springframework.core.io.InputStreamResource;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

/**
 * RestTemplate multipart/form-data 전송용 래퍼
 */
public class MultipartInputResource extends InputStreamResource {
    private final String filename;
    private final long contentLength;

    public MultipartInputResource(MultipartFile file) throws IOException {
        super(file.getInputStream());
        this.filename = file.getOriginalFilename();
        this.contentLength = file.getSize();
    }
    @Override public String getFilename() { return filename != null ? filename : "file"; }
    @Override public long contentLength() { return contentLength; }
}
