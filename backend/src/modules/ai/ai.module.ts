import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { AppointmentModule } from '../appointment/appointment.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PatientAiChatService } from './patient-ai-chat.service';
import { ChromaService } from './chroma/chroma.service';
import { ClinicIndexerService } from './chroma/clinic-indexer.service';
import { EmbeddingService } from './embedding/embedding.service';
import { AgentRetrievalStage } from './patient-agent/agent-retrieval.stage';
import { AgentContextStage } from './patient-agent/agent-context.stage';
import { AgentPromptStage } from './patient-agent/agent-prompt.stage';
import { PatientAppointmentToolsService } from './patient-agent/langchain/patient-appointment-tools.service';
import { LangChainRagPipelineService } from './patient-agent/langchain/langchain-rag-pipeline.service';
import { LangChainCareAgentService } from './patient-agent/langchain/langchain-care-agent.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    AppointmentModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    PatientAiChatService,
    EmbeddingService,
    ChromaService,
    ClinicIndexerService,
    AgentRetrievalStage,
    AgentContextStage,
    AgentPromptStage,
    PatientAppointmentToolsService,
    LangChainRagPipelineService,
    LangChainCareAgentService,
    PatientGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class AiModule {}
