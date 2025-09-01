package com.communet.malmoon.common.redis;

import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class RedisConfig {

	private final RedisProperties props;

	@PostConstruct
	void logProps() {
		log.info("[Redis] host={} port={} sslEnabled={} url={}",
			props.getHost(), props.getPort(),
			props.getSsl() != null && props.getSsl().isEnabled(),
			props.getUrl());
	}

	/*
		private RedisTemplate<String, Object> createRedisTemplate(int dbIndex) {
			RedisStandaloneConfiguration config = new RedisStandaloneConfiguration("localhost", 6379);
			config.setDatabase(dbIndex);
			LettuceConnectionFactory factory = new LettuceConnectionFactory(config);
			factory.afterPropertiesSet();

			RedisTemplate<String, Object> template = new RedisTemplate<>();
			template.setConnectionFactory(factory);
			return template;
		}
		}*/
	@Bean(name = "redisTemplate0") // 화상 세션용
	public RedisTemplate<String, Object> redisTemplate0() {
		return createRedisTemplate(0);
	}

	@Bean(name = "redisTemplate1") // 채팅 세션용
	public RedisTemplate<String, Object> redisTemplate1() {
		return createRedisTemplate(1);
	}

	private RedisTemplate<String, Object> createRedisTemplate(int dbIndex) {
		RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(
			props.getHost(), props.getPort()
		);
		config.setDatabase(dbIndex);
		if (props.getPassword() != null && !props.getPassword().isEmpty()) {
			config.setPassword(props.getPassword());
		}

		boolean sslEnabled = props.getSsl() != null && props.getSsl().isEnabled();

		LettuceClientConfiguration.LettuceClientConfigurationBuilder clientBuilder =
			LettuceClientConfiguration.builder();
		if (sslEnabled) {
			clientBuilder.useSsl();
		}
		LettuceClientConfiguration clientCfg = clientBuilder.build();

		LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientCfg);
		factory.afterPropertiesSet();

		RedisTemplate<String, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(factory);
		return template;
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
		RedisTemplate<String, Object> template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);
		template.setKeySerializer(new StringRedisSerializer());
		template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
		template.setHashKeySerializer(new StringRedisSerializer());
		template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
		return template;
	}
}
