package payroll;

import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Component
@EnableWebSocketMessageBroker //turn on websocket support
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {
//WebSocketMessageBrokerConfigurer provides convenient base class to configure basic features

    static final String MESSAGE_PREFIX = "/topic"; //MESSAGE_PREFIX is the prefix you will prepend to every message’s route.

    //registerStompEndpoints() is used to configure the endpoint on the backend for clients and server to link (/payroll).
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/payroll").withSockJS();
    }

    //configureMessageBroker() is used to configure the broker used to relay messages between server and client.
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(MESSAGE_PREFIX);
        registry.setApplicationDestinationPrefixes("/app");
    }
}