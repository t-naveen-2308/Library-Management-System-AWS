package com.library.handlers;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.library.Application;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ApiHandler implements RequestHandler<AwsProxyRequest, AwsProxyResponse> {
    
    private static final Logger logger = LoggerFactory.getLogger(ApiHandler.class);
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;

    static {
        try {
            logger.info("Initializing Spring Boot Lambda Container Handler");
            handler = SpringBootLambdaContainerHandler.getAwsProxyHandler(Application.class);
            // Profiles can be set here if needed: handler.activateSpringProfiles("lambda");
        } catch (ContainerInitializationException e) {
            // if we fail here. We re-throw the exception to force another cold start
            logger.error("Could not initialize Spring Boot application", e);
            throw new RuntimeException("Could not initialize Spring Boot application", e);
        }
    }

    @Override
    public AwsProxyResponse handleRequest(AwsProxyRequest awsProxyRequest, Context context) {
        logger.debug("Handling request: {} {}", awsProxyRequest.getHttpMethod(), awsProxyRequest.getPath());
        return handler.proxy(awsProxyRequest, context);
    }
}
