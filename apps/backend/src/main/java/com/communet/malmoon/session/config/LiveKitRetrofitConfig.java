package com.communet.malmoon.session.config;

import io.livekit.server.RoomService;
import io.livekit.server.RoomServiceClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import retrofit2.Retrofit;
import retrofit2.converter.protobuf.ProtoConverterFactory;


@Configuration
public class LiveKitRetrofitConfig {

    @Bean
    public Retrofit retrofit(LiveKitConfig liveKitConfig) {
        return new Retrofit.Builder()
                .baseUrl(liveKitConfig.getHost())
                .addConverterFactory(ProtoConverterFactory.create())
                .build();
    }

    @Bean
    public RoomService roomService(Retrofit retrofit) {
        return retrofit.create(RoomService.class);
    }

    @Bean
    public RoomServiceClient roomServiceClient(RoomService roomService, LiveKitConfig liveKitConfig) {
        return new RoomServiceClient(roomService, liveKitConfig.getApiKey(), liveKitConfig.getApiSecret());
    }
}
