package cn.gmkit.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CoreContractsTest {

    @Test
    void securityContextBuilderShouldFallbackToDefaults() {
        GmSecurityContext context = GmSecurityContext.builder()
            .provider(null)
            .secureRandom(null)
            .build();

        assertNotNull(context.provider());
        assertNotNull(context.secureRandom());
        assertTrue(context.registerProvider());
        assertEquals(BcProviders.defaultProvider().getName(), context.provider().getName());
    }
}
