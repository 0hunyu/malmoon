package com.communet.malmoon.bundle.service;

import com.communet.malmoon.bundle.domain.ToolBundle;
import com.communet.malmoon.bundle.dto.request.ToolBundleCreateReq;
import com.communet.malmoon.bundle.dto.request.ToolBundleUpdateReq;
import com.communet.malmoon.bundle.dto.response.ToolBundleRes;
import com.communet.malmoon.bundle.repository.ToolBundleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ToolBundleService {

    private final ToolBundleRepository toolBundleRepository;

    @Transactional
    public ToolBundleRes createToolBundle(ToolBundleCreateReq req, Long memberId) {
        ToolBundle bundle = ToolBundle.builder()
                .aacSetId(req.getAacSetId())
                .filterSetId(req.getFilterSetId())
                .name(req.getName())
                .description(req.getDescription())
                .therapistId(memberId)  // 소유자 설정
                .build();

        toolBundleRepository.save(bundle);

        return ToolBundleRes.fromEntity(bundle);
    }

    @Transactional(readOnly = true)
    public ToolBundleRes getToolBundle(Long toolBundleId, Long memberId) {
        ToolBundle bundle = toolBundleRepository.findById(toolBundleId)
                .orElseThrow(() -> new RuntimeException("ToolBundle not found"));

        // 소유자 체크
        if (!bundle.getTherapistId().equals(memberId)) {
            throw new RuntimeException("Unauthorized access");
        }

        return ToolBundleRes.fromEntity(bundle);
    }

    @Transactional(readOnly = true)
    public List<ToolBundleRes> getMyToolBundles(Long memberId) {
        List<ToolBundle> bundles = toolBundleRepository.findAllBytherapistId(memberId);
        return bundles.stream()
                .map(ToolBundleRes::fromEntity)
                .toList();
    }

    @Transactional
    public ToolBundleRes updateToolBundle(Long toolBundleId, ToolBundleUpdateReq req, Long memberId) {
        ToolBundle bundle = toolBundleRepository.findById(toolBundleId)
                .orElseThrow(() -> new RuntimeException("ToolBundle not found"));

        // 소유자 체크
        if (!bundle.getTherapistId().equals(memberId)) {
            throw new RuntimeException("Unauthorized access");
        }

        bundle.setAacSetId(req.getAacSetId());
        bundle.setFilterSetId(req.getFilterSetId());
        bundle.setName(req.getName());
        bundle.setDescription(req.getDescription());

        return ToolBundleRes.fromEntity(bundle);
    }

    @Transactional
    public void deleteToolBundle(Long toolBundleId, Long memberId) {
        ToolBundle bundle = toolBundleRepository.findById(toolBundleId)
                .orElseThrow(() -> new RuntimeException("ToolBundle not found"));

        // 소유자 체크
        if (!bundle.getTherapistId().equals(memberId)) {
            throw new RuntimeException("Unauthorized access");
        }

        toolBundleRepository.delete(bundle);
    }
}

