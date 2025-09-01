// package com.communet.malmoon.storybook;
//
// import java.io.InputStream;
//
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.core.io.Resource;
// import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
// import org.springframework.stereotype.Component;
//
// import com.communet.malmoon.storybook.dto.StorybookRequestDto;
// import com.communet.malmoon.storybook.service.StorybookDataLoadService;
// import com.fasterxml.jackson.databind.ObjectMapper;
//
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
//
// @Slf4j
// @Component
// @RequiredArgsConstructor
// public class LocalJsonLoader implements CommandLineRunner {
//
// 	private final ObjectMapper objectMapper = new ObjectMapper();
// 	private final StorybookDataLoadService dataLoadService;
//
// 	private static final String JSON_CLASSPATH_DIR = "classpath:jsons/*.json";
//
// 	@Override
// 	public void run(String... args) throws Exception {
// 		var resolver = new PathMatchingResourcePatternResolver();
// 		Resource[] resources = resolver.getResources(JSON_CLASSPATH_DIR);
//
// 		if (resources.length == 0) {
// 			log.warn("📂 classpath:/jsons 디렉토리에 JSON 파일이 없습니다.");
// 			return;
// 		}
//
// 		for (Resource resource : resources) {
// 			try (InputStream in = resource.getInputStream()) {
// 				StorybookRequestDto dto = objectMapper.readValue(in, StorybookRequestDto.class);
// 				dataLoadService.save(dto);
// 				log.info("✅ 저장 완료: {}", dto.getTitle());
// 			} catch (Exception e) {
// 				log.error("❌ 저장 실패: {} → {}", resource.getFilename(), e.getMessage());
// 			}
// 		}
// 	}
// }
