package com.eodigage.franchise.api.status;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/status")
@Tag(name = "franchise")
public class StatusController {

    @GetMapping
    @Operation(operationId = "getFranchiseServiceStatus", summary = "Get franchise service status")
    public StatusResponse getStatus() {
        return new StatusResponse("franchise-service", true);
    }

    public record StatusResponse(String service, boolean ok) {
    }
}
