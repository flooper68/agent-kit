-- Add providerMetadata column to store Gemini thought_signature and other provider-specific metadata
ALTER TABLE "agent_session_events" ADD COLUMN "provider_metadata" jsonb;
