package cu.graph_tool.config;

import io.undertow.server.handlers.RequestDumpingHandler;
import org.springframework.boot.web.embedded.undertow.UndertowServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

//    @Bean
//    public UndertowServletWebServerFactory undertowServletWebServerFactory() {
//        UndertowServletWebServerFactory factory = new UndertowServletWebServerFactory();
//        factory.addDeploymentInfoCustomizers(deploymentInfo ->
//                deploymentInfo.addInitialHandlerChainWrapper(handler -> {
//                    return new RequestDumpingHandler(handler);
//                }));
//
//        return factory;
//    }
    
}
