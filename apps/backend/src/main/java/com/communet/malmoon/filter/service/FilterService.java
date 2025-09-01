package com.communet.malmoon.filter.service;

import com.communet.malmoon.file.domain.FileType;
import com.communet.malmoon.file.dto.response.FileUploadRes;
import com.communet.malmoon.file.service.FileService;
import com.communet.malmoon.filter.domain.Filter;
import com.communet.malmoon.filter.domain.FilterStatusType;
import com.communet.malmoon.filter.dto.request.FilterStoreReq;
import com.communet.malmoon.filter.dto.response.FilterDto;
import com.communet.malmoon.filter.dto.response.FilterListRes;
import com.communet.malmoon.filter.repository.FilterRepository;
import com.communet.malmoon.member.domain.Member;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FilterService {

    private final FilterRepository filterRepository;
    private final FileService fileService;

    public FilterListRes getFilters(Member member) {
        return new FilterListRes(filterToDto(filterRepository.findFiltersByStatusForOwnerOrGlobal(FilterStatusType.KEEP, member)));
    }

    public FilterListRes getFiltersByIds(List<Long> filterIds) {
        return new FilterListRes(filterToDto(filterRepository.findAllById(filterIds)));
    }

    private List<FilterDto> filterToDto(List<Filter> filters) {
        List<FilterDto> filterDtoList = new ArrayList<>();
        filters.forEach(filter -> {
            FilterDto filterDto = new FilterDto();
            filterDto.setFilterId(filter.getFilterId());
            filterDto.setName(filter.getName());
            filterDto.setFilterLensId(filter.getFilterLensId());
            filterDto.setFileUrl(fileService.getPresignedFileUrl(filter.getFileId()));
            filterDtoList.add(filterDto);
        });
        return filterDtoList;
    }

    public void storeFilter(Member member, FilterStoreReq filterStoreReq, MultipartFile file) {
        FileUploadRes fileUploadRes = fileService.uploadFile(FileType.FILTER.getDirectory(), file);

        Filter filter = Filter.builder()
                .name(filterStoreReq.getName())
                .filterLensId(filterStoreReq.getFilterLensId())
                .fileId(fileUploadRes.getFileId())
                .status(FilterStatusType.KEEP)
                .owner(member)
                .build();

        filterRepository.save(filter);
    }

    @Transactional
    public void deleteFilter(Member member, Long filterId) {
        Filter filter = filterRepository.findById(filterId).orElse(null);
        if (filter == null) {
            throw new EntityNotFoundException("필터가 존재하지 않습니다.");
        }

        if (!filter.getOwner().getMemberId().equals(member.getMemberId())) {
            throw new AccessDeniedException("삭제 권한이 없습니다.");
        }
        filter.setStatus(FilterStatusType.DELETED);
    }
}
