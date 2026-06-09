package com.example.server.infrastructure.messaging.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EVENTS_EXCHANGE = "pickly.events.exchange";
    public static final String DLX_EXCHANGE = "pickly.dlx.exchange";

    public static final String NOTIFICATION_DELIVERY_QUEUE = "notification.delivery.queue";
    public static final String NOTIFICATION_DELIVERY_DLX_QUEUE = "notification.delivery.dlq";

    public static final String SCHEDULED_POST_QUEUE = "post.scheduled.publish.queue";
    public static final String SCHEDULED_POST_DLX_QUEUE = "post.scheduled.publish.dlq";

    public static final String RK_NOTIFICATION_COMMENT_CREATED = "notification.comment.created";
    public static final String RK_NOTIFICATION_LIKE_CREATED = "notification.like.created";
    public static final String RK_SCHEDULED_POST_PUBLISH = "post.scheduled.publish";

    @Bean
    MessageConverter messageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    TopicExchange eventsExchange() {
        return ExchangeBuilder.topicExchange(EVENTS_EXCHANGE)
                .durable(true)
                .build();
    }

    @Bean
    DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange(DLX_EXCHANGE)
                .durable(true)
                .build();
    }

    @Bean
    Queue notificationDeliveryQueue() {
        return QueueBuilder.durable(NOTIFICATION_DELIVERY_QUEUE)
                .deadLetterExchange(DLX_EXCHANGE)
                .deadLetterRoutingKey("notification.delivery.failed")
                .build();
    }

    @Bean
    Queue notificationDeliveryDlq() {
        return QueueBuilder.durable(NOTIFICATION_DELIVERY_DLX_QUEUE).build();
    }

    @Bean
    Binding notificationCommentBinding() {
        return BindingBuilder.bind(notificationDeliveryQueue())
                .to(eventsExchange())
                .with(RK_NOTIFICATION_COMMENT_CREATED);
    }

    @Bean
    Binding notificationLikeBinding() {
        return BindingBuilder.bind(notificationDeliveryQueue())
                .to(eventsExchange())
                .with(RK_NOTIFICATION_LIKE_CREATED);
    }

    @Bean
    Binding notificationDlqBinding() {
        return BindingBuilder.bind(notificationDeliveryDlq())
                .to(deadLetterExchange())
                .with("notification.delivery.failed");
    }

    @Bean
    Queue scheduledPostQueue() {
        return QueueBuilder.durable(SCHEDULED_POST_QUEUE)
                .deadLetterExchange(DLX_EXCHANGE)
                .deadLetterRoutingKey("post.scheduled.publish.failed")
                .build();
    }

    @Bean
    Queue scheduledPostDlq() {
        return QueueBuilder.durable(SCHEDULED_POST_DLX_QUEUE).build();
    }

    @Bean
    Binding scheduledPostBinding() {
        return BindingBuilder.bind(scheduledPostQueue())
                .to(eventsExchange())
                .with(RK_SCHEDULED_POST_PUBLISH);
    }

    @Bean
    Binding scheduledPostDlqBinding() {
        return BindingBuilder.bind(scheduledPostDlq())
                .to(deadLetterExchange())
                .with("post.scheduled.publish.failed");
    }
}
